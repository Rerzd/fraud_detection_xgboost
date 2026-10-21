import { useState } from 'react'
import { getHistory } from '../../api'
import usePage from '../../hooks/usePage'
import { previousOffset } from '../../lib/pagination'
import HistoryTable from '../history/HistoryTable'
import { Page } from '../shell/PageHeader'
import Button from '../ui/Button'
import Callout from '../ui/Callout'
import EmptyState from '../ui/EmptyState'
import Icon from '../ui/Icon'
import Pager from '../ui/Pager'
import Panel from '../ui/Panel'
import Spinner from '../ui/Spinner'
import ReviewSummary from './ReviewSummary'

const PAGE_SIZE = 25
const QUEUE = { review_status: 'pending', sort: 'probability' }

/**
 * Flagged predictions nobody has judged yet, highest score first. A verdict (one click here, or
 * with a note in the expanded row) takes the record out of the queue.
 */
export default function ReviewQueueTab({ online, stats, onChange = () => {} }) {
  const [offset, setOffset] = useState(0)
  const [reloadKey, setReloadKey] = useState(0)
  const { page, error, loading } = usePage({
    enabled: online,
    key: `${offset}:${reloadKey}`,
    load: () => getHistory({ limit: PAGE_SIZE, offset, filters: QUEUE }),
  })

  function reload() {
    setReloadKey((n) => n + 1)
    onChange()
  }

  function reviewed() {
    // Emptying the last page of the queue would leave the view past the end: step back first.
    if (page.items.length === 1 && offset > 0) setOffset(previousOffset(offset, PAGE_SIZE))
    reload()
  }

  if (!online) {
    return (
      <Page id="review">
        <Panel title="Pending review">
          <EmptyState icon="inbox" title="Backend offline">
            The review queue is stored by the API. Start the backend to see it.
          </EmptyState>
        </Panel>
      </Page>
    )
  }

  const actions = (
    <Button onClick={reload} loading={loading}>
      {!loading && <Icon name="refresh" />}
      Refresh
    </Button>
  )

  return (
    <Page id="review" actions={actions}>
      {stats && <ReviewSummary review={stats.review} />}
      {error && <Callout tone="danger">{error}</Callout>}

      {!page ? (
        <Panel title="Pending review">
          <div className="flex justify-center py-10 text-ink-muted">
            <Spinner className="size-5" />
          </div>
        </Panel>
      ) : page.total === 0 && offset === 0 ? (
        <Panel title="Pending review">
          <EmptyState icon="inbox" title="The queue is empty">
            Nothing is waiting for an analyst. High-risk and review predictions from{' '}
            <a href="#analyze" className="font-medium text-brand-700 underline">Single transaction</a> or{' '}
            <a href="#batch" className="font-medium text-brand-700 underline">Batch run</a> appear here until someone
            judges them.
          </EmptyState>
        </Panel>
      ) : (
        <Panel title="Pending review" meta="Highest score first" flush>
          <div className={`transition-opacity ${loading ? 'opacity-50' : ''}`} aria-busy={loading}>
            <HistoryTable items={page.items} onUpdate={reviewed} quickReview />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-b-[3px] border-t border-line bg-subtle px-3 py-1.5 text-xs text-ink-muted">
            <Pager
              offset={page.offset}
              count={page.items.length}
              total={page.total}
              limit={PAGE_SIZE}
              busy={loading}
              onChange={setOffset}
              label="Review queue pages"
            />
            <span>Open a row to add a note or see the stored payload.</span>
          </div>
        </Panel>
      )}
    </Page>
  )
}
