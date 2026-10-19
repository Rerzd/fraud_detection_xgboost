import { formatPercent, RISK } from '../../lib/format'
import SummaryStrip from '../ui/SummaryStrip'

const count = (n) => n.toLocaleString('en-US')

/** Store-wide totals from /predictions/stats: records, risk split and where they came from. */
export default function HistorySummary({ stats }) {
  const { total, by_risk: risk, by_source: source } = stats
  const share = (n) => (total ? `${formatPercent(n / total)} of records` : 'none yet')
  return (
    <SummaryStrip
      cells={[
        { label: 'Records', value: count(total), hint: 'in the local store' },
        ...['high', 'review', 'low'].map((level) => ({
          label: RISK[level].label,
          value: count(risk[level]),
          hint: share(risk[level]),
          tone: risk[level] ? level : 'default',
        })),
        { label: 'Single / batch', value: `${count(source.single)} / ${count(source.batch)}`, hint: 'by source' },
      ]}
    />
  )
}
