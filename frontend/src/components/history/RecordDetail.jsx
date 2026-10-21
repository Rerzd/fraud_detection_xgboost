import { formatUtc, RISK } from '../../lib/format'
import CodeBlock from '../ui/CodeBlock'
import ReviewBadge from './ReviewBadge'
import ReviewForm from './ReviewForm'

function Fact({ label, children }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold tracking-wider text-ink-muted uppercase">{label}</dt>
      <dd className="font-mono text-xs break-all text-ink">{children}</dd>
    </div>
  )
}

/**
 * What the log holds for one record: identifiers, the model that scored it, the stored request
 * payload and the analyst review, which can be edited here.
 */
export default function RecordDetail({ item, onUpdate }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <dl className="space-y-2">
          <Fact label="Created (UTC)">{formatUtc(item.created_at)}</Fact>
          <Fact label="Batch ID">{item.batch_id ?? 'none (single prediction)'}</Fact>
          <Fact label="Probability">{item.probability}</Fact>
          <Fact label="Decision">{RISK[item.risk_level].decision}</Fact>
          <Fact label="Model">
            {item.model_version} · {item.model_hash}
          </Fact>
          <Fact label="Request ID">{item.request_id ?? 'none'}</Fact>
        </dl>
        <CodeBlock label="Stored payload" code={JSON.stringify(item.payload, null, 2)} />
      </div>

      <section aria-label="Analyst review" className="border-t border-line pt-3">
        <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <h3 className="text-[11px] font-semibold tracking-wider text-ink-muted uppercase">Analyst review</h3>
          <ReviewBadge status={item.review_status} />
          <p className="font-mono text-xs text-ink-faint">
            {item.reviewed_at ? `reviewed ${formatUtc(item.reviewed_at)} UTC` : 'not reviewed by an analyst'}
          </p>
        </div>
        <ReviewForm key={item.id} item={item} onSaved={onUpdate} />
      </section>
    </div>
  )
}
