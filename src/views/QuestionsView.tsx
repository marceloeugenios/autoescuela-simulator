import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import type { Question } from '../types'

const PAGE_SIZE = 30

type ImageFilter = 'all' | 'with' | 'without'

export default function QuestionsView() {
  const { questions, testGroups, retryQueue } = useApp()

  const [keyword, setKeyword] = useState('')
  const [testFilter, setTestFilter] = useState('all')
  const [imageFilter, setImageFilter] = useState<ImageFilter>('all')
  const [retryOnly, setRetryOnly] = useState(false)
  const [page, setPage] = useState(1)

  const allQuestions = useMemo(() => Object.values(questions), [questions])
  const groupNames = useMemo(() => Object.keys(testGroups).sort(), [testGroups])

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return allQuestions.filter(q => {
      if (kw && !q.question.toLowerCase().includes(kw) && !q.explanation.toLowerCase().includes(kw) && !String(q.id).includes(kw)) return false
      if (testFilter === 'bank') { if (q.tests.length > 0) return false }
      else if (testFilter !== 'all') { if (!q.tests.some(t => t.name === testFilter)) return false }
      if (imageFilter === 'with' && !q.image) return false
      if (imageFilter === 'without' && q.image) return false
      if (retryOnly && !retryQueue.includes(q.id)) return false
      return true
    })
  }, [allQuestions, keyword, testFilter, imageFilter, retryOnly, retryQueue])

  const paginated = filtered.slice(0, page * PAGE_SIZE)

  const resetPage = () => setPage(1)

  return (
    <section className="view">
      <div className="home-header">
        <h2>Question Bank</h2>
        <p>{filtered.length.toLocaleString()} of {allQuestions.length.toLocaleString()} questions</p>
      </div>

      <div className="filter-bar">
        <input
          className="filter-search"
          type="search"
          placeholder="Search questions and explanations…"
          value={keyword}
          onChange={e => { setKeyword(e.target.value); resetPage() }}
        />

        <div className="filter-row">
          <select
            className="filter-select"
            value={testFilter}
            onChange={e => { setTestFilter(e.target.value); resetPage() }}
          >
            <option value="all">All tests</option>
            {groupNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
            <option value="bank">Bank (no test)</option>
          </select>

          <select
            className="filter-select"
            value={imageFilter}
            onChange={e => { setImageFilter(e.target.value as ImageFilter); resetPage() }}
          >
            <option value="all">Any image</option>
            <option value="with">Has image</option>
            <option value="without">No image</option>
          </select>

          <button
            className={`filter-chip${retryOnly ? ' active' : ''}`}
            onClick={() => { setRetryOnly(v => !v); resetPage() }}
          >
            Retry queue
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 40 }}>
          No questions match your filters.
        </p>
      ) : (
        <>
          <div className="question-bank-list">
            {paginated.map(q => (
              <QuestionCard key={q.id} question={q} inRetryQueue={retryQueue.includes(q.id)} />
            ))}
          </div>
          {paginated.length < filtered.length && (
            <button
              className="secondary-btn w-full"
              style={{ marginTop: 16 }}
              onClick={() => setPage(p => p + 1)}
            >
              Load more — {filtered.length - paginated.length} remaining
            </button>
          )}
        </>
      )}
    </section>
  )
}

function QuestionCard({ question: q, inRetryQueue }: { question: Question; inRetryQueue: boolean }) {
  const [open, setOpen] = useState(false)

  return (
    <div className={`qbank-card${open ? ' open' : ''}`}>
      <button className="qbank-header" onClick={() => setOpen(v => !v)}>
        <div className="qbank-badges">
          {q.tests.length > 0
            ? q.tests.map(t => <span key={t.cditest} className="qbank-badge badge-test">{t.name}</span>)
            : <span className="qbank-badge badge-bank">bank</span>}
          {q.image && <span className="qbank-badge badge-image">img</span>}
          {inRetryQueue && <span className="qbank-badge badge-retry">retry</span>}
        </div>
        <p className="qbank-question"><span style={{ fontSize: 11, opacity: 0.5, marginRight: 6 }}>#{q.id}</span>{q.question}</p>
        <svg
          className="qbank-chevron"
          width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="qbank-body">
          {q.image && (
            <div className="image-wrapper" style={{ marginBottom: 16 }}>
              <img src={`/${q.image}`} alt="Question illustration" />
            </div>
          )}
          <ul className="qbank-answers">
            {q.answers.map((ans, i) => (
              <li key={i} className={`qbank-answer${ans.correct ? ' correct' : ''}`}>
                {ans.text}
              </li>
            ))}
          </ul>
          <p className="qbank-explanation">{q.explanation}</p>
        </div>
      )}
    </div>
  )
}
