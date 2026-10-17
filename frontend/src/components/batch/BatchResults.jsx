import { useMemo, useState } from 'react'
import { formatAmount, formatPercent, formatProbability } from '../../lib/format'
import RiskBadge from '../ui/RiskBadge'
import RiskFilter from '../ui/RiskFilter'
import StatTile from '../ui/StatTile'

const MAX_VISIBLE_ROWS = 200
const MAX_VISIBLE_ERRORS = 50

function Summary({ summary }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatTile label="Scored" value={summary.scored.toLocaleString('en-US')} hint={`of ${summary.total.toLocaleString('en-US')} rows`} />
      <StatTile
        label="Invalid"
        value={summary.invalid.toLocaleString('en-US')}
        hint={summary.invalid ? 'not scored, see below' : 'not scored'}
      />
      <StatTile
        label="Flagged"
        value={summary.risk_counts.high.toLocaleString('en-US')}
        hint={`${summary.risk_counts.review.toLocaleString('en-US')} more for review`}
        accent={summary.risk_counts.high ? 'text-risk-high' : 'text-fg'}
      />
      <StatTile label="Flagged rate" value={formatPercent(summary.flagged_rate)} hint="high risk / scored" />
    </div>
  )
}

function RowsTable({ rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[46rem] text-xs">
        <thead>
          <tr className="border-b border-line text-left text-ink-faint">
            <th scope="col" className="py-2 pr-3 font-normal">Line</th>
            <th scope="col" className="py-2 pr-3 font-normal">Risk</th>
            <th scope="col" className="py-2 pr-3 text-right font-normal">Probability</th>
            <th scope="col" className="py-2 pr-3 font-normal">Type</th>
            <th scope="col" className="py-2 pr-3 text-right font-normal">Amount</th>
            <th scope="col" className="py-2 pr-3 text-right font-normal">Origin before / after</th>
            <th scope="col" className="py-2 text-right font-normal">Dest. before / after</th>
          </tr>
        </thead>
        <tbody className="font-mono tabular">
          {rows.map((r) => (
            <tr key={r.row} className="border-b border-line/60">
              <td className="py-1.5 pr-3 text-ink-faint">{r.row}</td>
              <td className="py-1.5 pr-3 font-sans">
                <RiskBadge level={r.risk_level} />
              </td>
              <td className="py-1.5 pr-3 text-right text-fg">{formatProbability(r.probability)}</td>
              <td className="py-1.5 pr-3 text-muted">{r.type}</td>
              <td className="py-1.5 pr-3 text-right text-fg">{formatAmount(r.amount)}</td>
              <td className="py-1.5 pr-3 text-right text-muted">
                {formatAmount(r.oldbalanceOrg)} / {formatAmount(r.newbalanceOrig)}
              </td>
              <td className="py-1.5 text-right text-muted">
                {formatAmount(r.oldbalanceDest)} / {formatAmount(r.newbalanceDest)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ErrorList({ errors }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-fg">
        Rows not scored <span className="font-mono text-ink-faint">{errors.length}</span>
      </h3>
      <ul className="divide-y divide-line/60 rounded-lg border border-line text-xs">
        {errors.slice(0, MAX_VISIBLE_ERRORS).map((e) => (
          <li key={e.row} className="flex gap-3 px-3 py-2">
            <span className="w-14 shrink-0 font-mono text-ink-faint">line {e.row}</span>
            <span className="min-w-0 break-words text-muted">{e.reason}</span>
          </li>
        ))}
      </ul>
      {errors.length > MAX_VISIBLE_ERRORS && (
        <p className="mt-2 text-[11px] text-ink-faint">
          Showing the first {MAX_VISIBLE_ERRORS} of {errors.length} errors.
        </p>
      )}
    </div>
  )
}

export default function BatchResults({ result }) {
  const [filter, setFilter] = useState('')

  const sorted = useMemo(() => [...result.rows].sort((a, b) => b.probability - a.probability), [result.rows])
  const filtered = filter ? sorted.filter((r) => r.risk_level === filter) : sorted
  const counts = { all: result.rows.length, ...result.summary.risk_counts }

  return (
    <div className="space-y-6">
      <Summary summary={result.summary} />

      {result.rows.length > 0 && (
        <div className="space-y-3">
          <RiskFilter value={filter} onChange={setFilter} counts={counts} />
          {filtered.length ? (
            <RowsTable rows={filtered.slice(0, MAX_VISIBLE_ROWS)} />
          ) : (
            <p className="py-6 text-center text-sm text-muted">No rows at this risk level.</p>
          )}
          {filtered.length > MAX_VISIBLE_ROWS && (
            <p className="text-[11px] text-ink-faint">
              Showing the top {MAX_VISIBLE_ROWS} of {filtered.length.toLocaleString('en-US')} rows by probability.
              Download the results CSV for all of them.
            </p>
          )}
        </div>
      )}

      {result.errors.length > 0 && <ErrorList errors={result.errors} />}
    </div>
  )
}
