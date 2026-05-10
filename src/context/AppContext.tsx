import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Question, Test, QuestionsMap, TestsMap, TestGroups, FocusCategory } from '../types'

const FOCUS_DEFS = [
  { id: 'speed',    label: 'Velocidades',         regex: /velocidad|km\/h|kilómetros por hora/i },
  { id: 'years',    label: 'Años y Plazos',        regex: /año|antigüedad|cumplir/i },
  { id: 'distance', label: 'Distancias y Medidas', regex: /metro|centímetro|distancia|separación/i },
]

interface AppContextValue {
  questions: QuestionsMap
  tests: TestsMap
  testGroups: TestGroups
  groupNames: string[]
  currentGroupIndex: number
  setCurrentGroupIndex: (i: number) => void
  retryQueue: number[]
  addToRetryQueue: (ids: number[]) => void
  removeFromRetryQueue: (id: number) => void
  clearRetryQueue: () => void
  focusCategories: FocusCategory[]
  loading: boolean
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [questions, setQuestions] = useState<QuestionsMap>({})
  const [tests, setTests] = useState<TestsMap>({})
  const [testGroups, setTestGroups] = useState<TestGroups>({})
  const [groupNames, setGroupNames] = useState<string[]>([])
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [focusCategories, setFocusCategories] = useState<FocusCategory[]>([])
  const [retryQueue, setRetryQueue] = useState<number[]>(() =>
    JSON.parse(localStorage.getItem('retryQueue') || '[]'),
  )

  useEffect(() => {
    Promise.all([
      fetch('/questions/questions.json').then(r => r.json()),
      fetch('/questions/tests.json').then(r => r.json()),
    ])
      .then(([questionsRaw, testsRaw]: [Question[], Test[]]) => {
        const qMap: QuestionsMap = {}
        questionsRaw.forEach(q => { qMap[q.id] = q })

        const tMap: TestsMap = {}
        const groups: TestGroups = {}
        testsRaw.forEach(t => {
          tMap[t.cditest] = t
          if (!groups[t.name]) groups[t.name] = []
          groups[t.name].push(t)
        })

        setQuestions(qMap)
        setTests(tMap)
        setTestGroups(groups)
        setGroupNames(Object.keys(groups).sort())

        const cats: FocusCategory[] = FOCUS_DEFS.map(d => ({ id: d.id, label: d.label, questionIds: [] }))
        questionsRaw.forEach(q => {
          const text = q.question + ' ' + q.explanation
          for (let i = 0; i < FOCUS_DEFS.length; i++) {
            if (FOCUS_DEFS[i].regex.test(text)) {
              cats[i].questionIds.push(q.id)
              break
            }
          }
        })
        setFocusCategories(cats)

        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load data', err)
        setLoading(false)
      })
  }, [])

  const persist = (queue: number[]) => {
    setRetryQueue(queue)
    localStorage.setItem('retryQueue', JSON.stringify(queue))
  }

  const addToRetryQueue = (ids: number[]) =>
    setRetryQueue(prev => {
      const next = [...prev, ...ids.filter(id => !prev.includes(id))]
      localStorage.setItem('retryQueue', JSON.stringify(next))
      return next
    })

  const removeFromRetryQueue = (id: number) => persist(retryQueue.filter(i => i !== id))
  const clearRetryQueue = () => persist([])

  return (
    <AppContext.Provider
      value={{
        questions, tests, testGroups, groupNames,
        currentGroupIndex, setCurrentGroupIndex,
        retryQueue, addToRetryQueue, removeFromRetryQueue, clearRetryQueue,
        focusCategories,
        loading,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
