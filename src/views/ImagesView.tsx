import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import type { Question } from '../types'

const PAGE_SIZE = 48

export default function ImagesView() {
  const { questions, retryQueue } = useApp()
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Question | null>(null)

  const imageQuestions = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return Object.values(questions).filter(
      q => q.image && (!kw || q.question.toLowerCase().includes(kw) || q.explanation.toLowerCase().includes(kw)),
    )
  }, [questions, keyword])

  const paginated = imageQuestions.slice(0, page * PAGE_SIZE)

  return (
    <section className="view">
      <div className="home-header">
        <h2>Images</h2>
        <p>{imageQuestions.length.toLocaleString()} question images</p>
      </div>

      <input
        className="filter-search"
        type="search"
        placeholder="Filter by question text…"
        value={keyword}
        onChange={e => { setKeyword(e.target.value); setPage(1) }}
        style={{ marginBottom: 16 }}
      />

      <div className="image-grid">
        {paginated.map(q => (
          <button key={q.id} className="image-grid-item" onClick={() => setSelected(q)}>
            <img src={`/${q.image}`} alt="" loading="lazy" />
          </button>
        ))}
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

      {selected &&
        createPortal(
          <QuestionModal
            question={selected}
            inRetryQueue={retryQueue.includes(selected.id)}
            onClose={() => setSelected(null)}
          />,
          document.body,
        )}
    </section>
  )
}

function QuestionModal({
  question: q,
  inRetryQueue,
  onClose,
}: {
  question: Question
  inRetryQueue: boolean
  onClose: () => void
}) {
  const [showQuestion, setShowQuestion] = useState(false)
  const { testGroups } = useApp()
  const navigate = useNavigate()

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="modal-image-wrapper">
          <img src={`/${q.image}`} alt="Question illustration" />
        </div>

        {!showQuestion ? (
          <button
            className="primary-btn w-full"
            style={{ marginTop: 16 }}
            onClick={() => setShowQuestion(true)}
          >
            See related question
          </button>
        ) : (
          <div className="modal-question-details">
            <div className="qbank-badges" style={{ marginBottom: 12 }}>
              {q.tests.length > 0
                ? q.tests.map(t => <span key={t.cditest} className="qbank-badge badge-test">{t.name}</span>)
                : <span className="qbank-badge badge-bank">bank</span>}
              {inRetryQueue && <span className="qbank-badge badge-retry">retry</span>}
            </div>

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
                  const label = `Go to Test ${t.name} · Part ${partIndex + 1}`
                  return (
                    <button
                      key={t.cditest}
                      className="secondary-btn w-full"
                      onClick={() => { onClose(); navigate(`/test/${t.cditest}`) }}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
