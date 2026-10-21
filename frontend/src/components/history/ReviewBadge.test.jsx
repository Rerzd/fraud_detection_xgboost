import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { REVIEW_STATUS, REVIEW_STATUSES } from '../../lib/review'
import ReviewBadge from './ReviewBadge'

describe('ReviewBadge', () => {
  it('spells out every status, so color is never the only cue', () => {
    for (const status of REVIEW_STATUSES) {
      expect(renderToStaticMarkup(<ReviewBadge status={status} />)).toContain(`>${REVIEW_STATUS[status].label}</span>`)
    }
  })

  it('uses the risk colors only where the status is about risk', () => {
    const html = (status) => renderToStaticMarkup(<ReviewBadge status={status} />)
    expect(html('pending')).toContain('text-risk-review')
    expect(html('confirmed_fraud')).toContain('text-risk-high')
    expect(html('false_positive')).toContain('text-ink-muted')
  })
})
