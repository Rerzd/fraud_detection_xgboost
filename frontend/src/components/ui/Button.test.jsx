import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import Button from './Button'

const render = (props) => renderToStaticMarkup(<Button {...props}>Run test</Button>)
// The class list contains "disabled:" variants, so match the attribute itself.
const DISABLED = /\sdisabled=""/

describe('Button', () => {
  it('is an enabled, non-submitting button by default', () => {
    const html = render({})
    expect(html).toContain('type="button"')
    expect(html).not.toMatch(DISABLED)
    expect(html).not.toContain('aria-busy')
    expect(html).not.toContain('<svg')
  })

  it('while loading it is disabled, busy and shows a spinner next to the label', () => {
    const html = render({ loading: true })
    expect(html).toMatch(DISABLED)
    expect(html).toContain('aria-busy="true"')
    expect(html).toContain('<svg')
    expect(html).toContain('Run test')
  })

  it('can be disabled without being busy', () => {
    const html = render({ disabled: true })
    expect(html).toMatch(DISABLED)
    expect(html).not.toContain('aria-busy')
  })

  it('lets a form button submit', () => {
    expect(render({ type: 'submit' })).toContain('type="submit"')
  })
})
