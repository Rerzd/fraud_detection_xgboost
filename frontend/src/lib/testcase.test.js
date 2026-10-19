import { describe, expect, it } from 'vitest'
import { buildCurl, caseId } from './testcase'

describe('caseId', () => {
  it('is TC- plus a short date and time, zero padded', () => {
    expect(caseId(new Date(2026, 9, 18, 15, 30, 42))).toBe('TC-261018-153042')
    expect(caseId(new Date(2026, 0, 2, 3, 4, 5))).toBe('TC-260102-030405')
  })

  it('differs between runs a second apart', () => {
    expect(caseId(new Date(2026, 9, 18, 15, 30, 42))).not.toBe(caseId(new Date(2026, 9, 18, 15, 30, 43)))
  })
})

describe('buildCurl', () => {
  const payload = { type: 'TRANSFER', step: 459, amount: 1153156, oldbalanceOrg: 1153156 }
  const curl = buildCurl('http://localhost:8000/predict', payload)

  it('posts JSON to the given url', () => {
    expect(curl.startsWith("curl -X POST 'http://localhost:8000/predict'")).toBe(true)
    expect(curl).toContain("-H 'Content-Type: application/json'")
  })

  it('carries the exact payload as the body', () => {
    const body = curl.match(/-d '(.*)'$/)[1]
    expect(JSON.parse(body)).toEqual(payload)
  })

  it('escapes single quotes so the shell keeps the body intact', () => {
    expect(buildCurl('http://x/predict', { note: "it's" })).toContain(`-d '{"note":"it'\\''s"}'`)
  })
})
