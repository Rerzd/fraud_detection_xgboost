import { describe, expect, it } from 'vitest'
import { EMPTY_FORM, STEP_MAX, STEP_MIN, toFormValues, validateTransaction } from './validation'

const VALID = {
  type: 'TRANSFER',
  step: '459',
  amount: '1153156',
  oldbalanceOrg: '1153156',
  newbalanceOrig: '0',
  oldbalanceDest: '0',
  newbalanceDest: '0',
}

const errorsFor = (overrides) => validateTransaction({ ...VALID, ...overrides }).errors

describe('validateTransaction', () => {
  it('turns valid form strings into a numeric transaction', () => {
    expect(validateTransaction(VALID)).toEqual({
      errors: {},
      transaction: {
        type: 'TRANSFER',
        step: 459,
        amount: 1153156,
        oldbalanceOrg: 1153156,
        newbalanceOrig: 0,
        oldbalanceDest: 0,
        newbalanceDest: 0,
      },
    })
  })

  it('accepts CASH_OUT and trims whitespace', () => {
    const { transaction } = validateTransaction({ ...VALID, type: 'CASH_OUT', amount: ' 18500.5 ' })
    expect(transaction.type).toBe('CASH_OUT')
    expect(transaction.amount).toBe(18500.5)
  })

  it('rejects types the model was not trained on', () => {
    for (const type of ['PAYMENT', 'DEBIT', 'CASH_IN', '']) {
      expect(errorsFor({ type }).type).toBe('Choose TRANSFER or CASH_OUT.')
    }
  })

  it('requires a whole step inside the simulation range', () => {
    expect(errorsFor({ step: '' }).step).toBe('Required.')
    expect(errorsFor({ step: '1.5' }).step).toBe('Must be a whole number.')
    expect(errorsFor({ step: 'abc' }).step).toBe('Must be a whole number.')
    expect(errorsFor({ step: String(STEP_MIN - 1) }).step).toMatch(/between/)
    expect(errorsFor({ step: String(STEP_MAX + 1) }).step).toMatch(/between/)
    expect(errorsFor({ step: String(STEP_MIN) }).step).toBeUndefined()
    expect(errorsFor({ step: String(STEP_MAX) }).step).toBeUndefined()
  })

  it('requires a positive amount', () => {
    expect(errorsFor({ amount: '' }).amount).toBe('Required.')
    expect(errorsFor({ amount: '0' }).amount).toBe('Must be greater than 0.')
    expect(errorsFor({ amount: '-10' }).amount).toBe('Must be greater than 0.')
    expect(errorsFor({ amount: '12,5' }).amount).toBe('Must be a number.')
  })

  it('allows zero balances but not negative or missing ones', () => {
    expect(errorsFor({ oldbalanceDest: '0' }).oldbalanceDest).toBeUndefined()
    expect(errorsFor({ oldbalanceDest: '-1' }).oldbalanceDest).toBe('Cannot be negative.')
    expect(errorsFor({ newbalanceOrig: '' }).newbalanceOrig).toBe('Required.')
    expect(errorsFor({ newbalanceDest: 'NaN' }).newbalanceDest).toBe('Must be a number.')
  })

  it('returns no transaction while any field is invalid', () => {
    const result = validateTransaction({ ...VALID, amount: '0' })
    expect(result.transaction).toBeNull()
    expect(Object.keys(result.errors)).toEqual(['amount'])
  })

  it('flags every numeric field of the empty form', () => {
    const { errors, transaction } = validateTransaction(EMPTY_FORM)
    expect(transaction).toBeNull()
    expect(Object.keys(errors).sort()).toEqual(
      ['amount', 'newbalanceDest', 'newbalanceOrig', 'oldbalanceDest', 'oldbalanceOrg', 'step'].sort(),
    )
  })
})

describe('toFormValues', () => {
  it('round-trips through validation', () => {
    const tx = { type: 'CASH_OUT', step: 120, amount: 18500, oldbalanceOrg: 42300, newbalanceOrig: 23800, oldbalanceDest: 150000, newbalanceDest: 168500 }
    const values = toFormValues(tx)
    expect(values.amount).toBe('18500')
    expect(validateTransaction(values).transaction).toEqual(tx)
  })
})
