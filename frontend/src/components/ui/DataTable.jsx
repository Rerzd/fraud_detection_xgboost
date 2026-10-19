/**
 * Table helpers. `Table` scrolls horizontally inside its wrapper (and vertically when `maxHeight`
 * is set, keeping the header row sticky); `Th`, `Td` and `Tr` apply the dense 36px row style.
 */
export function Table({ children, minWidth, maxHeight, className = '' }) {
  return (
    <div className={`overflow-auto ${className}`} style={{ maxHeight }}>
      <table className="w-full border-collapse text-[13px]" style={{ minWidth }}>
        {children}
      </table>
    </div>
  )
}

export function Th({ align = 'left', children, className = '', ...props }) {
  return (
    <th
      scope="col"
      className={`sticky top-0 z-10 h-8 border-b border-line-strong bg-subtle px-2 md:px-3 text-[11px] font-semibold tracking-wider whitespace-nowrap text-ink-muted uppercase ${
        align === 'right' ? 'text-right' : 'text-left'
      } ${className}`}
      {...props}
    >
      {children}
    </th>
  )
}

/** `numeric` right-aligns and sets the value in mono; `mono` alone only changes the face. */
export function Td({ numeric = false, mono = false, children, className = '', ...props }) {
  return (
    <td
      className={`h-9 border-b border-line px-2 md:px-3 ${numeric ? 'text-right font-mono' : ''} ${
        mono && !numeric ? 'font-mono' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </td>
  )
}

const ROW_TONES = { selected: 'bg-brand-50', warning: 'bg-risk-review-bg' }

/** Zebra rows; a `tone` ('selected' or 'warning') replaces the zebra with a solid tint. */
export function Tr({ tone, className = '', children, ...props }) {
  return (
    <tr className={`${tone ? ROW_TONES[tone] : 'even:bg-subtle/60'} ${className}`} {...props}>
      {children}
    </tr>
  )
}
