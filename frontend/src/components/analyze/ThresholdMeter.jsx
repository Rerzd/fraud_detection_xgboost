const clamp = (v) => Math.min(Math.max(v, 0), 1)
const pct = (v) => `${clamp(v) * 100}%`

/**
 * Horizontal 0 to 1 meter: three decision bands, a tick and label at each backend threshold, and a
 * marker at the score. Without a review threshold (model info not loaded yet) it shows two bands.
 */
export default function ThresholdMeter({ probability, reviewThreshold, fraudThreshold }) {
  const hasReview = typeof reviewThreshold === 'number' && reviewThreshold < fraudThreshold
  const review = hasReview ? reviewThreshold : 0
  const bands = [
    ...(hasReview ? [{ id: 'low', label: 'Low', from: 0, to: review, color: 'bg-risk-low-line' }] : []),
    ...(hasReview
      ? [{ id: 'review', label: 'Review', from: review, to: fraudThreshold, color: 'bg-risk-review-line' }]
      : [{ id: 'low', label: 'Low', from: 0, to: fraudThreshold, color: 'bg-risk-low-line' }]),
    { id: 'high', label: 'High', from: fraudThreshold, to: 1, color: 'bg-risk-high-line' },
  ]
  const ticks = hasReview ? [review, fraudThreshold] : [fraudThreshold]

  return (
    <div className="px-1.5">
      <div className="relative h-4 text-[11px] font-semibold tracking-wider text-ink-faint uppercase">
        {bands.map((b) => (
          <span
            key={b.id}
            className="absolute -translate-x-1/2 whitespace-nowrap"
            style={{ left: pct((b.from + b.to) / 2) }}
          >
            {b.label}
          </span>
        ))}
      </div>
      <div
        role="meter"
        aria-label="Fraud probability"
        aria-valuemin={0}
        aria-valuemax={1}
        aria-valuenow={probability}
        className="relative mt-1 h-2.5"
      >
        <div className="absolute inset-0 flex overflow-hidden rounded-sm border border-line-strong">
          {bands.map((b) => (
            <div key={b.id} className={`${b.color} border-l border-surface first:border-l-0`} style={{ width: pct(b.to - b.from) }} />
          ))}
        </div>
        <div
          className="absolute -top-1 -bottom-1 w-[3px] -translate-x-1/2 border-x border-surface bg-ink"
          style={{ left: pct(probability) }}
        />
      </div>
      <div className="relative mt-1.5 h-4 font-mono text-[11px] text-ink-muted">
        <span className="absolute left-0 -translate-x-1/2">0</span>
        {ticks.map((t) => (
          <span key={t} className="absolute -translate-x-1/2" style={{ left: pct(t) }}>
            {t.toFixed(2)}
          </span>
        ))}
        <span className="absolute right-0 translate-x-1/2">1</span>
      </div>
    </div>
  )
}
