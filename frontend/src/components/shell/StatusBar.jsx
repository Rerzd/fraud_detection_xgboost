const MODEL_LABEL = { online: 'loaded', offline: 'unavailable', checking: 'checking' }

function Item({ label, children, className = '' }) {
  return (
    <span className={`flex items-center gap-1.5 border-r border-line-strong px-3 last:border-r-0 ${className}`}>
      <span className="text-ink-faint">{label}</span>
      <span className="text-ink">{children}</span>
    </span>
  )
}

const fixed = (value) => (typeof value === 'number' ? value.toFixed(2) : '—')

/** Footer strip: where the API is, whether the model is loaded and the live thresholds. */
export default function StatusBar({ apiUrl, status, thresholds }) {
  return (
    <footer className="z-20 flex min-h-7 flex-wrap items-center border-t border-line-strong bg-subtle py-0.5 font-mono text-xs text-ink-muted md:sticky md:bottom-0">
      <Item label="API">{apiUrl}</Item>
      <Item label="model">{MODEL_LABEL[status]}</Item>
      <Item label="thresholds">
        {fixed(thresholds?.review)} / {fixed(thresholds?.fraud)}
      </Item>
      <Item label="store" className="hidden sm:flex">
        SQLite (local)
      </Item>
    </footer>
  )
}
