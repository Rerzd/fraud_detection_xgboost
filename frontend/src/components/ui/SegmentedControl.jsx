/** Square-ish radio group. Options: { value, label }. Arrow keys move the selection. */
export default function SegmentedControl({ options, value, onChange, label, className = '' }) {
  function onKeyDown(event) {
    const index = options.findIndex((o) => o.value === value)
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key]
    if (!step) return
    event.preventDefault()
    const next = options[(index + step + options.length) % options.length]
    onChange(next.value)
    event.currentTarget.querySelector(`[data-value="${next.value}"]`)?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={`flex divide-x divide-line-input overflow-hidden rounded border border-line-input bg-surface ${className}`}
    >
      {options.map((o) => {
        const selected = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            data-value={o.value}
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={`h-8 flex-1 px-3 font-mono text-xs transition-colors ${
              selected ? 'bg-brand-700 text-white' : 'text-ink hover:bg-subtle'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
