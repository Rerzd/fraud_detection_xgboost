import { useState } from 'react'
import { reviewPrediction } from '../../api'
import Button from '../ui/Button'

const ACTIONS = [
  { status: 'confirmed_fraud', label: 'Confirm fraud', variant: 'danger' },
  { status: 'false_positive', label: 'False positive', variant: 'secondary' },
  { status: 'legitimate', label: 'Legitimate', variant: 'secondary' },
]

/** One-click verdicts for the review queue. Notes go through the form in the expanded row. */
export default function QuickReview({ item, onReviewed }) {
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)

  async function decide(status) {
    setBusy(status)
    setError(null)
    try {
      onReviewed(await reviewPrediction(item.id, { status }))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div>
      <div className="flex gap-1.5">
        {ACTIONS.map(({ status, label, variant }) => (
          <Button
            key={status}
            size="sm"
            variant={variant}
            loading={busy === status}
            disabled={busy !== null}
            aria-label={`${label} for record ${item.id}`}
            onClick={() => decide(status)}
          >
            {label}
          </Button>
        ))}
      </div>
      {error && (
        <p role="alert" className="mt-1 text-xs text-risk-high">
          {error}
        </p>
      )}
    </div>
  )
}
