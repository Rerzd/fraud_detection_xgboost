import { formatUtc, RISK } from '../../lib/format'
import CodeBlock from '../ui/CodeBlock'

function Fact({ label, children }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold tracking-wider text-ink-muted uppercase">{label}</dt>
      <dd className="font-mono text-xs break-all text-ink">{children}</dd>
    </div>
  )
}

/** What the log holds for one record: identifiers, exact values and the stored request payload. */
export default function RecordDetail({ item }) {
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <dl className="space-y-2">
        <Fact label="Created (UTC)">{formatUtc(item.created_at)}</Fact>
        <Fact label="Batch ID">{item.batch_id ?? 'none (single prediction)'}</Fact>
        <Fact label="Probability">{item.probability}</Fact>
        <Fact label="Decision">{RISK[item.risk_level].decision}</Fact>
      </dl>
      <CodeBlock label="Stored payload" code={JSON.stringify(item.payload, null, 2)} />
    </div>
  )
}
