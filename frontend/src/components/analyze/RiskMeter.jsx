import { RISK } from '../../lib/format'

/** Horizontal 0-1 meter with ticks at the backend thresholds. */
export default function RiskMeter({ probability, level, reviewThreshold, fraudThreshold }) {
  const pct = (v) => `${Math.min(Math.max(v, 0), 1) * 100}%`
  const review = reviewThreshold ?? fraudThreshold
  const ticks = [...new Set([review, fraudThreshold])]
  return (
    <div>
      <div
        className="relative h-2 rounded-full bg-raised"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={1}
        aria-valuenow={probability}
        aria-label="Fraud probability"
      >
        <div className="absolute inset-y-0 left-0 rounded-full bg-risk-low/15" style={{ width: pct(review) }} />
        <div
          className="absolute inset-y-0 bg-risk-review/15"
          style={{ left: pct(review), width: pct(fraudThreshold - review) }}
        />
        <div
          className="absolute inset-y-0 right-0 rounded-r-full bg-risk-high/15"
          style={{ left: pct(fraudThreshold) }}
        />
        <div
          className={`absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink ${RISK[level].bg} transition-[left] duration-500`}
          style={{ left: pct(probability) }}
        />
      </div>
      <div className="relative mt-1.5 h-4 font-mono text-[10px] text-ink-faint">
        <span className="absolute left-0">0</span>
        {ticks.map((t) => (
          <span key={t} className="absolute -translate-x-1/2" style={{ left: pct(t) }}>
            {t}
          </span>
        ))}
        <span className="absolute right-0">1</span>
      </div>
    </div>
  )
}
