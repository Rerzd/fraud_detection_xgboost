import { describe, expect, it } from 'vitest'
import { hasNext, hasPrevious, nextOffset, pageLabel, previousOffset } from './pagination'

describe('pageLabel', () => {
  it('shows the range of the page and the total', () => {
    expect(pageLabel({ offset: 0, count: 25, total: 213 })).toBe('1–25 of 213')
    expect(pageLabel({ offset: 25, count: 25, total: 213 })).toBe('26–50 of 213')
  })

  it('ends at the last record on a short final page', () => {
    expect(pageLabel({ offset: 200, count: 13, total: 213 })).toBe('201–213 of 213')
    expect(pageLabel({ offset: 0, count: 1, total: 1 })).toBe('1–1 of 1')
  })

  it('groups thousands', () => {
    expect(pageLabel({ offset: 1000, count: 50, total: 12345 })).toBe('1,001–1,050 of 12,345')
  })

  it('says there are no records instead of "1-0 of 0"', () => {
    expect(pageLabel({ offset: 0, count: 0, total: 0 })).toBe('No records')
    expect(pageLabel({ offset: 50, count: 0, total: 10 })).toBe('No records')
  })
})

describe('paging', () => {
  it('cannot go back from the first page', () => {
    expect(hasPrevious(0)).toBe(false)
    expect(hasPrevious(25)).toBe(true)
  })

  it('can go forward only while records remain after this page', () => {
    expect(hasNext({ offset: 0, count: 25, total: 26 })).toBe(true)
    expect(hasNext({ offset: 25, count: 1, total: 26 })).toBe(false)
    expect(hasNext({ offset: 0, count: 25, total: 25 })).toBe(false)
    expect(hasNext({ offset: 0, count: 0, total: 0 })).toBe(false)
  })

  it('moves one page at a time and never below zero', () => {
    expect(nextOffset(25, 25)).toBe(50)
    expect(previousOffset(50, 25)).toBe(25)
    expect(previousOffset(10, 25)).toBe(0)
  })
})
