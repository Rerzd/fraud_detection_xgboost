export default function Kbd({ children, className = '' }) {
  return (
    <kbd
      className={`inline-flex h-5 min-w-5 items-center justify-center rounded-xs border border-line-strong bg-surface px-1 font-mono text-[11px] text-ink-muted ${className}`}
    >
      {children}
    </kbd>
  )
}
