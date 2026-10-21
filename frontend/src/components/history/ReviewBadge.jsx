import { REVIEW_STATUS } from '../../lib/review'

const TONES = {
  review: 'border-risk-review-line bg-risk-review-bg text-risk-review',
  high: 'border-risk-high-line bg-risk-high-bg text-risk-high',
  low: 'border-risk-low-line bg-risk-low-bg text-risk-low',
  neutral: 'border-line-strong bg-subtle text-ink-muted',
}

/** Review status as a labelled badge, so the meaning never rests on color alone. */
export default function ReviewBadge({ status }) {
  const { label, tone } = REVIEW_STATUS[status]
  return (
    <span
      className={`inline-flex h-5 items-center rounded-xs border px-1.5 text-[11px] font-semibold tracking-wide whitespace-nowrap uppercase ${TONES[tone]}`}
    >
      {label}
    </span>
  )
}
