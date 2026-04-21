import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import type { Question } from '../types'

const PAGE_SIZE = 48

export default function ImagesView() {
  const { questions } = useApp()
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Question | null>(null)
  const [selectMode, setSelectMode] = useState(false)
  const [pickedIds, setPickedIds] = useState<Set<number>>(new Set())

  const imageQuestions = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return Object.values(questions).filter(q => {
      if (!q.image) return false
      if (kw && !q.question.toLowerCase().includes(kw) && !q.explanation.toLowerCase().includes(kw)) return false
      return true
    })
  }, [questions, keyword])

  const paginated = imageQuestions.slice(0, page * PAGE_SIZE)

  const togglePicked = (q: Question) => {
    setPickedIds(prev => {
      const next = new Set(prev)
      if (next.has(q.id)) next.delete(q.id)
      else next.add(q.id)
      return next
    })
  }

  const handleGridClick = (q: Question) => {
    if (selectMode) togglePicked(q)
    else setSelected(q)
  }

  const exitSelectMode = () => {
    setSelectMode(false)
    setPickedIds(new Set())
  }

  const startTest = () => {
    navigate('/test/image-test', { state: { questionIds: [...pickedIds] } })
  }

  return (
    <section className="view">
      <div className="home-header">
        <h2>Images</h2>
        <p>{imageQuestions.length.toLocaleString()} question images</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          className="filter-search"
          type="search"
          placeholder="Filter by question text…"
          value={keyword}
          onChange={e => { setKeyword(e.target.value); setPage(1) }}
          style={{ flex: 1, marginBottom: 0 }}
        />
        <button
          className={selectMode ? 'primary-btn' : 'secondary-btn'}
          style={{ whiteSpace: 'nowrap' }}
          onClick={() => { setSelectMode(m => !m); setPickedIds(new Set()) }}
        >
          {selectMode ? 'Cancel' : 'Select for test'}
        </button>
      </div>

      <div className="image-grid">
        {paginated.map(q => {
          const isPicked = pickedIds.has(q.id)
          return (
            <button
              key={q.id}
              className={`image-grid-item${isPicked ? ' image-grid-item--selected' : ''}`}
              onClick={() => handleGridClick(q)}
              aria-pressed={selectMode ? isPicked : undefined}
            >
              <img src={`/${q.image}`} alt="" loading="lazy" />
              {selectMode && isPicked && (
                <span className="image-grid-check">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
              )}
            </button>
          )
        })}
      </div>

      {paginated.length < imageQuestions.length && (
        <button
          className="secondary-btn w-full"
          style={{ marginTop: 16 }}
          onClick={() => setPage(p => p + 1)}
        >
          Load more — {imageQuestions.length - paginated.length} remaining
        </button>
      )}

      {selectMode && pickedIds.size > 0 && (
        <div className="image-test-bar">
          <span>{pickedIds.size} image{pickedIds.size !== 1 ? 's' : ''} selected</span>
          <button className="secondary-btn" onClick={exitSelectMode}>Clear</button>
          <button className="primary-btn" onClick={startTest}>Start Test</button>
        </div>
      )}

      {!selectMode && selected &&
        createPortal(
          <QuestionModal
            question={selected}
            onClose={() => setSelected(null)}
          />,
          document.body,
        )}
    </section>
  )
}

function QuestionEntry({
  q,
  onClose,
}: {
  q: Question
  onClose: () => void
}) {
  const { testGroups, retryQueue } = useApp()
  const navigate = useNavigate()
  const inRetryQueue = retryQueue.includes(q.id)

  return (
    <div className="modal-question-details">
      <div className="qbank-badges" style={{ marginBottom: 12 }}>
        {q.tests.length > 0
          ? q.tests.map(t => <span key={t.cditest} className="qbank-badge badge-test">{t.name}</span>)
          : <span className="qbank-badge badge-bank">bank</span>}
        {inRetryQueue && <span className="qbank-badge badge-retry">retry</span>}
      </div>

      <p style={{ fontSize: 12, color: 'var(--color-text-muted, #888)', marginBottom: 4 }}>#{q.id}</p>
      <p className="modal-question">{q.question}</p>

      <ul className="qbank-answers">
        {q.answers.map((ans, i) => (
          <li key={i} className={`qbank-answer${ans.correct ? ' correct' : ''}`}>
            {ans.correct && (
              <svg className="answer-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
            {ans.text}
          </li>
        ))}
      </ul>

      <p className="qbank-explanation">{q.explanation}</p>

      {q.tests.length > 0 && (
        <div className="modal-test-links">
          {q.tests.map(t => {
            const partIndex = (testGroups[t.name] ?? []).findIndex(ts => ts.cditest === t.cditest)
            return (
              <button
                key={t.cditest}
                className="secondary-btn w-full"
                onClick={() => { onClose(); navigate(`/test/${t.cditest}`) }}
              >
                Go to Test {t.name} · Part {partIndex + 1}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function QuestionModal({
  question: q,
  onClose,
}: {
  question: Question
  onClose: () => void
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="modal-image-wrapper" onClick={onClose} style={{ cursor: 'default' }}>
          <img src={`/${q.image}`} alt="Question illustration" />
        </div>

        <QuestionEntry q={q} onClose={onClose} />
      </div>
    </div>
  )
}
