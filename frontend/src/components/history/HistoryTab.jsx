import { useEffect, useState } from 'react'
import { clearHistory, getHistory, getStats } from '../../api'
import { Page } from '../shell/PageHeader'
import Button from '../ui/Button'
import Callout from '../ui/Callout'
import ConfirmDialog from '../ui/ConfirmDialog'
import EmptyState from '../ui/EmptyState'
import Icon from '../ui/Icon'
import Panel from '../ui/Panel'
import Spinner from '../ui/Spinner'
import Tabs, { TabPanel } from '../ui/Tabs'
import HistorySummary from './HistorySummary'
import HistoryTable from './HistoryTable'

const LIMIT = 50

export default function HistoryTab({ online }) {
  const [filter, setFilter] = useState('all')
  const [refresh, setRefresh] = useState(0)
  const [data, setData] = useState({ key: null, stats: null, items: [], error: null })
  const [confirming, setConfirming] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [notice, setNotice] = useState(null)

  const key = `${filter}:${refresh}`
  const loading = online && data.key !== key

  useEffect(() => {
    if (!online) return
    let cancelled = false
    const riskLevel = filter === 'all' ? undefined : filter
    Promise.all([getStats(), getHistory({ limit: LIMIT, riskLevel })])
      .then(([stats, items]) => !cancelled && setData({ key, stats, items, error: null }))
      .catch((err) => !cancelled && setData((d) => ({ ...d, key, error: err.message })))
    return () => {
      cancelled = true
    }
  }, [online, filter, key])

  async function confirmClear() {
    setClearing(true)
    try {
      const { deleted } = await clearHistory()
      setNotice({
        tone: 'info',
        text: `Deleted ${deleted.toLocaleString('en-US')} ${deleted === 1 ? 'record' : 'records'}.`,
      })
      setFilter('all')
      setRefresh((n) => n + 1)
    } catch (err) {
      setNotice({ tone: 'danger', text: err.message })
    } finally {
      setClearing(false)
      setConfirming(false)
    }
  }

  const { stats, items, error } = data
  const total = stats?.total ?? 0

  const actions = online && (
    <>
      <Button onClick={() => setRefresh((n) => n + 1)} loading={loading}>
        {!loading && <Icon name="refresh" />}
        Refresh
      </Button>
      <Button variant="danger" onClick={() => setConfirming(true)} disabled={!total}>
        <Icon name="trash" />
        Clear log
      </Button>
    </>
  )

  if (!online) {
    return (
      <Page id="history">
        <Panel title="Records">
          <EmptyState icon="clock" title="Backend offline">
            The audit log is stored by the API. Start the backend to see past predictions.
          </EmptyState>
        </Panel>
      </Page>
    )
  }

  const tabs = stats && [
    { id: 'all', label: 'All', count: stats.total },
    { id: 'high', label: 'High', count: stats.by_risk.high },
    { id: 'review', label: 'Review', count: stats.by_risk.review },
    { id: 'low', label: 'Low', count: stats.by_risk.low },
  ]
  const shownTotal = stats ? (filter === 'all' ? stats.total : stats.by_risk[filter]) : 0

  return (
    <Page id="history" actions={actions}>
      {stats && <HistorySummary stats={stats} />}

      {notice && (
        <Callout tone={notice.tone} role="status">
          {notice.text}
        </Callout>
      )}
      {error && <Callout tone="danger">{error}</Callout>}

      {!stats ? (
        <Panel title="Records">
          <div className="flex justify-center py-10 text-ink-muted">
            <Spinner className="size-5" />
          </div>
        </Panel>
      ) : stats.total === 0 ? (
        <Panel title="Records">
          <EmptyState icon="clock" title="No records yet">
            Run a test in <a href="#analyze" className="font-medium text-brand-700 underline">Single transaction</a> or
            upload a file in <a href="#batch" className="font-medium text-brand-700 underline">Batch run</a>. Every
            result is saved here.
          </EmptyState>
        </Panel>
      ) : (
        <Panel title="Records" meta="Newest first" flush>
          <Tabs
            tabs={tabs}
            value={filter}
            onChange={setFilter}
            label="Filter by risk level"
            idPrefix="log-filter"
            className="bg-surface px-2"
          />
          <TabPanel idPrefix="log-filter" id={filter} value={filter}>
            <div className={`transition-opacity ${loading ? 'opacity-50' : ''}`} aria-busy={loading}>
              {items.length ? <HistoryTable items={items} /> : <EmptyState title="No records at this risk level" />}
            </div>
          </TabPanel>
          <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 rounded-b-[3px] border-t border-line bg-subtle px-3 py-1.5 text-xs text-ink-muted">
            <span>
              {shownTotal > items.length
                ? `Showing the latest ${items.length} of ${shownTotal.toLocaleString('en-US')}.`
                : `${items.length.toLocaleString('en-US')} ${items.length === 1 ? 'record' : 'records'}.`}
            </span>
            <span>Stored in a local SQLite database.</span>
          </div>
        </Panel>
      )}

      <ConfirmDialog
        open={confirming}
        title="Clear audit log"
        confirmLabel="Delete all records"
        busy={clearing}
        onConfirm={confirmClear}
        onCancel={() => setConfirming(false)}
      >
        This deletes all {total.toLocaleString('en-US')} records from the local SQLite store. This cannot be undone.
        The model is not affected.
      </ConfirmDialog>
    </Page>
  )
}
