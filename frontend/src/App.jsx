import { useEffect, useRef, useState } from 'react'
import { API_URL } from './api'
import AnalyzeTab from './components/analyze/AnalyzeTab'
import BatchTab from './components/batch/BatchTab'
import HistoryTab from './components/history/HistoryTab'
import ModelTab from './components/model/ModelTab'
import AppHeader from './components/shell/AppHeader'
import OfflineBanner from './components/shell/OfflineBanner'
import { MobileNav, SideNav } from './components/shell/SideNav'
import StatusBar from './components/shell/StatusBar'
import useHealth from './hooks/useHealth'
import useModelInfo from './hooks/useModelInfo'
import { pageById, pageFromHash } from './pages'

export default function App() {
  const { status, modelVersion, refresh } = useHealth()
  const [page, setPage] = useState(() => pageFromHash(window.location.hash))
  const online = status === 'online'
  const { info: modelInfo, error: modelError } = useModelInfo(online)
  const mainRef = useRef(null)

  useEffect(() => {
    const onHashChange = () => setPage(pageFromHash(window.location.hash))
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    document.title = `${pageById(page).label} · Fraud Risk Test Bench`
  }, [page])

  return (
    <div className="flex min-h-dvh flex-col">
      {/* A hash link would change the page, so the skip link moves focus instead. */}
      <a
        href="#main"
        onClick={(e) => {
          e.preventDefault()
          mainRef.current?.focus()
        }}
        className="sr-only focus:not-sr-only focus:absolute focus:top-14 focus:left-2 focus:z-50 focus:rounded focus:bg-surface focus:px-3 focus:py-1.5 focus:text-[13px] focus:text-ink focus:outline-2 focus:outline-brand-700"
      >
        Skip to content
      </a>
      <AppHeader status={status} modelVersion={modelVersion} />
      {status === 'offline' && <OfflineBanner onRetry={refresh} />}
      <MobileNav active={page} />
      <div className="flex flex-1">
        <aside className="hidden w-[220px] shrink-0 border-r border-line-strong bg-surface md:block">
          <SideNav active={page} />
        </aside>
        <main id="main" ref={mainRef} tabIndex={-1} className="min-w-0 flex-1 px-4 py-4 focus:outline-none md:px-6 md:py-5">
          <div className="mx-auto max-w-[1320px]">
            {page === 'analyze' ? (
              <AnalyzeTab thresholds={modelInfo?.thresholds} online={online} />
            ) : page === 'batch' ? (
              <BatchTab online={online} />
            ) : page === 'history' ? (
              <HistoryTab online={online} />
            ) : (
              <ModelTab info={modelInfo} error={modelError} online={online} />
            )}
          </div>
        </main>
      </div>
      <StatusBar apiUrl={API_URL} status={status} thresholds={modelInfo?.thresholds} />
    </div>
  )
}
