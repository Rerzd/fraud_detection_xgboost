import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { RISK, RISK_LEVELS } from '../../lib/format'
import RiskBadge from './RiskBadge'

const render = (props) => renderToStaticMarkup(<RiskBadge {...props} />)

describe('RiskBadge', () => {
  it('shows the label of every risk level', () => {
    expect(render({ level: 'high' })).toContain('High risk')
    expect(render({ level: 'review' })).toContain('Review')
    expect(render({ level: 'low' })).toContain('Low risk')
  })

  it('never relies on color alone: each level carries an icon and its own color classes', () => {
    const markups = RISK_LEVELS.map((level) => render({ level }))
    markups.forEach((html, i) => {
      expect(html).toContain('<svg')
      expect(html).toContain(RISK[RISK_LEVELS[i]].text)
    })
    expect(new Set(markups).size).toBe(RISK_LEVELS.length)
  })

  it('has a larger md size', () => {
    expect(render({ level: 'low', size: 'sm' })).toContain('h-5')
    expect(render({ level: 'low', size: 'md' })).toContain('h-6')
  })
})
