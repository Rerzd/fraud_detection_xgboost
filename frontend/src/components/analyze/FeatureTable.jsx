import { formatAmount } from '../../lib/format'

const DERIVED = new Set(['errorbalanceDest', 'errorbalanceOrig'])

function note(feature, value, raw) {
  if (feature === 'type') return 'encoded'
  if (DERIVED.has(feature)) return 'derived'
  if (raw && feature in raw && value !== raw[feature]) {
    return value === null ? 'set to NaN' : `set to ${value}`
  }
  return null
}

function display(feature, value) {
  if (value === null) return 'NaN'
  if (feature === 'step' || feature === 'type') return String(value)
  return formatAmount(value)
}

/** The 9 inputs the model actually saw, with values changed by the sentinel rules highlighted. */
export default function FeatureTable({ features, raw }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-line text-left text-ink-faint">
            <th scope="col" className="py-2 pr-3 font-normal">Feature</th>
            <th scope="col" className="py-2 pr-3 text-right font-normal">Model input</th>
            <th scope="col" className="py-2 font-normal">Note</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(features).map(([feature, value]) => {
            const n = note(feature, value, raw)
            const changed = n?.startsWith('set to')
            return (
              <tr key={feature} className={`border-b border-line/60 ${changed ? 'bg-accent-soft' : ''}`}>
                <td className="py-1.5 pr-3 font-mono text-muted">{feature}</td>
                <td className={`py-1.5 pr-3 text-right font-mono tabular ${changed ? 'text-accent' : 'text-fg'}`}>
                  {display(feature, value)}
                </td>
                <td className={`py-1.5 text-[11px] ${changed ? 'text-accent' : 'text-ink-faint'}`}>{n}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="mt-3 text-[11px] leading-relaxed text-ink-faint">
        Rules from training: destination balances 0/0 with a non-zero amount become -1; origin balances 0/0 become
        NaN. The error balances are computed afterwards.
      </p>
    </div>
  )
}
