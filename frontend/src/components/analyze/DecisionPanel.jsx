import { RISK, formatClock, formatProbability, formatRawProbability } from '../../lib/format'
import Panel from '../ui/Panel'
import RiskBadge from '../ui/RiskBadge'
import ThresholdMeter from './ThresholdMeter'

/** The verdict: case id and time, the score, the decision, and where the score sits on the thresholds. */
export default function DecisionPanel({ run, thresholds }) {
  const { result } = run
  const risk = RISK[result.risk_level]
  return (
    <Panel
      title="Decision"
      meta={
        <>
          <span className="font-mono text-ink">{run.caseId}</span>
          <span className="font-mono">{formatClock(run.at)}</span>
        </>
      }
    >
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <p className="text-xs font-medium text-ink-muted">Fraud probability</p>
          <p className={`font-mono text-4xl leading-tight font-semibold ${risk.text}`}>
            {formatRawProbability(result.probability)}
          </p>
          <p className="font-mono text-xs text-ink-faint">{formatProbability(result.probability)}</p>
        </div>
        <div className="flex flex-col items-start gap-1.5 sm:items-end">
          <RiskBadge level={result.risk_level} size="md" />
          <p className="text-sm font-semibold text-ink">{risk.decision}</p>
        </div>
      </div>
      <div className="mt-4">
        <ThresholdMeter
          probability={result.probability}
          reviewThreshold={thresholds.review}
          fraudThreshold={thresholds.fraud}
        />
      </div>
    </Panel>
  )
}
