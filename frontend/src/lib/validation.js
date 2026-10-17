// Client-side validation mirroring the backend schema (backend/app/schemas.py: TransactionIn).

export const TRANSACTION_TYPES = ['TRANSFER', 'CASH_OUT']
export const STEP_MIN = 1
export const STEP_MAX = 744

export const BALANCE_FIELDS = ['oldbalanceOrg', 'newbalanceOrig', 'oldbalanceDest', 'newbalanceDest']
export const TRANSACTION_FIELDS = ['type', 'step', 'amount', ...BALANCE_FIELDS]

export const EMPTY_FORM = {
  type: 'TRANSFER',
  step: '',
  amount: '',
  oldbalanceOrg: '',
  newbalanceOrig: '',
  oldbalanceDest: '',
  newbalanceDest: '',
}

function parseNumber(raw) {
  const text = String(raw ?? '').trim()
  if (text === '') return { empty: true }
  const value = Number(text)
  return Number.isFinite(value) ? { value } : { invalid: true }
}

/**
 * Validate raw form values (strings or numbers).
 * Returns { errors: {field: message}, transaction: object | null }.
 */
export function validateTransaction(values) {
  const errors = {}
  const transaction = {}

  if (!TRANSACTION_TYPES.includes(values.type)) {
    errors.type = 'Choose TRANSFER or CASH_OUT.'
  } else {
    transaction.type = values.type
  }

  const step = parseNumber(values.step)
  if (step.empty) errors.step = 'Required.'
  else if (step.invalid || !Number.isInteger(step.value)) errors.step = 'Must be a whole number.'
  else if (step.value < STEP_MIN || step.value > STEP_MAX)
    errors.step = `Must be between ${STEP_MIN} and ${STEP_MAX}.`
  else transaction.step = step.value

  const amount = parseNumber(values.amount)
  if (amount.empty) errors.amount = 'Required.'
  else if (amount.invalid) errors.amount = 'Must be a number.'
  else if (amount.value <= 0) errors.amount = 'Must be greater than 0.'
  else transaction.amount = amount.value

  for (const field of BALANCE_FIELDS) {
    const balance = parseNumber(values[field])
    if (balance.empty) errors[field] = 'Required.'
    else if (balance.invalid) errors[field] = 'Must be a number.'
    else if (balance.value < 0) errors[field] = 'Cannot be negative.'
    else transaction[field] = balance.value
  }

  return { errors, transaction: Object.keys(errors).length ? null : transaction }
}

/** Example transaction (numbers) -> form values (strings). */
export function toFormValues(transaction) {
  return Object.fromEntries(
    TRANSACTION_FIELDS.map((f) => [f, f === 'type' ? transaction[f] : String(transaction[f])]),
  )
}
