import { Table, Td, Th, Tr } from '../ui/DataTable'
import Panel from '../ui/Panel'

const MAX_VISIBLE_ERRORS = 200

/** Rows the backend refused, with the reason for each. They are not scored or stored. */
export default function RejectedRows({ errors }) {
  const visible = errors.slice(0, MAX_VISIBLE_ERRORS)
  return (
    <Panel
      title="Rejected rows"
      tone="danger"
      meta={<span className="font-mono">{errors.length.toLocaleString('en-US')}</span>}
      flush
    >
      <Table minWidth="20rem" maxHeight="min(20rem, 50vh)">
        <thead>
          <tr>
            <Th className="w-20">Line</Th>
            <Th>Reason</Th>
          </tr>
        </thead>
        <tbody>
          {visible.map((e) => (
            <Tr key={e.row}>
              <Td mono className="text-ink-muted">
                {e.row}
              </Td>
              <Td className="break-words">{e.reason}</Td>
            </Tr>
          ))}
        </tbody>
      </Table>
      {errors.length > MAX_VISIBLE_ERRORS && (
        <p className="rounded-b-[3px] border-t border-line bg-subtle px-3 py-1.5 text-xs text-ink-muted">
          Showing the first {MAX_VISIBLE_ERRORS} of {errors.length.toLocaleString('en-US')} errors.
        </p>
      )}
    </Panel>
  )
}
