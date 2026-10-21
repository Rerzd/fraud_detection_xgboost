import { describe, expect, it } from 'vitest'
import {
  allowedVerdicts,
  formatObservedPrecision,
  NOTE_MAX_LENGTH,
  REVIEW_STATUS,
  REVIEW_STATUSES,
  reviewProblem,
  VERDICTS,
} from './review'

describe('verdicts', () => {
  it('never offers pending, which is only the starting state', () => {
    expect(VERDICTS).not.toContain('pending')
    expect(REVIEW_STATUSES).toContain('pending')
  })

  it('does not offer false positive for a low-risk prediction', () => {
    expect(allowedVerdicts('low')).toEqual(['confirmed_fraud', 'legitimate'])
    expect(allowedVerdicts('review')).toEqual(VERDICTS)
    expect(allowedVerdicts('high')).toEqual(VERDICTS)
  })

  it('has a label and a tone for every status', () => {
    for (const status of REVIEW_STATUSES) {
      expect(REVIEW_STATUS[status].label).toBeTruthy()
      expect(REVIEW_STATUS[status].tone).toBeTruthy()
    }
  })
})

describe('reviewProblem', () => {
  const draft = (overrides) => ({ riskLevel: 'high', status: 'confirmed_fraud', note: '', ...overrides })

  it('accepts a verdict on a flagged prediction, with or without a note', () => {
    expect(reviewProblem(draft())).toBeNull()
    expect(reviewProblem(draft({ status: 'false_positive', note: 'known payee' }))).toBeNull()
    expect(reviewProblem(draft({ riskLevel: 'review', status: 'legitimate' }))).toBeNull()
  })

  it('asks for a verdict first', () => {
    expect(reviewProblem(draft({ status: '' }))).toBe('Choose a verdict.')
  })

  it('requires a note to confirm fraud on a low-risk prediction', () => {
    const lowFraud = draft({ riskLevel: 'low' })
    expect(reviewProblem(lowFraud)).toBe('A note is required to confirm fraud on a low-risk prediction.')
    expect(reviewProblem({ ...lowFraud, note: '   ' })).toContain('note is required')
    expect(reviewProblem({ ...lowFraud, note: 'Customer reported it.' })).toBeNull()
  })

  it('rejects false positive on a low-risk prediction', () => {
    expect(reviewProblem(draft({ riskLevel: 'low', status: 'false_positive' }))).toContain('cannot be a false positive')
  })

  it('limits the note to 500 characters', () => {
    expect(reviewProblem(draft({ note: 'x'.repeat(NOTE_MAX_LENGTH) }))).toBeNull()
    expect(reviewProblem(draft({ note: 'x'.repeat(NOTE_MAX_LENGTH + 1) }))).toBe(
      'The note is limited to 500 characters.',
    )
  })
})

describe('formatObservedPrecision', () => {
  it('shows n/a until something has been judged', () => {
    expect(formatObservedPrecision(null)).toBe('n/a')
    expect(formatObservedPrecision(undefined)).toBe('n/a')
  })

  it('shows a percentage, including a real zero', () => {
    expect(formatObservedPrecision(0.75)).toBe('75.0%')
    expect(formatObservedPrecision(1)).toBe('100.0%')
    expect(formatObservedPrecision(0)).toBe('0.0%')
  })
})
