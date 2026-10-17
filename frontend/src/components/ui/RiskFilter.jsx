import { RISK, RISK_LEVELS } from '../../lib/format'

/** Segmented filter: all / high / review / low, with optional counts. */
export default function RiskFilter({ value, onChange, counts }) {
  const options = [{ id: '', label: 'All' }, ...RISK_LEVELS.map((id) => ({ id, label: RISK[id].label }))]
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-lg border border-line bg-raised p-1" role="radiogroup" aria-label="Filter by risk level">
      {options.map((o) => {
        const selected = value === o.id
        return (
          <button
            key={o.id || 'all'}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.id)}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-colors ${
              selected ? 'bg-panel text-fg shadow-sm ring-1 ring-line-strong' : 'text-muted hover:text-fg'
            }`}
          >
            {o.id && <span className={`size-1.5 rounded-full ${RISK[o.id].bg}`} aria-hidden="true" />}
            {o.label}
            {counts && <span className="font-mono text-subtle tabular">{counts[o.id || 'all'] ?? 0}</span>}
          </button>
        )
      })}
    </div>
  )
}
