import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import RecordDetail from './RecordDetail'

const record = (overrides = {}) => ({
  id: 12,
  created_at: '2026-10-17T04:21:43.629432Z',
  source: 'batch',
  batch_id: 'abcdef0123456789abcdef0123456789',
  type: 'TRANSFER',
  amount: 1153156,
  probability: 0.99999988,
  risk_level: 'high',
  payload: { type: 'TRANSFER', step: 459 },
  model_version: 'xgb-paysim-v1',
  model_hash: 'cbf91feebec3',
  request_id: '5f0c8d52-3a1e-4b7c-9d41-8e6a2b7f1c03',
  review_status: 'pending',
  review_note: null,
  reviewed_at: null,
  ...overrides,
})

const render = (item) => renderToStaticMarkup(<RecordDetail item={item} onUpdate={() => {}} />)

describe('RecordDetail', () => {
  it('shows the model and the request id in monospace', () => {
    const html = render(record())
    expect(html).toContain('xgb-paysim-v1 · cbf91feebec3')
    expect(html).toContain('5f0c8d52-3a1e-4b7c-9d41-8e6a2b7f1c03')
    expect(html).toMatch(/font-mono[^>]*>5f0c8d52/)
  })

  it('says so when a record was stored without a request id', () => {
    expect(render(record({ request_id: null }))).toContain('>none<')
  })

  it('shows the stored payload and the batch it came from', () => {
    const html = render(record())
    expect(html).toContain('Stored payload')
    expect(html).toContain('abcdef0123456789abcdef0123456789')
  })

  it('has a review form with a verdict, a note and a save button', () => {
    const html = render(record())
    expect(html).toContain('Analyst review')
    expect(html).toContain('>Verdict</label>')
    expect(html).toContain('Save review')
    expect(html).toContain('0/500')
    expect(html).toContain('not reviewed by an analyst')
  })

  it('starts a pending record with no verdict chosen', () => {
    const html = render(record())
    expect(html).toContain('<option value="" selected="">Choose a verdict</option>')
  })

  it('shows a saved verdict, its note and when it was given', () => {
    const html = render(
      record({
        review_status: 'confirmed_fraud',
        review_note: 'Customer called us.',
        reviewed_at: '2026-10-17T05:00:00Z',
      }),
    )
    expect(html).toContain('reviewed 2026-10-17T05:00:00.000Z UTC')
    expect(html).toContain('Customer called us.')
    expect(html).toContain('<option value="confirmed_fraud" selected="">Confirmed fraud</option>')
  })

  it('does not offer false positive for a low-risk prediction', () => {
    const html = render(record({ risk_level: 'low', review_status: 'legitimate' }))
    expect(html).toContain('Confirmed fraud')
    expect(html).not.toContain('value="false_positive"')
    expect(render(record())).toContain('value="false_positive"')
  })
})
