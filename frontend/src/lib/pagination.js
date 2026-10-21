// Server-side pagination: the API returns { items, total, limit, offset }; the UI shows "x–y of N".

const number = (n) => n.toLocaleString('en-US')

/** "26–50 of 213" for the page that starts at `offset` and holds `count` items. */
export function pageLabel({ offset, count, total }) {
  if (!total || !count) return 'No records'
  return `${number(offset + 1)}–${number(offset + count)} of ${number(total)}`
}

export const hasPrevious = (offset) => offset > 0

export const hasNext = ({ offset, count, total }) => offset + count < total

export const previousOffset = (offset, limit) => Math.max(0, offset - limit)

export const nextOffset = (offset, limit) => offset + limit
