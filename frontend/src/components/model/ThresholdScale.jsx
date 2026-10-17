import { RISK } from '../../lib/format'

/** The 0-1 probability axis split into the three risk bands, positioned from the backend thresholds. */
export default function ThresholdScale({ review, fraud }) {
  const bands = [
    { level: 'low', from: 0, to: review },
    { level: 'review', from: review, to: fraud },
    { level: 'high', from: fraud, to: 1 },
  ]
  const pct = (v) => `${v * 100}%`
  return (
    <div>
      <div className="flex h-8 overflow-hidden rounded-lg border border-line">
        {bands.map(({ level, from, to }) => (
          <div
            key={level}
            className={`flex items-center justify-center border-l border-ink/60 first:border-l-0 ${RISK[level].badge}`}
            style={{ width: pct(to - from) }}
          >
            <span className="truncate px-1 text-[11px] font-medium">{RISK[level].label}</span>
          </div>
        ))}
      </div>
      <div className="relative mt-1.5 h-4 font-mono text-[10px] text-ink-faint">
        <span className="absolute left-0">0</span>
        {[review, fraud].map((t) => (
          <span key={t} className="absolute -translate-x-1/2" style={{ left: pct(t) }}>
            {t}
          </span>
        ))}
        <span className="absolute right-0">1</span>
      </div>
    </div>
  )
}
