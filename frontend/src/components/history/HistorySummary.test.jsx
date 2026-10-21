import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import HistorySummary from './HistorySummary'

const stats = (review = {}) => ({
  total: 8,
  by_risk: { high: 3, review: 2, low: 3 },
  by_source: { single: 2, batch: 6 },
  review: {
    pending: 4,
    reviewed: 4,
    confirmed_fraud: 3,
    false_positive: 1,
    missed_by_model: 0,
    observed_precision: 0.75,
    ...review,
  },
})

const render = (s) => renderToStaticMarkup(<HistorySummary stats={s} />)

describe('HistorySummary', () => {
  it('shows the review queue length', () => {
    const html = render(stats())
    expect(html).toContain('Review queue')
    expect(html).toMatch(/Review queue<\/dt><dd[^>]*>4</)
  })

  it('shows the observed precision, labelled as observed on demo data', () => {
    const html = render(stats())
    expect(html).toContain('>Precision<')
    expect(html).toContain('75.0%')
    expect(html).toContain('observed on demo data')
    expect(html).toContain('not a model metric')
  })

  it('shows n/a until a flagged prediction has been judged', () => {
    const html = render(stats({ observed_precision: null, reviewed: 0, confirmed_fraud: 0, false_positive: 0 }))
    expect(html).toMatch(/Precision<\/dt><dd[^>]*>n\/a</)
  })

  it('keeps the existing record counts', () => {
    const html = render(stats())
    expect(html).toContain('2 / 6')
    expect(html).toContain('37.5% of records')
  })
})
