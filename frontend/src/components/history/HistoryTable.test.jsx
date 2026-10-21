import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import HistoryTable from './HistoryTable'

const BATCH_ID = 'abcdef0123456789abcdef0123456789'

const item = (id, overrides = {}) => ({
  id,
  created_at: '2026-10-17T04:21:43.629432',
  source: 'single',
  batch_id: null,
  type: 'TRANSFER',
  amount: 1153156,
  probability: 0.99999988,
  risk_level: 'high',
  payload: { type: 'TRANSFER', step: 459, amount: 1153156 },
  model_version: 'xgb-paysim-v1',
  model_hash: 'cbf91feebec3',
  request_id: 'req-123',
  review_status: 'pending',
  review_note: null,
  reviewed_at: null,
  ...overrides,
})

const render = (items) => renderToStaticMarkup(<HistoryTable items={items} />)

describe('HistoryTable', () => {
  it('has the audit columns in order', () => {
    const html = render([item(1)])
    const headers = [...html.matchAll(/<th[^>]*>(.*?)<\/th>/g)].map((m) => m[1].replace(/<[^>]+>/g, ''))
    expect(headers).toEqual([
      'Details',
      'ID',
      'Timestamp',
      'Source',
      'Batch ID',
      'Type',
      'Amount',
      'Probability',
      'Decision',
      'Review',
    ])
  })

  it('shows the review status of every record as a labelled badge', () => {
    const html = render([
      item(1),
      item(2, { review_status: 'confirmed_fraud', reviewed_at: '2026-10-17T05:00:00' }),
      item(3, { risk_level: 'low', review_status: 'legitimate' }),
      item(4, { review_status: 'false_positive', reviewed_at: '2026-10-17T05:00:00' }),
    ])
    for (const label of ['Pending', 'Confirmed fraud', 'Legitimate', 'False positive']) {
      expect(html).toContain(`>${label}</span>`)
    }
  })

  it('offers one-click verdicts instead of the status in the review queue', () => {
    const html = renderToStaticMarkup(<HistoryTable items={[item(7), item(8)]} quickReview />)
    expect(html).toContain('Quick review')
    for (const label of ['Confirm fraud', 'False positive', 'Legitimate']) {
      expect(html).toContain(`aria-label="${label} for record 7"`)
      expect(html).toContain(`aria-label="${label} for record 8"`)
    }
    expect(html).not.toContain('>Pending</span>')
  })

  it('leaves Source and Batch ID out of the review queue so the verdict buttons fit', () => {
    const html = renderToStaticMarkup(<HistoryTable items={[item(1)]} quickReview />)
    const headers = [...html.matchAll(/<th[^>]*>(.*?)<\/th>/g)].map((m) => m[1].replace(/<[^>]+>/g, ''))
    expect(headers).toEqual(['Details', 'ID', 'Timestamp', 'Type', 'Amount', 'Probability', 'Decision', 'Quick review'])
    // Every row has one cell per header.
    expect([...html.matchAll(/<td/g)]).toHaveLength(headers.length)
  })

  it('shows a short batch id with the full id as a tooltip, and a dash for single predictions', () => {
    const html = render([item(2, { source: 'batch', batch_id: BATCH_ID }), item(1)])
    expect(html).toContain('abcdef01')
    expect(html).toContain(`title="${BATCH_ID}"`)
    expect(html).not.toContain(`>${BATCH_ID}<`)
    expect(html).toContain('>-<')
  })

  it('keeps every record collapsed until it is opened', () => {
    const html = render([item(1), item(2)])
    expect(html.match(/aria-expanded="false"/g)).toHaveLength(2)
    expect(html).not.toContain('Stored payload')
  })

  it('gives each record row a tbody of its own so detail rows do not break the zebra', () => {
    const html = render([item(1), item(2), item(3)])
    expect(html.match(/<tbody/g)).toHaveLength(3)
  })
})
