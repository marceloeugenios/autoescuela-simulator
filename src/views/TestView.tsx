import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import type { Question } from '../types'

function formatTime(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export default function TestView() {
  const { testId } = useParams<{ testId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { questions, tests, retryQueue, addToRetryQueue } = useApp()

  const [questionList, setQuestionList] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [mistakes, setMistakes] = useState<number[]>([])
  const [answered, setAnswered] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [timer, setTimer] = useState(0)

  // Capture retryQueue at test-start time so mid-test queue changes don't reset the view
  const retryQueueSnapshot = useRef(retryQueue)

  useEffect(() => {
    const ids =
      testId === 'retry'
        ? retryQueueSnapshot.current
        : testId === 'image-test'
          ? ((location.state as { questionIds?: number[] })?.questionIds ?? [])
          : (tests[Number(testId)]?.question_ids ?? [])

    const qs = ids.map(id => questions[id]).filter(Boolean) as Question[]
    if (qs.length === 0) { navigate('/'); return }

    setQuestionList(qs)
    setCurrentIndex(0)
    setMistakes([])
    setAnswered(false)
    setSelectedIdx(null)
    setTimer(0)
  }, [testId, questions, tests])

  useEffect(() => {
    if (questionList.length === 0) return
    const interval = setInterval(() => setTimer(t => t + 1), 1000)
    return () => clearInterval(interval)
  }, [questionList])

  const handleAnswer = (ansIdx: number, isCorrect: boolean) => {
    if (answered) return
    setAnswered(true)
    setSelectedIdx(ansIdx)
    if (!isCorrect) setMistakes(prev => [...prev, questionList[currentIndex].id])
  }

  const handleNext = () => {
    if (currentIndex + 1 >= questionList.length) {
      // Add new mistakes to retry queue (deduplicated)
      const snapshot = retryQueueSnapshot.current
      const newMistakes = mistakes.filter(id => !snapshot.includes(id))
      // Also include current question's mistake if it just happened
      const q = questionList[currentIndex]
      if (answered && selectedIdx !== null && !questionList[currentIndex].answers[selectedIdx].correct) {
        if (!mistakes.includes(q.id) && !snapshot.includes(q.id)) {
          newMistakes.push(q.id)
        }
      }
      if (newMistakes.length > 0) addToRetryQueue(newMistakes)

      navigate('/result', {
        state: { questions: questionList, mistakes, timerSeconds: timer, testId },
      })
    } else {
      setCurrentIndex(i => i + 1)
      setAnswered(false)
      setSelectedIdx(null)
    }
  }

  if (questionList.length === 0) return null

  const q = questionList[currentIndex]
  const progress = ((currentIndex + 1) / questionList.length) * 100

  return (
    <section className="view">
      <div id="test-progress-bar">
        <div id="test-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="test-header row-between">
        <span>Question {currentIndex + 1} / {questionList.length}</span>
        <span className="test-timer">{formatTime(timer)}</span>
      </div>

      <div className="question-container">
        {q.image && (
          <div className="image-wrapper">
            <img src={`/${q.image}`} alt="Question illustration" />
          </div>
        )}

        <h2 className="question-text">{q.question}</h2>

        <div className="answers-container">
          {q.answers.map((ans, i) => {
            let cls = 'answer-btn'
            if (answered) {
              if (ans.correct) cls += ' correct'
              if (i === selectedIdx && !ans.correct) cls += ' incorrect'
              if (i === selectedIdx) cls += ' selected'
            }
            return (
              <button key={i} className={cls} onClick={() => handleAnswer(i, ans.correct)}>
                {ans.text}
              </button>
            )
          })}
        </div>

        {answered && (
          <div className="explanation-container glassmorphism">
            <h3>Explanation</h3>
            <p>{q.explanation}</p>
            <button className="primary-btn" onClick={handleNext}>
              {currentIndex + 1 >= questionList.length ? 'Finish Test' : 'Next Question'}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
