import { describe, expect, it } from 'vitest'
import {
  formatAmount,
  formatClock,
  formatPercent,
  formatProbability,
  formatRawProbability,
  formatSigned,
  formatTimestamp,
  formatUtc,
  RISK,
  RISK_LEVELS,
} from './format'

// Real probabilities of the backend examples (backend/app/examples.py).
const NOTEBOOK_FRAUD = 0.99999988
const HALF_TO_EMPTY_DEST = 0.26537
const CONSISTENT_CASHOUT = 0.0000461

describe('RISK', () => {
  it('describes every risk level, most severe first', () => {
    expect(RISK_LEVELS).toEqual(['high', 'review', 'low'])
    for (const level of RISK_LEVELS) {
      expect(RISK[level]).toMatchObject({ label: expect.any(String), decision: expect.any(String) })
      expect(RISK[level].text).toBe(`text-risk-${level}`)
    }
  })
})

describe('formatProbability', () => {
  it('shows bounds at the extremes instead of fake precision', () => {
    expect(formatProbability(NOTEBOOK_FRAUD)).toBe('>99.99%')
    expect(formatProbability(CONSISTENT_CASHOUT)).toBe('<0.01%')
  })

  it('uses two decimals in between', () => {
    expect(formatProbability(HALF_TO_EMPTY_DEST)).toBe('26.54%')
    expect(formatProbability(0.5)).toBe('50.00%')
  })
})

describe('formatRawProbability', () => {
  it('keeps enough digits near 0 and 1', () => {
    expect(formatRawProbability(NOTEBOOK_FRAUD)).toBe('0.99999988')
    expect(formatRawProbability(CONSISTENT_CASHOUT)).toBe('4.610e-5')
    expect(formatRawProbability(HALF_TO_EMPTY_DEST)).toBe('0.2654')
  })
})

describe('formatSigned', () => {
  it('signs contributions with a real minus sign', () => {
    expect(formatSigned(1.234)).toBe('+1.23')
    expect(formatSigned(-0.5)).toBe('−0.50')
    expect(formatSigned(0)).toBe('0.00')
    expect(formatSigned(2, 3)).toBe('+2.000')
  })
})

describe('formatAmount and formatPercent', () => {
  it('formats money with two decimals and marks missing values', () => {
    expect(formatAmount(1153156)).toBe('1,153,156.00')
    expect(formatAmount(0)).toBe('0.00')
    expect(formatAmount(null)).toBe('missing')
  })

  it('formats ratios as percentages', () => {
    expect(formatPercent(8 / 27)).toBe('29.6%')
    expect(formatPercent(0.003, 2)).toBe('0.30%')
  })
})

describe('formatTimestamp', () => {
  it('treats timestamps without a zone as UTC', () => {
    expect(formatTimestamp('2026-10-17T04:21:43.629432')).toBe(formatTimestamp('2026-10-17T04:21:43.629432Z'))
    expect(formatTimestamp('2026-10-17T04:21:43+00:00')).toBe(formatTimestamp('2026-10-17T04:21:43Z'))
  })

  it('shows local date and 24-hour time to the second', () => {
    const local = new Date(2026, 9, 17, 4, 21, 43)
    expect(formatTimestamp(local.toISOString())).toBe('2026-10-17 04:21:43')
  })
})

describe('formatUtc', () => {
  it('returns the same instant as an ISO string in UTC', () => {
    expect(formatUtc('2026-10-17T04:21:43.629432')).toBe('2026-10-17T04:21:43.629Z')
    expect(formatUtc('2026-10-17T04:21:43+00:00')).toBe('2026-10-17T04:21:43.000Z')
  })
})

describe('formatClock', () => {
  it('shows a 24-hour time of day', () => {
    expect(formatClock(new Date(2026, 9, 18, 15, 4, 9))).toBe('15:04:09')
    expect(formatClock(new Date(2026, 9, 18, 0, 0, 0))).toBe('00:00:00')
  })
})
