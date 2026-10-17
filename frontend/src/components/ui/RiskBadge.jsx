import { RISK } from '../../lib/format'
import Icon from './Icon'

const ICONS = { high: 'flag', review: 'eye', low: 'check' }
const SIZES = {
  sm: { box: 'h-5 gap-1 px-1.5 text-[11px]', icon: 'size-3' },
  md: { box: 'h-6 gap-1.5 px-2 text-xs', icon: 'size-3.5' },
}

/** Risk level as icon + label + color; never color alone. */
export default function RiskBadge({ level, size = 'sm' }) {
  const risk = RISK[level]
  const s = SIZES[size]
  return (
    <span
      className={`inline-flex items-center rounded-sm border font-semibold tracking-wide whitespace-nowrap uppercase ${s.box} ${risk.badge}`}
    >
      <Icon name={ICONS[level]} className={s.icon} />
      {risk.label}
    </span>
  )
}
