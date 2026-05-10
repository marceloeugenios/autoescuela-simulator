import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function FocusTestsView() {
  const { focusCategories } = useApp()
  const navigate = useNavigate()

  const launch = (questionIds: number[]) => {
    navigate('/test/focus-test', { state: { questionIds } })
  }

  return (
    <section className="view">
      <div className="home-header">
        <h2>Focus Tests</h2>
        <p>Drill questions grouped by numerical topic</p>
      </div>

      {focusCategories.map(cat => (
        <div
          key={cat.id}
          className="card"
          onClick={() => launch(cat.questionIds)}
          style={{ cursor: 'pointer', marginBottom: 12 }}
        >
          <div className="card-content">
            <h3>{cat.label}</h3>
            <p>{cat.questionIds.length} questions</p>
          </div>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      ))}
    </section>
  )
}
