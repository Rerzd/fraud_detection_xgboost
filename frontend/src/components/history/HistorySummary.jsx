import { formatPercent, RISK } from '../../lib/format'
import { formatObservedPrecision } from '../../lib/review'
import SummaryStrip from '../ui/SummaryStrip'

const count = (n) => n.toLocaleString('en-US')

const PRECISION_NOTE =
  'Share of reviewed, model-flagged predictions that an analyst confirmed as fraud. ' +
  'Observed on this demo data; it is not a model metric.'

/** Store-wide totals from /predictions/stats: records, risk split, source and review progress. */
export default function HistorySummary({ stats }) {
  const { total, by_risk: risk, by_source: source, review } = stats
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
        {
          label: 'Review queue',
          value: count(review.pending),
          hint: 'to be reviewed',
          tone: review.pending ? 'review' : 'default',
        },
        {
          label: 'Precision',
          value: formatObservedPrecision(review.observed_precision),
          hint: 'observed on demo data', // the label this number must always carry
          wrapHint: true,
          title: PRECISION_NOTE,
        },
      ]}
    />
  )
}
