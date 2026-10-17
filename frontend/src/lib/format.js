// Display helpers shared across tabs.

export const RISK = {
  low: {
    label: 'Low risk',
    decision: 'Approve',
    text: 'text-risk-low',
    bg: 'bg-risk-low',
    badge: 'border-risk-low/30 bg-risk-low/10 text-risk-low',
  },
  review: {
    label: 'Review',
    decision: 'Send to manual review',
    text: 'text-risk-review',
    bg: 'bg-risk-review',
    badge: 'border-risk-review/30 bg-risk-review/10 text-risk-review',
  },
  high: {
    label: 'High risk',
    decision: 'Flag for fraud',
    text: 'text-risk-high',
    bg: 'bg-risk-high',
    badge: 'border-risk-high/30 bg-risk-high/10 text-risk-high',
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

export function formatDateTime(iso) {
  // Backend timestamps are UTC; SQLite drops the offset, so treat naive values as UTC.
  const hasZone = /[zZ]|[+-]\d\d:\d\d$/.test(iso)
  const date = new Date(hasZone ? iso : `${iso}Z`)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const TYPE_LABELS = { TRANSFER: 'Transfer', CASH_OUT: 'Cash out' }
export const TYPE_CODES = { 0: 'TRANSFER', 1: 'CASH_OUT' }
