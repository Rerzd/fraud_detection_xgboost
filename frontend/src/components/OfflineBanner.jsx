import { API_URL } from '../api'
import Icon from './ui/Icon'

export default function OfflineBanner() {
  return (
    <div className="border-b border-risk-review/25 bg-risk-review/8" role="alert">
      <div className="mx-auto flex max-w-7xl items-start gap-3 px-4 py-3 text-sm sm:px-6">
        <Icon name="alert" className="mt-0.5 size-4 shrink-0 text-risk-review" />
        <p className="text-muted">
          <span className="text-fg">Backend unreachable at </span>
          <span className="font-mono text-fg">{API_URL}</span>
          <span className="text-fg">.</span> Start it from the repository root with{' '}
          <code className="rounded border border-line bg-raised px-1.5 py-0.5 font-mono text-xs text-fg">
            npm run dev
          </code>
          . This page reconnects on its own.
        </p>
      </div>
    </div>
  )
}
