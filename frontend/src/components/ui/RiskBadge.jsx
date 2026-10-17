import { RISK } from '../../lib/format'

export default function RiskBadge({ level, size = 'sm' }) {
  const risk = RISK[level]
  const sizing = size === 'lg' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[11px]'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium tracking-wide uppercase ${sizing} ${risk.badge}`}
    >
      <span className={`size-1.5 rounded-full ${risk.bg}`} aria-hidden="true" />
      {risk.label}
    </span>
  )
}
