/** Two-column key/value table. Rows: { key, label, value }. */
export default function SpecTable({ rows }) {
  return (
    <div className="overflow-hidden rounded border border-line-strong bg-surface">
      <table className="w-full border-collapse text-[13px]">
        <tbody>
          {rows.map(({ key, label, value }) => (
            <tr key={key} className="border-b border-line last:border-b-0">
              <th
                scope="row"
                className="w-40 bg-subtle px-3 py-2 text-left align-top text-xs font-medium text-ink-muted md:w-52"
              >
                {label}
              </th>
              <td className="px-3 py-2 break-words text-ink">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
