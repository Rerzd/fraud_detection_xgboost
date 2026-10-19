const TONES = {
  neutral: 'border-line-strong bg-subtle text-ink-muted',
  brand: 'border-brand-700/30 bg-brand-50 text-brand-700',
  review: 'border-risk-review-line bg-risk-review-bg text-risk-review',
}

/** Small square label for categories such as the prediction source or a sentinel marker. */
export default function Tag({ tone = 'neutral', children, className = '' }) {
  return (
    <span
      className={`inline-flex h-5 items-center rounded-xs border px-1.5 font-mono text-[11px] whitespace-nowrap ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
