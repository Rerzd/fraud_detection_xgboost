import { hasNext, hasPrevious, nextOffset, pageLabel, previousOffset } from '../../lib/pagination'
import Button from './Button'

/** "26–50 of 213" with Previous and Next. `offset`/`count`/`total` come straight from the page. */
export default function Pager({ offset, count, total, limit, onChange, busy = false, label = 'Pagination' }) {
  return (
    <nav aria-label={label} className="flex items-center gap-2">
      <span className="font-mono text-xs text-ink-muted" aria-live="polite">
        {pageLabel({ offset, count, total })}
      </span>
      <Button size="sm" disabled={busy || !hasPrevious(offset)} onClick={() => onChange(previousOffset(offset, limit))}>
        Previous
      </Button>
      <Button
        size="sm"
        disabled={busy || !hasNext({ offset, count, total })}
        onClick={() => onChange(nextOffset(offset, limit))}
      >
        Next
      </Button>
    </nav>
  )
}
