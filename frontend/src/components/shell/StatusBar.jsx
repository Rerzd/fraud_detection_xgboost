import { formatObservedPrecision } from '../../lib/review'

const MODEL_LABEL = { online: 'loaded', offline: 'unavailable', checking: 'checking' }

function Item({ label, children, className = '', title }) {
  return (
    <span
      title={title}
      className={`flex items-center gap-1.5 border-r border-line-strong px-3 last:border-r-0 ${className}`}
    >
      <span className="text-ink-faint">{label}</span>
      <span className="text-ink">{children}</span>
    </span>
  )
}

const fixed = (value) => (typeof value === 'number' ? value.toFixed(2) : '—')

/**
 * Footer strip: where the API is, whether the model is loaded, the live thresholds and, once the
 * statistics have loaded, the review queue and the precision observed on analyst verdicts.
 */
export default function StatusBar({ apiUrl, status, thresholds, stats }) {
  return (
    <footer className="z-20 flex min-h-7 flex-wrap items-center border-t border-line-strong bg-subtle py-0.5 font-mono text-xs text-ink-muted md:sticky md:bottom-0">
      <Item label="API">{apiUrl}</Item>
      <Item label="model">{MODEL_LABEL[status]}</Item>
      <Item label="thresholds">
        {fixed(thresholds?.review)} / {fixed(thresholds?.fraud)}
      </Item>
      {stats && (
        <>
          <Item label="review queue">{stats.review.pending}</Item>
          <Item
            label="precision"
            className="hidden sm:flex"
            title="Observed on demo data from analyst reviews; not a model metric."
          >
            {formatObservedPrecision(stats.review.observed_precision)}
            <span className="ml-1.5 text-ink-faint">observed, demo data</span>
          </Item>
        </>
      )}
      <Item label="store" className="hidden sm:flex">
        SQLite (local)
      </Item>
    </footer>
  )
}
