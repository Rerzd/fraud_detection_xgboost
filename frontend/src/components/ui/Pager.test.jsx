import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import Pager from './Pager'

const render = (props) => renderToStaticMarkup(<Pager limit={25} onChange={() => {}} {...props} />)
const button = (html, name) => html.match(new RegExp(`<button[^>]*>${name}</button>`))[0]

describe('Pager', () => {
  it('labels the page with its range and the total', () => {
    expect(render({ offset: 25, count: 25, total: 213 })).toContain('26–50 of 213')
  })

  it('disables Previous on the first page and keeps Next', () => {
    const html = render({ offset: 0, count: 25, total: 60 })
    expect(button(html, 'Previous')).toContain('disabled=""')
    expect(button(html, 'Next')).not.toContain('disabled=""')
  })

  it('disables Next on the last page and keeps Previous', () => {
    const html = render({ offset: 50, count: 10, total: 60 })
    expect(button(html, 'Next')).toContain('disabled=""')
    expect(button(html, 'Previous')).not.toContain('disabled=""')
  })

  it('disables both while a page is loading', () => {
    const html = render({ offset: 25, count: 25, total: 100, busy: true })
    expect(button(html, 'Previous')).toContain('disabled=""')
    expect(button(html, 'Next')).toContain('disabled=""')
  })

  it('says so when there is nothing to page through', () => {
    const html = render({ offset: 0, count: 0, total: 0 })
    expect(html).toContain('No records')
    expect(button(html, 'Previous')).toContain('disabled=""')
    expect(button(html, 'Next')).toContain('disabled=""')
  })
})
