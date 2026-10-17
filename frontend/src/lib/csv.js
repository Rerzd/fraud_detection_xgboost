// CSV helpers for the Batch tab. Everything here runs client-side.

import { TRANSACTION_FIELDS } from './validation'

// Three sample rows (one per risk level, taken from the backend examples).
const TEMPLATE_ROWS = [
  { type: 'TRANSFER', step: 459, amount: 1153156, oldbalanceOrg: 1153156, newbalanceOrig: 0, oldbalanceDest: 0, newbalanceDest: 0 },
  { type: 'TRANSFER', step: 350, amount: 400000, oldbalanceOrg: 800000, newbalanceOrig: 400000, oldbalanceDest: 0, newbalanceDest: 0 },
  { type: 'CASH_OUT', step: 120, amount: 18500, oldbalanceOrg: 42300, newbalanceOrig: 23800, oldbalanceDest: 150000, newbalanceDest: 168500 },
]

export const RESULT_COLUMNS = ['row', ...TRANSACTION_FIELDS, 'probability', 'risk_level']

export function escapeCell(value) {
  if (value === null || value === undefined) return ''
  const text = String(value)
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function toCsv(rows, columns) {
  const lines = [columns.join(',')]
  for (const row of rows) lines.push(columns.map((c) => escapeCell(row[c])).join(','))
  return `${lines.join('\n')}\n`
}

export const templateCsv = () => toCsv(TEMPLATE_ROWS, TRANSACTION_FIELDS)
export const resultsCsv = (rows) => toCsv(rows, RESULT_COLUMNS)

export function downloadText(filename, text, type = 'text/csv') {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(bytes % (1024 * 1024) ? 1 : 0)} MB`
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`
  return `${bytes} B`
}

/** Pre-upload check against the backend limits; returns an error message or null. */
export function checkFile(file, limits) {
  if (!/\.csv$/i.test(file.name)) return 'Choose a .csv file.'
  if (file.size === 0) return 'The file is empty.'
  if (limits && file.size > limits.max_bytes) {
    return `The file is ${formatBytes(file.size)}; the limit is ${formatBytes(limits.max_bytes)}.`
  }
  return null
}
