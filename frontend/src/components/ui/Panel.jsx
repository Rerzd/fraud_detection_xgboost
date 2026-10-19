const TONES = {
  default: { header: 'border-line bg-subtle', title: 'text-ink-muted' },
  warning: { header: 'border-risk-review-line bg-risk-review-bg', title: 'text-risk-review' },
  danger: { header: 'border-risk-high-line bg-risk-high-bg', title: 'text-risk-high' },
}

/**
 * Bordered panel with a gray header strip: title on the left, meta and actions on the right.
 * `flush` removes body padding (for tables that run edge to edge).
 */
export default function Panel({
  id,
  title,
  meta,
  actions,
  tone = 'default',
  flush = false,
  className = '',
  bodyClassName = '',
  children,
}) {
  const t = TONES[tone]
  return (
    <section id={id} className={`rounded border border-line-strong bg-surface ${className}`}>
      {(title || meta || actions) && (
        <header
          className={`flex min-h-9 flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-t-[3px] border-b px-4 py-2 ${t.header}`}
        >
          {title && <h2 className={`min-w-0 text-xs font-semibold tracking-wider uppercase ${t.title}`}>{title}</h2>}
          {(meta || actions) && (
            <div className="flex shrink-0 items-center gap-2 text-xs text-ink-faint">
              {meta}
              {actions}
            </div>
          )}
        </header>
      )}
      <div className={flush ? bodyClassName : `px-4 py-3 ${bodyClassName}`}>{children}</div>
    </section>
  )
}
