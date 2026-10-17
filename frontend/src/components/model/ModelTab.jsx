import { formatPercent, RISK_LEVELS } from '../../lib/format'
import EmptyState from '../ui/EmptyState'
import Icon from '../ui/Icon'
import { Page } from '../shell/PageHeader'
import Panel from '../ui/Panel'
import RiskBadge from '../ui/RiskBadge'
import Spinner from '../ui/Spinner'
import StatTile from '../ui/StatTile'
import ThresholdScale from './ThresholdScale'

const LEVEL_ORDER = [...RISK_LEVELS].reverse()

/** Renders `code` spans written with backticks in backend text. */
function RichText({ text }) {
  return text.split(/`([^`]+)`/).map((part, i) =>
    i % 2 ? (
      <code key={i} className="rounded bg-raised px-1 py-0.5 font-mono text-[0.9em] text-fg">
        {part}
      </code>
    ) : (
      part
    ),
  )
}

function Field({ label, children }) {
  return (
    <div className="grid grid-cols-[minmax(7rem,10rem)_1fr] gap-3 border-b border-line/60 py-2 text-xs last:border-b-0">
      <dt className="text-ink-faint">{label}</dt>
      <dd className="min-w-0 break-words text-fg">{children}</dd>
    </div>
  )
}

function Metrics({ metrics }) {
  const fraud = metrics.fraud_class_at_0_5
  const prevalence = metrics.test_frauds / metrics.test_rows
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="AUPRC" value={metrics.auprc.toFixed(4)} hint="area under precision-recall" />
        <StatTile label="Precision" value={fraud.precision.toFixed(2)} hint="fraud class at 0.5" />
        <StatTile label="Recall" value={fraud.recall.toFixed(2)} hint="fraud class at 0.5" />
        <StatTile label="F1" value={fraud.f1.toFixed(2)} hint="fraud class at 0.5" />
      </div>
      <p className="text-[11px] leading-relaxed text-ink-faint">
        Held-out test set: {metrics.test_rows.toLocaleString('en-US')} transactions,{' '}
        {metrics.test_frauds.toLocaleString('en-US')} of them fraud ({formatPercent(prevalence, 2)}). Values as reported
        by the training notebook.
      </p>
    </div>
  )
}

function TrainingSetup({ algorithm, data }) {
  return (
    <Panel title="Training setup" description={data.dataset}>
      <dl>
        <Field label="Estimator">
          <span className="font-mono">{algorithm.estimator}</span>
        </Field>
        <Field label="Objective">
          <span className="font-mono">{algorithm.objective}</span>
        </Field>
        {Object.entries(algorithm.hyperparameters).map(([name, value]) => (
          <Field key={name} label={<span className="font-mono">{name}</span>}>
            <span className="font-mono tabular">{String(value)}</span>
          </Field>
        ))}
        <Field label="Full dataset">
          <span className="font-mono tabular">{data.total_rows.toLocaleString('en-US')}</span> rows
        </Field>
        <Field label="Filter">{data.filter}</Field>
        {Object.entries(data.rows_after_filter).map(([type, rows]) => (
          <Field key={type} label={<span className="font-mono">{type}</span>}>
            <span className="font-mono tabular">{rows.toLocaleString('en-US')}</span> rows
          </Field>
        ))}
        <Field label="Split">{data.split}</Field>
        <Field label="Class weighting">
          <RichText text={data.class_weighting} />
        </Field>
      </dl>
    </Panel>
  )
}

function Thresholds({ thresholds }) {
  return (
    <Panel title="Decision thresholds" description="How a probability becomes a risk level and a suggested action.">
      <ThresholdScale review={thresholds.review} fraud={thresholds.fraud} />
      <ul className="mt-5 space-y-3">
        {LEVEL_ORDER.filter((level) => thresholds.levels[level]).map((level) => {
          const text = thresholds.levels[level]
          const split = text.indexOf(': ')
          const rule = split > 0 ? text.slice(0, split) : text
          const action = split > 0 ? text.slice(split + 2) : null
          return (
            <li key={level} className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-3">
              <div className="w-28 shrink-0">
                <RiskBadge level={level} />
              </div>
              <div className="min-w-0 text-xs">
                <p className="font-mono text-fg">{rule}</p>
                {action && <p className="mt-0.5 text-muted">{action}</p>}
              </div>
            </li>
          )
        })}
      </ul>
      <p className="mt-5 text-[11px] leading-relaxed text-ink-faint">
        Thresholds are read from the API configuration, so the whole interface uses the same cut-offs.
      </p>
    </Panel>
  )
}

function Features({ features }) {
  return (
    <Panel title="Features" description="The model inputs, in the order the model receives them.">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-line text-left text-ink-faint">
              <th scope="col" className="w-8 py-2 pr-3 font-normal">#</th>
              <th scope="col" className="py-2 pr-3 font-normal">Feature</th>
              <th scope="col" className="py-2 font-normal">Description</th>
            </tr>
          </thead>
          <tbody>
            {features.map((f, i) => (
              <tr key={f.name} className="border-b border-line/60 align-top">
                <td className="py-2 pr-3 font-mono text-ink-faint tabular">{i + 1}</td>
                <td className="py-2 pr-3 font-mono whitespace-nowrap text-fg">{f.name}</td>
                <td className="py-2 text-muted">
                  <RichText text={f.description} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

function Limitations({ items }) {
  return (
    <Panel title="Limitations" description="Read these before trusting a score.">
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5 text-sm text-muted">
            <Icon name="alert" className="mt-0.5 size-4 shrink-0 text-ink-faint" />
            <span>
              <RichText text={item} />
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

export default function ModelTab({ info, error, online }) {
  if (!online || error) {
    return (
      <Page id="model">
        <Panel title="Model">
          <EmptyState icon="cpu" title={online ? 'Could not load the model card' : 'Backend offline'}>
            {error || 'The model card is served by the API. Start the backend to see it.'}
          </EmptyState>
        </Panel>
      </Page>
    )
  }
  if (!info) {
    return (
      <Page id="model">
        <Panel title="Model">
          <div className="flex justify-center py-14 text-muted">
            <Spinner className="size-5" />
          </div>
        </Panel>
      </Page>
    )
  }

  return (
    <Page id="model">
      <Panel
        title={info.name}
        description={
          <>
            <span className="font-mono">{info.version}</span> · {info.algorithm.estimator}
          </>
        }
      >
        <Metrics metrics={info.metrics} />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <TrainingSetup algorithm={info.algorithm} data={info.training_data} />
        <Thresholds thresholds={info.thresholds} />
      </div>

      <Features features={info.features} />
      <Limitations items={info.limitations} />
    </Page>
  )
}
