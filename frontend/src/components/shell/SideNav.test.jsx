import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MobileNav, SideNav } from './SideNav'

describe('navigation', () => {
  it('lists the review queue under Records', () => {
    const html = renderToStaticMarkup(<SideNav active="analyze" />)
    expect(html.indexOf('Records')).toBeLessThan(html.indexOf('Review queue'))
    expect(html).toContain('href="#review"')
    expect(html.indexOf('Audit log')).toBeLessThan(html.indexOf('Review queue'))
    expect(html.indexOf('Review queue')).toBeLessThan(html.indexOf('Model card'))
  })

  it('shows how many records wait in the queue, on wide and narrow screens', () => {
    for (const Nav of [SideNav, MobileNav]) {
      const html = renderToStaticMarkup(<Nav active="analyze" badges={{ review: 7 }} />)
      expect(html).toContain('>7</span>')
      expect(html).toContain('(7 pending)')
    }
  })

  it('draws no badge for an empty queue or before the count is known', () => {
    for (const badges of [{ review: 0 }, { review: undefined }, {}]) {
      const html = renderToStaticMarkup(<SideNav active="analyze" badges={badges} />)
      expect(html).not.toContain('pending)')
    }
  })
})
