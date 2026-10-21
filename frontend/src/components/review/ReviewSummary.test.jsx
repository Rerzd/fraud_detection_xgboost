import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import ReviewSummary from './ReviewSummary'

const review = (overrides = {}) => ({
  pending: 2,
  reviewed: 5,
  confirmed_fraud: 4,
  false_positive: 1,
  missed_by_model: 1,
  observed_precision: 0.75,
  ...overrides,
})

const render = (r) => renderToStaticMarkup(<ReviewSummary review={r} />)

describe('ReviewSummary', () => {
  it('shows the queue, the verdict counts and the observed precision', () => {
    const html = render(review())
    expect(html).toMatch(/In the queue<\/dt><dd[^>]*>2</)
    expect(html).toMatch(/Reviewed<\/dt><dd[^>]*>5</)
    expect(html).toMatch(/Confirmed fraud<\/dt><dd[^>]*>4</)
    expect(html).toMatch(/False positives<\/dt><dd[^>]*>1</)
    expect(html).toContain('75.0%')
  })

  it('says how many confirmed frauds the model had missed', () => {
    expect(render(review())).toContain('1 missed by the model')
    expect(render(review({ missed_by_model: 0 }))).toContain('none missed')
  })

  it('labels the precision as observed on demo data, not a model metric', () => {
    const html = render(review())
    expect(html).toContain('observed on demo data')
    expect(html).toContain('not a model metric')
  })

  it('shows n/a for the precision before anything was judged', () => {
    expect(render(review({ observed_precision: null }))).toMatch(/Observed precision<\/dt><dd[^>]*>n\/a</)
  })
})
