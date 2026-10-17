import Icon from './ui/Icon'

const STATUS = {
  checking: { label: 'Checking', dot: 'bg-subtle animate-pulse' },
  online: { label: 'Online', dot: 'bg-risk-low' },
  offline: { label: 'Offline', dot: 'bg-risk-high' },
}

function StatusPill({ status, modelVersion }) {
  const s = STATUS[status]
  return (
    <div
      className="flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1 text-xs text-muted"
      role="status"
      aria-live="polite"
    >
      <span className={`size-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
      <span>
        <span className="sr-only">Backend status: </span>
        {s.label}
      </span>
      {status === 'online' && modelVersion && (
        <span className="hidden font-mono text-subtle sm:inline">{modelVersion}</span>
      )}
    </div>
  )
}

export default function AppHeader({ status, modelVersion }) {
  return (
    <header className="border-b border-line bg-ink/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-8 shrink-0 place-items-center rounded-lg border border-line bg-panel text-accent">
            <Icon name="shield" className="size-4.5" />
          </div>
          <h1 className="truncate text-sm font-semibold tracking-tight">
            Fraud Detection
            <span className="hidden font-normal text-muted sm:inline"> · PaySim XGBoost</span>
          </h1>
        </div>
        <StatusPill status={status} modelVersion={modelVersion} />
      </div>
    </header>
  )
}
