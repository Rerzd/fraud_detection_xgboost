import { describe, expect, it } from 'vitest'
import { checkFile, escapeCell, formatBytes, RESULT_COLUMNS, resultsCsv, templateCsv, toCsv } from './csv'
import { TRANSACTION_FIELDS, validateTransaction } from './validation'

const MB = 1024 * 1024

describe('escapeCell', () => {
  it('leaves plain values alone and blanks missing ones', () => {
    expect(escapeCell('TRANSFER')).toBe('TRANSFER')
    expect(escapeCell(0)).toBe('0')
    expect(escapeCell(null)).toBe('')
    expect(escapeCell(undefined)).toBe('')
  })

  it('quotes commas, quotes and line breaks', () => {
    expect(escapeCell('a,b')).toBe('"a,b"')
    expect(escapeCell('say "hi"')).toBe('"say ""hi"""')
    expect(escapeCell('two\nlines')).toBe('"two\nlines"')
  })
})

describe('toCsv', () => {
  it('writes the header, rows in column order and a trailing newline', () => {
    const csv = toCsv([{ b: 2, a: 1 }, { a: 'x,y' }], ['a', 'b'])
    expect(csv).toBe('a,b\n1,2\n"x,y",\n')
  })
})

describe('templateCsv', () => {
  const [header, ...rows] = templateCsv().trim().split('\n')

  it('uses exactly the columns the backend requires', () => {
    expect(header.split(',')).toEqual(TRANSACTION_FIELDS)
  })

  it('contains sample rows that pass client validation', () => {
    expect(rows).toHaveLength(3)
    for (const line of rows) {
      const values = Object.fromEntries(header.split(',').map((col, i) => [col, line.split(',')[i]]))
      expect(validateTransaction(values).errors).toEqual({})
    }
  })
})

describe('resultsCsv', () => {
  it('puts the line number first and the score last', () => {
    const row = { row: 2, type: 'TRANSFER', step: 1, amount: 10, oldbalanceOrg: 10, newbalanceOrig: 0, oldbalanceDest: 0, newbalanceDest: 0, probability: 0.97, risk_level: 'high' }
    const [header, line] = resultsCsv([row]).trim().split('\n')
    expect(header.split(',')).toEqual(RESULT_COLUMNS)
    expect(RESULT_COLUMNS[0]).toBe('row')
    expect(RESULT_COLUMNS.slice(-2)).toEqual(['probability', 'risk_level'])
    expect(line).toBe('2,TRANSFER,1,10,10,0,0,0,0.97,high')
  })
})

describe('formatBytes', () => {
  it('picks a readable unit', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(2048)).toBe('2 KB')
    expect(formatBytes(5 * MB)).toBe('5 MB')
    expect(formatBytes(1.5 * MB)).toBe('1.5 MB')
  })
})

describe('checkFile', () => {
  const limits = { max_bytes: 5 * MB }

  it('accepts a CSV inside the limit, whatever the extension case', () => {
    expect(checkFile({ name: 'tx.csv', size: 100 }, limits)).toBeNull()
    expect(checkFile({ name: 'TX.CSV', size: 100 }, limits)).toBeNull()
  })

  it('rejects other extensions and empty files', () => {
    expect(checkFile({ name: 'tx.txt', size: 100 }, limits)).toBe('Choose a .csv file.')
    expect(checkFile({ name: 'tx.csv.xlsx', size: 100 }, limits)).toBe('Choose a .csv file.')
    expect(checkFile({ name: 'tx.csv', size: 0 }, limits)).toBe('The file is empty.')
  })

  it('rejects files over the backend size limit', () => {
    expect(checkFile({ name: 'tx.csv', size: 6 * MB }, limits)).toBe('The file is 6 MB; the limit is 5 MB.')
  })

  it('skips the size check until the limits are known', () => {
    expect(checkFile({ name: 'tx.csv', size: 50 * MB }, null)).toBeNull()
  })
})
