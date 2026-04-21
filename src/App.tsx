import { HashRouter, Routes, Route } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import Header from './components/Header'
import HomeView from './views/HomeView'
import TestView from './views/TestView'
import ResultView from './views/ResultView'
import RetryQueueView from './views/RetryQueueView'
import QuestionsView from './views/QuestionsView'
import ImagesView from './views/ImagesView'

function AppShell() {
  const { loading } = useApp()

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading…</p>
      </div>
    )
  }

  return (
    <>
      <Header />
      <main className="app-content">
        <Routes>
          <Route path="/" element={<HomeView />} />
          <Route path="/test/:testId" element={<TestView />} />
          <Route path="/result" element={<ResultView />} />
          <Route path="/retry" element={<RetryQueueView />} />
          <Route path="/questions" element={<QuestionsView />} />
          <Route path="/images" element={<ImagesView />} />
        </Routes>
      </main>
    </>
  )
}

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <AppShell />
      </HashRouter>
    </AppProvider>
  )
}
