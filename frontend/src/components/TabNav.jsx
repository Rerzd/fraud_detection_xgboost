import Icon from './ui/Icon'

export default function TabNav({ tabs, active, onChange }) {
  function onKeyDown(event) {
    const index = tabs.findIndex((t) => t.id === active)
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key]
    if (!step) return
    event.preventDefault()
    const next = tabs[(index + step + tabs.length) % tabs.length]
    onChange(next.id)
    document.getElementById(`tab-${next.id}`)?.focus()
  }

  return (
    <nav className="border-b border-line">
      <div
        role="tablist"
        aria-label="Sections"
        onKeyDown={onKeyDown}
        className="mx-auto flex max-w-7xl gap-0.5 overflow-x-auto px-2 [scrollbar-width:none] sm:gap-1 sm:px-6"
      >
        {tabs.map((tab) => {
          const selected = tab.id === active
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(tab.id)}
              className={`-mb-px flex items-center gap-2 border-b-2 px-2.5 py-3 text-sm sm:px-3 whitespace-nowrap transition-colors ${
                selected
                  ? 'border-accent text-fg'
                  : 'border-transparent text-muted hover:text-fg'
              }`}
            >
              <Icon name={tab.icon} className="hidden size-4 sm:block" />
              {tab.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
