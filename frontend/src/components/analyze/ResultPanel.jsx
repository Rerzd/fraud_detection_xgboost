import { RISK, formatProbability, formatRawProbability } from '../../lib/format'
import EmptyState from '../ui/EmptyState'
import Icon from '../ui/Icon'
import RiskBadge from '../ui/RiskBadge'
import ContributionChart from './ContributionChart'
import FeatureTable from './FeatureTable'
import RiskMeter from './RiskMeter'

function Section({ title, aside, children }) {
  return (
    <section className="border-t border-line pt-5">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium text-fg">{title}</h3>
        {aside && <span className="text-[11px] text-subtle">{aside}</span>}
      </div>
      {children}
    </section>
  )
}

function Score({ result, thresholds }) {
  const risk = RISK[result.risk_level]
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs text-muted">Fraud probability</p>
          <p className={`font-mono text-5xl font-medium tracking-tight tabular ${risk.text}`}>
            {formatProbability(result.probability)}
          </p>
          <p className="mt-1 font-mono text-[11px] text-subtle">p = {formatRawProbability(result.probability)}</p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <RiskBadge level={result.risk_level} size="lg" />
          <p className="text-sm text-fg">{risk.decision}</p>
        </div>
      </div>
      <RiskMeter
        probability={result.probability}
        level={result.risk_level}
        reviewThreshold={thresholds.review}
        fraudThreshold={thresholds.fraud}
      />
    </div>
  )
}

export default function ResultPanel({ result, raw, thresholds, error, loading }) {
  if (error) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-risk-high/30 bg-risk-high/5 p-4 text-sm" role="alert">
        <Icon name="alert" className="mt-0.5 size-4 shrink-0 text-risk-high" />
        <div>
          <p className="font-medium text-fg">The transaction could not be scored</p>
          <p className="mt-1 text-muted">{error}</p>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <EmptyState icon="pulse" title="No transaction scored yet">
        Fill in the form or load one of the examples, then run the analysis. You will see the probability, the
        decision, and which features pushed the score.
      </EmptyState>
    )
  }

  return (
    <div className={`space-y-6 transition-opacity ${loading ? 'opacity-50' : ''}`} aria-busy={loading}>
      <Score result={result} thresholds={thresholds} />

      <Section title="Why this score" aside="Top 6 contributions">
        <ContributionChart explanation={result.explanation} />
      </Section>

      <Section title="Engineered features" aside="What the model received">
        <FeatureTable features={result.features} raw={raw} />
      </Section>

      <Section title="Signals" aside="Descriptive, not model reasoning">
        {result.signals.length ? (
          <ul className="space-y-2">
            {result.signals.map((s) => (
              <li key={s} className="flex gap-2.5 text-xs text-muted">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-subtle" aria-hidden="true" />
                {s}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-subtle">No notable patterns in the raw balances.</p>
        )}
        <p className="mt-3 text-[11px] text-subtle">
          Rule-based observations about the input. They are not used by the model and do not explain the score.
        </p>
      </Section>
    </div>
  )
}
