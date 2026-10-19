import Icon from '../ui/Icon'

/** Rule-based observations about the raw input. Not used by the model. */
export default function SignalsList({ signals }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold tracking-wider text-ink-muted uppercase">
        Descriptive checks, not model reasoning
      </p>
      {signals.length ? (
        <ul className="divide-y divide-line rounded border border-line-strong">
          {signals.map((signal) => (
            <li key={signal} className="flex items-start gap-2.5 px-3 py-2 text-[13px] text-ink">
              <Icon name="info" className="mt-0.5 size-4 shrink-0 text-ink-faint" />
              {signal}
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded border border-line-strong px-3 py-2 text-[13px] text-ink-muted">
          No notable patterns in the raw balances.
        </p>
      )}
      <p className="mt-3 text-xs leading-relaxed text-ink-muted">
        These are fixed rules applied to the input. The model does not use them and they do not explain the score.
      </p>
    </div>
  )
}
