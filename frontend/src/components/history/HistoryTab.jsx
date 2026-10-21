import { useState } from 'react'
import { clearHistory, getHistory } from '../../api'
import usePage from '../../hooks/usePage'
import { REVIEW_STATUS, REVIEW_STATUSES } from '../../lib/review'
import { Page } from '../shell/PageHeader'
import Button from '../ui/Button'
import Callout from '../ui/Callout'
import ConfirmDialog from '../ui/ConfirmDialog'
import EmptyState from '../ui/EmptyState'
import { Select } from '../ui/Field'
import Icon from '../ui/Icon'
import Pager from '../ui/Pager'
import Panel from '../ui/Panel'
import Spinner from '../ui/Spinner'
import Tabs, { TabPanel } from '../ui/Tabs'
import HistorySummary from './HistorySummary'
import HistoryTable from './HistoryTable'

export const PAGE_SIZE = 25

const SOURCES = [
  { value: '', label: 'All sources' },
  { value: 'single', label: 'Single' },
  { value: 'batch', label: 'Batch' },
]

function FilterSelect({ id, label, value, onChange, options }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-ink-muted">
        {label}
      </label>
      <Select id={id} value={value} onChange={(event) => onChange(event.target.value)} className="w-44">
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  )
}

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  ...REVIEW_STATUSES.map((status) => ({ value: status, label: REVIEW_STATUS[status].label })),
]

/**
 * Every stored prediction, one server-side page at a time. Filters (risk, source, review status)
 * are sent to the API, so the totals and the page label always describe the whole log.
 */
export default function HistoryTab({ online, stats, onChange = () => {} }) {
  const [risk, setRisk] = useState('all')
  const [source, setSource] = useState('')
  const [reviewStatus, setReviewStatus] = useState('')
  const [offset, setOffset] = useState(0)
  const [reloadKey, setReloadKey] = useState(0)
  const [confirming, setConfirming] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [notice, setNotice] = useState(null)

  const filters = { risk_level: risk === 'all' ? '' : risk, source, review_status: reviewStatus }
  const { page, error, loading, replace } = usePage({
    enabled: online,
    key: JSON.stringify([offset, filters, reloadKey]),
    load: () => getHistory({ limit: PAGE_SIZE, offset, filters }),
  })

  // Changing a filter always starts again from the first page.
  const filterBy = (setter) => (value) => {
    setter(value)
    setOffset(0)
  }
  const filtered = Boolean(source || reviewStatus)
  const total = stats?.total ?? 0

  function reload() {
    setReloadKey((n) => n + 1)
    onChange()
  }

  function saved(record) {
    replace(record)
    onChange()
  }

  async function confirmClear() {
    setClearing(true)
    try {
      const { deleted } = await clearHistory()
      setNotice({
        tone: 'info',
        text: `Deleted ${deleted.toLocaleString('en-US')} ${deleted === 1 ? 'record' : 'records'}.`,
      })
      setRisk('all')
      setSource('')
      setReviewStatus('')
      setOffset(0)
      reload()
    } catch (err) {
      setNotice({ tone: 'danger', text: err.message })
    } finally {
      setClearing(false)
      setConfirming(false)
    }
  }

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

  const actions = (
    <>
      <Button onClick={reload} loading={loading}>
        {!loading && <Icon name="refresh" />}
        Refresh
      </Button>
      <Button variant="danger" onClick={() => setConfirming(true)} disabled={!total}>
        <Icon name="trash" />
        Clear log
      </Button>
    </>
  )

  const tabs = stats && [
    { id: 'all', label: 'All', count: stats.total },
    { id: 'high', label: 'High', count: stats.by_risk.high },
    { id: 'review', label: 'Review', count: stats.by_risk.review },
    { id: 'low', label: 'Low', count: stats.by_risk.low },
  ]

  return (
    <Page id="history" actions={actions}>
      {stats && <HistorySummary stats={stats} />}

      {notice && (
        <Callout tone={notice.tone} role="status">
          {notice.text}
        </Callout>
      )}
      {error && <Callout tone="danger">{error}</Callout>}

      {!stats || !page ? (
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
            value={risk}
            onChange={filterBy(setRisk)}
            label="Filter by risk level"
            idPrefix="log-filter"
            className="bg-surface px-2"
          />
          <div className="flex flex-wrap items-end gap-3 border-b border-line bg-surface px-3 py-2">
            <FilterSelect id="log-source" label="Source" value={source} onChange={filterBy(setSource)} options={SOURCES} />
            <FilterSelect
              id="log-review-status"
              label="Review status"
              value={reviewStatus}
              onChange={filterBy(setReviewStatus)}
              options={STATUS_OPTIONS}
            />
            {filtered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSource('')
                  setReviewStatus('')
                  setOffset(0)
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
          <TabPanel idPrefix="log-filter" id={risk} value={risk}>
            <div className={`transition-opacity ${loading ? 'opacity-50' : ''}`} aria-busy={loading}>
              {page.items.length ? (
                <HistoryTable items={page.items} onUpdate={saved} />
              ) : (
                <EmptyState title="No records match these filters">Change or clear a filter to see more.</EmptyState>
              )}
            </div>
          </TabPanel>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-b-[3px] border-t border-line bg-subtle px-3 py-1.5 text-xs text-ink-muted">
            <Pager
              offset={page.offset}
              count={page.items.length}
              total={page.total}
              limit={PAGE_SIZE}
              busy={loading}
              onChange={setOffset}
              label="Audit log pages"
            />
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
        This deletes all {total.toLocaleString('en-US')} records, and the batch runs they came from, from the local
        SQLite store. This cannot be undone. The model is not affected.
      </ConfirmDialog>
    </Page>
  )
}
