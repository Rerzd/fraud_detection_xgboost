import BatchSummary from './BatchSummary'
import RejectedRows from './RejectedRows'
import ScoredRows from './ScoredRows'

/** Everything a batch run produces: summary strip, scored rows and the rejected rows, if any. */
export default function BatchResults({ result, fileName, loading }) {
  return (
    <div className={`space-y-4 transition-opacity ${loading ? 'opacity-50' : ''}`} aria-busy={loading}>
      <BatchSummary batchId={result.batch_id} fileName={fileName} summary={result.summary} />
      {result.rows.length > 0 && (
        <ScoredRows key={result.batch_id} rows={result.rows} riskCounts={result.summary.risk_counts} />
      )}
      {result.errors.length > 0 && <RejectedRows errors={result.errors} />}
    </div>
  )
}
