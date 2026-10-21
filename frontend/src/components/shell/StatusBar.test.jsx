import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import StatusBar from './StatusBar'

const stats = (pending, precision) => ({ review: { pending, observed_precision: precision } })
const render = (s) =>
  renderToStaticMarkup(
    <StatusBar apiUrl="http://localhost:8000" status="online" thresholds={{ review: 0.2, fraud: 0.5 }} stats={s} />,
  )

describe('StatusBar', () => {
  it('shows the review queue and the observed precision once the stats are in', () => {
    const html = render(stats(3, 0.75))
    expect(html).toMatch(/review queue<\/span><span[^>]*>3</)
    expect(html).toContain('75.0%')
    expect(html).toContain('observed, demo data')
  })

  it('shows n/a for the precision when nothing has been judged', () => {
    expect(render(stats(0, null))).toContain('n/a')
  })

  it('leaves the review items out while the stats are loading', () => {
    const html = render(null)
    expect(html).not.toContain('review queue')
    expect(html).toContain('thresholds')
  })
})
