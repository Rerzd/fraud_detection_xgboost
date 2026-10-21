import { formatObservedPrecision } from '../../lib/review'
import SummaryStrip from '../ui/SummaryStrip'

const count = (n) => n.toLocaleString('en-US')

const PRECISION_NOTE =
  'Share of reviewed, model-flagged predictions that an analyst confirmed as fraud. ' +
  'Observed on this demo data; it is not a model metric.'

/** Where the review work stands, from the `review` block of /predictions/stats. */
export default function ReviewSummary({ review }) {
  return (
    <SummaryStrip
      cells={[
        {
          label: 'In the queue',
          value: count(review.pending),
          hint: 'waiting for an analyst',
          tone: review.pending ? 'review' : 'default',
        },
        { label: 'Reviewed', value: count(review.reviewed), hint: 'by an analyst' },
        {
          label: 'Confirmed fraud',
          value: count(review.confirmed_fraud),
          hint: review.missed_by_model ? `${count(review.missed_by_model)} missed by the model` : 'none missed',
          tone: review.confirmed_fraud ? 'high' : 'default',
        },
        { label: 'False positives', value: count(review.false_positive), hint: 'flagged, but legitimate' },
        {
          label: 'Observed precision',
          value: formatObservedPrecision(review.observed_precision),
          hint: 'observed on demo data',
          title: PRECISION_NOTE,
        },
      ]}
    />
  )
}
