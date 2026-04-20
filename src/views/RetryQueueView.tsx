import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function RetryQueueView() {
  const navigate = useNavigate()
  const { retryQueue, questions, removeFromRetryQueue, clearRetryQueue } = useApp()
  const empty = retryQueue.length === 0

  return (
    <section className="view">
      <div className="home-header">
        <h2>Your Retry Queue</h2>
        <p>Master the questions you missed</p>
      </div>

      <div className="retry-actions">
        <button
          className="primary-btn w-full"
          disabled={empty}
          onClick={() => navigate('/test/retry')}
        >
          Start Custom Test
        </button>
        <button
          className="destructive-btn w-full mt-3"
          disabled={empty}
          onClick={() => {
            if (confirm('Clear your entire retry queue?')) clearRetryQueue()
          }}
        >
          Clear Queue
        </button>
      </div>

      <div className="retry-list-container">
        {empty ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 40 }}>
            No questions in queue. Great job!
          </p>
        ) : (
          retryQueue.map(id => {
            const q = questions[id]
            if (!q) return null
            return (
              <div key={id} className="retry-list-item">
                <p>{q.question}</p>
                <button className="remove-btn" title="Remove" onClick={() => removeFromRetryQueue(id)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}
