import { useEffect, useState } from 'react'
import { clearHistory, getHistory, getStats } from '../../api'
import { formatPercent, RISK, RISK_LEVELS } from '../../lib/format'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import EmptyState from '../ui/EmptyState'
import Icon from '../ui/Icon'
import Panel from '../ui/Panel'
import RiskFilter from '../ui/RiskFilter'
import Spinner from '../ui/Spinner'
import StatTile from '../ui/StatTile'
import HistoryTable from './HistoryTable'

const LIMIT = 50

function Stats({ stats }) {
  const share = (n) => (stats.total ? `${formatPercent(n / stats.total)} of total` : 'none yet')
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatTile
        label="Predictions"
        value={stats.total.toLocaleString('en-US')}
        hint={`${stats.by_source.single.toLocaleString('en-US')} single, ${stats.by_source.batch.toLocaleString('en-US')} batch`}
      />
      {RISK_LEVELS.map((level) => (
        <StatTile
          key={level}
          label={
            <span className="inline-flex items-center gap-1.5">
              <span className={`size-1.5 rounded-full ${RISK[level].bg}`} aria-hidden="true" />
              {RISK[level].label}
            </span>
          }
          value={stats.by_risk[level].toLocaleString('en-US')}
          hint={share(stats.by_risk[level])}
        />
      ))}
    </div>
  )
}

export default function HistoryTab({ online }) {
  const [filter, setFilter] = useState('')
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
    Promise.all([getStats(), getHistory({ limit: LIMIT, riskLevel: filter || undefined })])
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
      setNotice(`Deleted ${deleted.toLocaleString('en-US')} ${deleted === 1 ? 'prediction' : 'predictions'}.`)
      setFilter('')
      setRefresh((n) => n + 1)
    } catch (err) {
      setNotice(err.message)
    } finally {
      setClearing(false)
      setConfirming(false)
    }
  }

  if (!online) {
    return (
      <Panel title="History">
        <EmptyState icon="clock" title="Backend offline">
          History is stored by the API. Start the backend to see past predictions.
        </EmptyState>
      </Panel>
    )
  }

  const { stats, items, error } = data
  const counts = stats && { all: stats.total, ...stats.by_risk }
  const shownTotal = stats ? (filter ? stats.by_risk[filter] : stats.total) : 0

  return (
    <div className="space-y-6">
      {stats && <Stats stats={stats} />}

      <Panel
        title="Recent predictions"
        description="Single and batch predictions, newest first."
        actions={
          <>
            <Button variant="ghost" onClick={() => setRefresh((n) => n + 1)} disabled={loading} aria-label="Refresh history">
              {loading ? <Spinner /> : <Icon name="refresh" />}
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button variant="danger" onClick={() => setConfirming(true)} disabled={!stats?.total}>
              <Icon name="trash" />
              Clear history
            </Button>
          </>
        }
      >
        {notice && (
          <p className="mb-4 flex items-center gap-2 text-xs text-muted" role="status">
            <Icon name="check" className="size-3.5 text-accent" />
            {notice}
          </p>
        )}
        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-risk-high/30 bg-risk-high/5 p-3 text-sm" role="alert">
            <Icon name="alert" className="mt-0.5 size-4 shrink-0 text-risk-high" />
            <p className="text-muted">{error}</p>
          </div>
        )}

        {!stats ? (
          <div className="flex justify-center py-14 text-muted">
            <Spinner className="size-5" />
          </div>
        ) : stats.total === 0 ? (
          <EmptyState icon="clock" title="No predictions yet">
            Score a transaction in <a href="#analyze" className="text-accent hover:text-accent-hover">Analyze</a> or
            upload a file in <a href="#batch" className="text-accent hover:text-accent-hover">Batch</a>. Every result
            is saved here.
          </EmptyState>
        ) : (
          <div className="space-y-3">
            <RiskFilter value={filter} onChange={setFilter} counts={counts} />
            {items.length ? (
              <HistoryTable items={items} />
            ) : (
              <p className="py-6 text-center text-sm text-muted">No predictions at this risk level.</p>
            )}
            {shownTotal > items.length && (
              <p className="text-[11px] text-ink-faint">
                Showing the latest {items.length} of {shownTotal.toLocaleString('en-US')}.
              </p>
            )}
          </div>
        )}

        <p className="mt-5 flex items-center gap-2 border-t border-line pt-4 text-[11px] text-ink-faint">
          <Icon name="info" className="size-3.5" />
          Stored in a local SQLite database.
        </p>
      </Panel>

      <ConfirmDialog
        open={confirming}
        title="Clear prediction history?"
        confirmLabel="Delete all"
        busy={clearing}
        onConfirm={confirmClear}
        onCancel={() => setConfirming(false)}
      >
        This permanently deletes all {stats?.total.toLocaleString('en-US')} stored predictions, single and batch. The
        model is not affected.
      </ConfirmDialog>
    </div>
  )
}
