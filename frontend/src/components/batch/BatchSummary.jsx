import { formatPercent } from '../../lib/format'
import SummaryStrip from '../ui/SummaryStrip'

const count = (n) => n.toLocaleString('en-US')

/** Run totals as one bordered strip: what went in, what was scored, what was rejected or flagged. */
export default function BatchSummary({ batchId, fileName, summary }) {
  const { total, scored, invalid, risk_counts: counts, flagged_rate: rate } = summary
  return (
    <SummaryStrip
      cells={[
        { label: 'Run ID', value: batchId.slice(0, 8), hint: fileName, title: batchId },
        { label: 'Rows', value: count(total), hint: 'in the file' },
        { label: 'Scored', value: count(scored), hint: 'valid rows' },
        {
          label: 'Invalid',
          value: count(invalid),
          hint: invalid ? 'not scored, listed below' : 'none rejected',
          tone: invalid ? 'high' : 'default',
        },
        {
          label: 'Flagged',
          value: count(counts.high),
          hint: `${count(counts.review)} more for review`,
          tone: counts.high ? 'high' : 'default',
        },
        { label: 'Flagged rate', value: formatPercent(rate), hint: 'high risk / scored' },
      ]}
    />
  )
}
