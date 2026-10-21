import { useEffect, useRef } from 'react'
import { getHistory } from '../../api'
import usePage from '../../hooks/usePage'
import { formatPercent } from '../../lib/format'
import HistoryTable from '../history/HistoryTable'
import Button from '../ui/Button'
import Callout from '../ui/Callout'
import EmptyState from '../ui/EmptyState'
import Panel from '../ui/Panel'
import Spinner from '../ui/Spinner'
import SummaryStrip from '../ui/SummaryStrip'

const ROW_LIMIT = 200
const count = (n) => n.toLocaleString('en-US')

/**
 * The rows a previous run stored, highest score first, with the same expandable detail and review
 * form as the Audit log. Rejected rows are not stored, so only scored rows can be listed here.
 */
export default function StoredRun({ batch, onClose, onChange = () => {} }) {
  const ref = useRef(null)
  const { page, error, loading, replace } = usePage({
    enabled: true,
    key: batch.id,
    load: () => getHistory({ limit: ROW_LIMIT, filters: { batch_id: batch.id, sort: 'probability' } }),
  })

  // The panel opens below the list of runs, which can be off screen on a small display.
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const rate = batch.scored ? batch.flagged / batch.scored : 0
  return (
    <div ref={ref} className="scroll-mt-16 space-y-4">
      <SummaryStrip
        cells={[
          { label: 'Run ID', value: batch.id.slice(0, 8), hint: batch.filename ?? 'unnamed file', title: batch.id },
          { label: 'Rows', value: count(batch.total_rows), hint: 'in the file' },
          { label: 'Scored', value: count(batch.scored), hint: 'valid rows' },
          {
            label: 'Invalid',
            value: count(batch.invalid),
            hint: batch.invalid ? 'not stored' : 'none rejected',
            tone: batch.invalid ? 'high' : 'default',
          },
          {
            label: 'Flagged',
            value: count(batch.flagged),
            hint: 'high risk',
            tone: batch.flagged ? 'high' : 'default',
          },
          { label: 'Flagged rate', value: formatPercent(rate), hint: 'high risk / scored' },
        ]}
      />
      {error && <Callout tone="danger">{error}</Callout>}
      <Panel
        title="Stored rows"
        meta="Highest score first"
        actions={
          <Button size="sm" onClick={onClose}>
            Close
          </Button>
        }
        flush
      >
        {!page ? (
          !error && (
            <div className="flex justify-center py-8 text-ink-muted">
              <Spinner className="size-5" />
            </div>
          )
        ) : page.items.length === 0 ? (
          <EmptyState title="No stored rows">
            This run scored no valid rows, or its records were cleared from the Audit log.
          </EmptyState>
        ) : (
          <div className={`transition-opacity ${loading ? 'opacity-50' : ''}`} aria-busy={loading}>
            <HistoryTable
              items={page.items}
              onUpdate={(record) => {
                replace(record)
                onChange()
              }}
            />
          </div>
        )}
        {page && (
          <div className="rounded-b-[3px] border-t border-line bg-subtle px-3 py-1.5 text-xs text-ink-muted">
            {page.total > page.items.length
              ? `Showing the ${count(page.items.length)} highest scores of ${count(page.total)} stored rows.`
              : `${count(page.items.length)} stored ${page.items.length === 1 ? 'row' : 'rows'}.`}{' '}
            Rejected rows are not stored.
          </div>
        )}
      </Panel>
    </div>
  )
}
