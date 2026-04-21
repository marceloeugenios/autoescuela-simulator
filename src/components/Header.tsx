import { useNavigate, useLocation } from 'react-router-dom'

const TITLES: Record<string, string> = {
  '/': 'Simulator',
  '/retry': 'Retry Queue',
  '/result': 'Test Result',
  '/questions': 'Question Bank',
  '/images': 'Images',
}

export default function Header() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const isTest = pathname.startsWith('/test/')
  const showBack = pathname !== '/'
  const title = isTest ? 'Test in Progress' : (TITLES[pathname] ?? 'Simulator')

  const handleBack = () => {
    if (isTest) {
      if (confirm('Exit the current test? Progress will be lost.')) navigate('/')
    } else {
      navigate(-1)
    }
  }

  return (
    <header className="app-header glassmorphism">
      {showBack ? (
        <button className="header-btn" onClick={handleBack} aria-label="Go Back">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
      ) : (
        <div style={{ width: 40, height: 40 }} />
      )}
      <h1 id="header-title">{title}</h1>
      <div style={{ width: 40, height: 40 }} />
    </header>
  )
}
