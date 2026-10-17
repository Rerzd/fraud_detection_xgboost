import { useEffect, useState } from 'react'
import AppHeader from './components/AppHeader'
import OfflineBanner from './components/OfflineBanner'
import TabNav from './components/TabNav'
import EmptyState from './components/ui/EmptyState'
import Panel from './components/ui/Panel'
import useHealth from './hooks/useHealth'

const TABS = [
  { id: 'analyze', label: 'Analyze', icon: 'pulse' },
  { id: 'batch', label: 'Batch', icon: 'layers' },
  { id: 'history', label: 'History', icon: 'clock' },
  { id: 'model', label: 'Model', icon: 'cpu' },
]

function tabFromHash() {
  const id = window.location.hash.slice(1)
  return TABS.some((t) => t.id === id) ? id : 'analyze'
}

export default function App() {
  const { status, modelVersion } = useHealth()
  const [tab, setTab] = useState(tabFromHash)

  useEffect(() => {
    const onHashChange = () => setTab(tabFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  function changeTab(id) {
    setTab(id)
    window.history.replaceState(null, '', `#${id}`)
  }

  const current = TABS.find((t) => t.id === tab)

  return (
    <div className="min-h-screen">
      <AppHeader status={status} modelVersion={modelVersion} />
      {status === 'offline' && <OfflineBanner />}
      <TabNav tabs={TABS} active={tab} onChange={changeTab} />
      <main
        id={`panel-${tab}`}
        role="tabpanel"
        aria-labelledby={`tab-${tab}`}
        className="mx-auto max-w-7xl px-4 py-6 sm:px-6"
      >
        <Panel title={current.label}>
          <EmptyState icon={current.icon} title={`${current.label} view`}>
            This section is being rebuilt.
          </EmptyState>
        </Panel>
      </main>
    </div>
  )
}
