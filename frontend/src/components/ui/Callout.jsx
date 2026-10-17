import Icon from './Icon'

const TONES = {
  info: { box: 'border-brand-700/30 bg-brand-50', icon: 'info', color: 'text-brand-700' },
  warning: { box: 'border-risk-review-line bg-risk-review-bg', icon: 'alert', color: 'text-risk-review' },
  danger: { box: 'border-risk-high-line bg-risk-high-bg', icon: 'alert', color: 'text-risk-high' },
}

/** Bordered message: info, warning or danger. Warning and danger are announced as alerts. */
export default function Callout({ tone = 'info', title, actions, role, className = '', children }) {
  const t = TONES[tone]
  return (
    <div
      role={role ?? (tone === 'info' ? undefined : 'alert')}
      className={`flex items-start gap-3 rounded border px-3 py-2.5 text-[13px] ${t.box} ${className}`}
    >
      <Icon name={t.icon} className={`mt-0.5 size-4 shrink-0 ${t.color}`} />
      <div className="min-w-0 flex-1 text-ink-muted">
        {title && <p className={`font-semibold ${t.color}`}>{title}</p>}
        {children && <div className={title ? 'mt-0.5' : ''}>{children}</div>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  )
}
