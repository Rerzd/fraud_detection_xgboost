import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import BatchResults from './BatchResults'

const row = (line, probability, risk_level) => ({
  row: line,
  type: 'TRANSFER',
  step: 1,
  amount: 100,
  oldbalanceOrg: 100,
  newbalanceOrig: 0,
  oldbalanceDest: 0,
  newbalanceDest: 0,
  probability,
  risk_level,
})

function result(overrides = {}) {
  const rows = [row(2, 0.01, 'low'), row(3, 0.99, 'high'), row(4, 0.3, 'review')]
  return {
    batch_id: 'abcdef0123456789abcdef0123456789',
    summary: { total: 4, scored: 3, invalid: 1, risk_counts: { high: 1, review: 1, low: 1 }, flagged_rate: 1 / 3 },
    rows,
    errors: [{ row: 5, reason: 'type: Input should be TRANSFER or CASH_OUT' }],
    ...overrides,
  }
}

const render = (props) => renderToStaticMarkup(<BatchResults fileName="in.csv" {...props} />)

describe('BatchResults', () => {
  it('shows the run totals with a short run id and the full id as a tooltip', () => {
    const html = render({ result: result() })
    expect(html).toContain('abcdef01')
    expect(html).toContain('title="abcdef0123456789abcdef0123456789"')
    expect(html).toContain('33.3%')
    expect(html).toContain('in.csv')
  })

  it('lists scored rows by probability, highest first', () => {
    const html = render({ result: result() })
    const order = ['0.9900', '0.3000', '0.0100'].map((p) => html.indexOf(p))
    expect(order.every((i) => i > -1)).toBe(true)
    expect(order).toEqual([...order].sort((a, b) => a - b))
  })

  it('shows the rejected rows panel only when there are errors', () => {
    expect(render({ result: result() })).toContain('Rejected rows')
    expect(render({ result: result({ errors: [] }) })).not.toContain('Rejected rows')
  })

  it('omits the scored rows panel when every row was rejected', () => {
    const html = render({
      result: result({
        rows: [],
        summary: { total: 1, scored: 0, invalid: 1, risk_counts: { high: 0, review: 0, low: 0 }, flagged_rate: 0 },
      }),
    })
    expect(html).not.toContain('Scored rows')
    expect(html).toContain('Rejected rows')
  })

  it('caps the rendered rows and says so', () => {
    const rows = Array.from({ length: 250 }, (_, i) => row(i + 2, 0.5, 'review'))
    const html = render({
      result: result({
        rows,
        summary: { total: 250, scored: 250, invalid: 0, risk_counts: { high: 0, review: 250, low: 0 }, flagged_rate: 0 },
        errors: [],
      }),
    })
    expect(html.match(/<tr/g).length).toBe(1 + 200)
    expect(html).toContain('Showing the top 200 of 250 rows')
  })
})
