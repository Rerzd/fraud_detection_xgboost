/** Underline tabs with roving tabindex and arrow-key navigation. Tabs: { id, label, count? }. */
export default function Tabs({ tabs, value, onChange, label, idPrefix = 'tabs', className = '' }) {
  function onKeyDown(event) {
    const index = tabs.findIndex((t) => t.id === value)
    const target = {
      ArrowRight: (index + 1) % tabs.length,
      ArrowLeft: (index - 1 + tabs.length) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    }[event.key]
    if (target === undefined) return
    event.preventDefault()
    onChange(tabs[target].id)
    document.getElementById(`${idPrefix}-tab-${tabs[target].id}`)?.focus()
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={`flex overflow-x-auto border-b border-line [scrollbar-width:none] ${className}`}
    >
      {tabs.map((tab) => {
        const selected = tab.id === value
        return (
          <button
            key={tab.id}
            id={`${idPrefix}-tab-${tab.id}`}
            role="tab"
            type="button"
            aria-selected={selected}
            aria-controls={`${idPrefix}-panel-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={`-mb-px inline-flex h-9 items-center gap-1.5 border-b-2 px-3 text-[13px] font-medium whitespace-nowrap transition-colors ${
              selected ? 'border-brand-700 text-brand-700' : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`rounded-xs px-1 font-mono text-[11px] ${
                  selected ? 'bg-brand-50 text-brand-700' : 'bg-subtle text-ink-muted'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/** Renders its children only while `id` is the selected tab. */
export function TabPanel({ idPrefix = 'tabs', id, value, children, className = '' }) {
  if (id !== value) return null
  return (
    <div
      role="tabpanel"
      id={`${idPrefix}-panel-${id}`}
      aria-labelledby={`${idPrefix}-tab-${id}`}
      tabIndex={0}
      className={className}
    >
      {children}
    </div>
  )
}
