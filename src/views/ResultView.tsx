import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useApp } from '../context/AppContext'
import type { TestResult } from '../types'

function formatTime(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export default function ResultView() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { questions } = useApp()

  useEffect(() => {
    if (!state) navigate('/')
  }, [state, navigate])

  if (!state) return null

  const { questions: testQuestions, mistakes, timerSeconds, testId } = state as TestResult
  const total = testQuestions.length
  const correct = total - mistakes.length
  const pass = mistakes.length <= 2

  return (
    <section className="view">
      <div className="result-header">
        <div id="result-status-icon" className={pass ? 'status-pass' : 'status-fail'}>
          {pass ? '✅' : '❌'}
        </div>
        <h2 id="result-title">{pass ? 'Test Passed!' : 'Test Failed'}</h2>
        <p id="result-score">{correct} / {total} Correct</p>
        <p id="result-time" className="time-taken">Time taken: {formatTime(timerSeconds)}</p>
      </div>

      <div className="result-actions">
        <button className="primary-btn" onClick={() => navigate(`/test/${testId}`)}>
          Retry Test
        </button>
        <button className="secondary-btn" onClick={() => navigate('/')}>
          Back to Home
        </button>
      </div>

      <div className="mistakes-log">
        <h3>Mistakes Log</h3>
        {mistakes.length === 0 ? (
          <p>Perfect score! No mistakes made.</p>
        ) : (
          <>
            <p>These questions have been added to your Retry Queue.</p>
            {mistakes.map(id => {
              const q = questions[id]
              return q ? (
                <div key={id} className="card mt-3">
                  <p style={{ fontWeight: 600, marginBottom: 8 }}>{q.question}</p>
                  <p style={{ fontSize: '0.9rem', color: 'var(--error-color)', marginBottom: 8 }}>
                    You answered incorrectly.
                  </p>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', paddingLeft: 10, borderLeft: '2px solid var(--primary-color)' }}>
                    {q.explanation}
                  </p>
                </div>
              ) : null
            })}
          </>
        )}
      </div>
    </section>
  )
}
