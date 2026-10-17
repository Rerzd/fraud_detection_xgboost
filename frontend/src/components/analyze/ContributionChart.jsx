import { formatAmount, formatSigned } from '../../lib/format'

const TOP_N = 6

function displayValue(feature, value) {
  if (value === null) return 'NaN'
  if (feature === 'type') return value === 0 ? '0 (TRANSFER)' : '1 (CASH_OUT)'
  if (feature === 'step') return String(value)
  return formatAmount(value)
}

/** Diverging bars: right = pushes toward fraud, left = pushes away. Values are log-odds. */
export default function ContributionChart({ explanation }) {
  const top = explanation.contributions.slice(0, TOP_N)
  const scale = Math.max(...top.map((c) => Math.abs(c.contribution)), 1e-9)

  return (
    <div>
      <div className="mb-2 flex justify-between text-[11px] text-subtle">
        <span>Away from fraud</span>
        <span>Toward fraud</span>
      </div>
      <ul className="space-y-2.5">
        {top.map((c) => {
          const width = `${(Math.abs(c.contribution) / scale) * 50}%`
          const positive = c.contribution > 0
          return (
            <li key={c.feature}>
              <div className="mb-1 flex items-baseline justify-between gap-3 text-xs">
                <span className="min-w-0 truncate">
                  <span className="font-mono text-fg">{c.feature}</span>
                  <span className="ml-2 font-mono text-subtle">{displayValue(c.feature, c.value)}</span>
                </span>
                <span className={`font-mono tabular ${positive ? 'text-risk-high' : 'text-risk-low'}`}>
                  {formatSigned(c.contribution)}
                </span>
              </div>
              <div className="relative h-2 rounded-sm bg-raised">
                <div className="absolute inset-y-0 left-1/2 w-px bg-line-strong" />
                <div
                  className={`absolute inset-y-0 rounded-sm ${positive ? 'bg-risk-high/70' : 'bg-risk-low/70'}`}
                  style={positive ? { left: '50%', width } : { right: '50%', width }}
                />
              </div>
            </li>
          )
        })}
      </ul>
      <p className="mt-4 text-xs leading-relaxed text-muted">
        Contributions are in log-odds. They add up, together with the base value{' '}
        <span className="font-mono text-fg">{formatSigned(explanation.base_value)}</span>, to the model&apos;s raw
        score, which the sigmoid turns into the probability.
      </p>
    </div>
  )
}
