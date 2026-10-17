import { useState } from 'react'
import { API_URL } from '../../api'
import Button from '../ui/Button'
import Icon from '../ui/Icon'

/** Full-width, non-blocking notice under the header, with the command that fixes it and a retry. */
export default function OfflineBanner({ onRetry }) {
  const [retrying, setRetrying] = useState(false)

  async function retry() {
    setRetrying(true)
    try {
      await onRetry()
    } finally {
      setRetrying(false)
    }
  }

  return (
    <div className="border-b border-risk-review-line bg-risk-review-bg" role="alert">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 text-[13px]">
        <Icon name="alert" className="size-4 shrink-0 text-risk-review" />
        <p className="min-w-0 flex-1 text-ink-muted">
          <span className="font-semibold text-risk-review">API unreachable at </span>
          <span className="font-mono text-ink">{API_URL}</span>
          <span className="font-semibold text-risk-review">.</span> Start it from the repository root with{' '}
          <code className="rounded-sm border border-risk-review-line bg-surface px-1.5 py-0.5 font-mono text-xs text-ink">
            npm run dev
          </code>
          . The page also retries every few seconds.
        </p>
        <Button size="sm" onClick={retry} loading={retrying}>
          Retry
        </Button>
      </div>
    </div>
  )
}
