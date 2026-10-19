// Display helpers shared across tabs.

export const RISK = {
  low: {
    label: 'Low risk',
    decision: 'Approve',
    text: 'text-risk-low',
    badge: 'border-risk-low-line bg-risk-low-bg text-risk-low',
  },
  review: {
    label: 'Review',
    decision: 'Send to manual review',
    text: 'text-risk-review',
    badge: 'border-risk-review-line bg-risk-review-bg text-risk-review',
  },
  high: {
    label: 'High risk',
    decision: 'Flag for fraud',
    text: 'text-risk-high',
    badge: 'border-risk-high-line bg-risk-high-bg text-risk-high',
  },
}

export const RISK_LEVELS = ['high', 'review', 'low']

const amountFormat = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatAmount(value) {
  if (value === null || value === undefined) return 'missing'
  return amountFormat.format(value)
}

/** Probability as a percentage; extremes are shown as bounds instead of fake precision. */
export function formatProbability(p) {
  if (p >= 0.9999) return '>99.99%'
  if (p < 0.0001) return '<0.01%'
  return `${(p * 100).toFixed(2)}%`
}

/** Raw probability with enough digits to stay truthful near 0 and 1. */
export function formatRawProbability(p) {
  if (p >= 0.999) return p.toFixed(8)
  if (p < 0.001) return p.toExponential(3)
  return p.toFixed(4)
}

export function formatSigned(value, digits = 2) {
  const sign = value > 0 ? '+' : value < 0 ? '\u2212' : ''
  return `${sign}${Math.abs(value).toFixed(digits)}`
}

export function formatPercent(ratio, digits = 1) {
  return `${(ratio * 100).toFixed(digits)}%`
}

/** Backend timestamps are UTC; SQLite drops the offset, so treat naive values as UTC. */
function parseUtc(iso) {
  const hasZone = /[zZ]|[+-]\d\d:\d\d$/.test(iso)
  return new Date(hasZone ? iso : `${iso}Z`)
}

const pad = (n) => String(n).padStart(2, '0')

/** Local date and time to the second (yyyy-mm-dd hh:mm:ss, 24 hours), for audit records. */
export function formatTimestamp(iso) {
  const d = parseUtc(iso)
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  return `${date} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/** The same instant in UTC, as ISO 8601. */
export const formatUtc = (iso) => parseUtc(iso).toISOString()

/** Wall-clock time of day (24 hours), for run timestamps. */
export function formatClock(date) {
  return date.toLocaleTimeString('en-GB', { hour12: false })
}
