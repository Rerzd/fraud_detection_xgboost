import LogoMark from './LogoMark'

const STATUS = {
  checking: { label: 'API checking', dot: 'bg-line-strong animate-pulse' },
  online: { label: 'API online', dot: 'bg-brand-50' },
  offline: { label: 'API offline', dot: 'bg-risk-high-line' },
}

export default function AppHeader({ status, modelVersion }) {
  const s = STATUS[status]
  return (
    <header className="sticky top-0 z-30 flex h-12 items-center justify-between gap-3 bg-brand-900 px-4 text-white">
      <div className="flex min-w-0 items-center gap-3">
        <LogoMark />
        <p className="truncate text-sm font-semibold tracking-wide">Fraud Risk Test Bench</p>
        <span className="hidden h-5 w-px bg-white/25 md:block" aria-hidden="true" />
        <p className="hidden truncate text-xs text-brand-50 md:block">
          PaySim · XGBoost
          {modelVersion && <span className="ml-1.5 font-mono">{modelVersion}</span>}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="hidden h-5 items-center rounded-xs border border-white/40 px-1.5 font-mono text-[11px] tracking-wider uppercase sm:inline-flex">
          Local
        </span>
        <div className="flex items-center gap-2 text-xs" role="status" aria-live="polite">
          <span className={`size-2 rounded-full ${s.dot}`} aria-hidden="true" />
          {s.label}
        </div>
      </div>
    </header>
  )
}
