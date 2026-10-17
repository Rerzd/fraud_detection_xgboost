import { formatAmount, formatDateTime, formatProbability, TYPE_LABELS } from '../../lib/format'
import RiskBadge from '../ui/RiskBadge'

function Source({ item }) {
  if (item.source === 'single') return <span className="text-muted">Single</span>
  return (
    <span className="text-muted">
      Batch <span className="font-mono text-subtle">{item.batch_id?.slice(0, 8)}</span>
    </span>
  )
}

export default function HistoryTable({ items }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[40rem] text-xs">
        <thead>
          <tr className="border-b border-line text-left text-subtle">
            <th scope="col" className="py-2 pr-3 font-normal">Time</th>
            <th scope="col" className="py-2 pr-3 font-normal">Risk</th>
            <th scope="col" className="py-2 pr-3 text-right font-normal">Probability</th>
            <th scope="col" className="py-2 pr-3 font-normal">Type</th>
            <th scope="col" className="py-2 pr-3 text-right font-normal">Amount</th>
            <th scope="col" className="py-2 font-normal">Source</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-line/60">
              <td className="py-1.5 pr-3 whitespace-nowrap text-muted">{formatDateTime(item.created_at)}</td>
              <td className="py-1.5 pr-3">
                <RiskBadge level={item.risk_level} />
              </td>
              <td className="py-1.5 pr-3 text-right font-mono text-fg tabular">{formatProbability(item.probability)}</td>
              <td className="py-1.5 pr-3 text-muted">{TYPE_LABELS[item.type]}</td>
              <td className="py-1.5 pr-3 text-right font-mono text-fg tabular">{formatAmount(item.amount)}</td>
              <td className="py-1.5 whitespace-nowrap">
                <Source item={item} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
