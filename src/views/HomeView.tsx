import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function HomeView() {
  const { testGroups, groupNames, currentGroupIndex, setCurrentGroupIndex, retryQueue } = useApp()
  const navigate = useNavigate()

  if (groupNames.length === 0) return null

  const idx = Math.min(currentGroupIndex, groupNames.length - 1)
  const name = groupNames[idx]
  const tests = testGroups[name]

  return (
    <section className="view">
      <div className="home-header">
        <h2>Driving Tests</h2>
        <p>A1/A2 motorcycle driving theory exams</p>
      </div>

      {retryQueue.length > 0 && (
        <div className="card retry-card" onClick={() => navigate('/retry')} style={{ cursor: 'pointer' }}>
          <div className="card-content">
            <h3 className="gradient-text">To Be Retried</h3>
            <p>{retryQueue.length} questions queued</p>
          </div>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <button className="secondary-btn" style={{ flex: 1 }} onClick={() => navigate('/questions')}>
          Question Bank
        </button>
        <button className="secondary-btn" style={{ flex: 1 }} onClick={() => navigate('/images')}>
          Browse Images
        </button>
      </div>

      <div className="test-selector">
        <div className="test-nav">
          <button
            className="nav-arrow-btn"
            disabled={idx === 0}
            onClick={() => setCurrentGroupIndex(idx - 1)}
            aria-label="Previous test"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <select
            className="test-group-select"
            value={idx}
            onChange={e => setCurrentGroupIndex(Number(e.target.value))}
          >
            {groupNames.map((n, i) => (
              <option key={n} value={i}>Test {n}</option>
            ))}
          </select>

          <button
            className="nav-arrow-btn"
            disabled={idx === groupNames.length - 1}
            onClick={() => setCurrentGroupIndex(idx + 1)}
            aria-label="Next test"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        <div className="test-parts-card">
          {tests.map((test, i) => (
            <button
              key={test.cditest}
              className="test-part-btn"
              onClick={() => navigate(`/test/${test.cditest}`)}
            >
              <span className="part-label">Part {i + 1}</span>
              <span className="part-questions">{test.question_ids?.length ?? '?'} questions</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
