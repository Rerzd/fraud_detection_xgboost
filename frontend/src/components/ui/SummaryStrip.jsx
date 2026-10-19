const TONES = {
  default: 'text-ink',
  high: 'text-risk-high',
  review: 'text-risk-review',
  low: 'text-risk-low',
}

// Full class names, so Tailwind can see them. A strip of six or more cells needs a wider screen to fit one row.
const LAYOUTS = {
  narrow: 'max-lg:[&>*:last-child:nth-child(odd)]:col-span-2 lg:auto-cols-fr lg:grid-flow-col',
  wide: 'max-xl:[&>*:last-child:nth-child(odd)]:col-span-2 xl:auto-cols-fr xl:grid-flow-col',
}

/**
 * One bordered row divided into cells by 1px lines. Cells: { label, value, hint, tone, title, mono }.
 * Two columns on narrow screens, one column per cell from lg up (xl for six or more cells).
 */
export default function SummaryStrip({ cells, className = '' }) {
  return (
    <dl
      className={`grid grid-cols-2 gap-px overflow-hidden rounded border border-line-strong bg-line ${
        cells.length > 5 ? LAYOUTS.wide : LAYOUTS.narrow
      } ${className}`}
    >
      {cells.map(({ label, value, hint, tone = 'default', title, mono = true }) => (
        <div key={label} className="min-w-0 bg-surface px-4 py-2.5" title={title}>
          <dt className="text-[11px] font-semibold tracking-wider text-ink-muted uppercase">{label}</dt>
          <dd className={`mt-0.5 truncate text-xl font-semibold ${mono ? 'font-mono' : ''} ${TONES[tone]}`}>
            {value}
          </dd>
          {hint && <p className="truncate text-xs text-ink-faint">{hint}</p>}
        </div>
      ))}
    </dl>
  )
}
