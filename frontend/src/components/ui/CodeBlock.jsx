import useCopy from '../../hooks/useCopy'
import Button from './Button'
import Icon from './Icon'

/** Read-only monospace block (JSON, commands) with a header strip and a Copy button. */
export default function CodeBlock({ code, label, className = '' }) {
  const { copied, failed, copy } = useCopy()
  return (
    <div className={`overflow-hidden rounded border border-line ${className}`}>
      <div className="flex h-8 items-center justify-between gap-2 border-b border-line bg-subtle pr-1 pl-3">
        <span className="text-[11px] font-semibold tracking-wider text-ink-muted uppercase">{label}</span>
        <Button size="sm" variant="ghost" onClick={() => copy(code)} aria-label={`Copy ${label}`}>
          <Icon name={copied ? 'check' : 'copy'} />
          <span aria-live="polite">{copied ? 'Copied' : failed ? 'Copy failed' : 'Copy'}</span>
        </Button>
      </div>
      <pre className="max-h-72 overflow-auto bg-subtle px-3 py-2 font-mono text-xs leading-relaxed text-ink">
        <code>{code}</code>
      </pre>
    </div>
  )
}
