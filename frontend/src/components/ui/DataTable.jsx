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
      className={`sticky top-0 z-10 h-8 border-b border-line-strong bg-subtle px-3 text-[11px] font-semibold tracking-wider whitespace-nowrap text-ink-muted uppercase ${
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
      className={`h-9 border-b border-line px-3 ${numeric ? 'text-right font-mono' : ''} ${
        mono && !numeric ? 'font-mono' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </td>
  )
}

/** Zebra rows; a selected row takes the brand tint instead. */
export function Tr({ selected = false, className = '', children, ...props }) {
  return (
    <tr className={`${selected ? 'bg-brand-50' : 'even:bg-subtle/60'} ${className}`} {...props}>
      {children}
    </tr>
  )
}
