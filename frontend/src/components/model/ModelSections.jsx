import { formatPercent, RISK_LEVELS } from '../../lib/format'
import { Table, Td, Th, Tr } from '../ui/DataTable'
import ThresholdMeter from '../analyze/ThresholdMeter'
import Icon from '../ui/Icon'
import RiskBadge from '../ui/RiskBadge'
import SummaryStrip from '../ui/SummaryStrip'
import Tag from '../ui/Tag'
import RichText from './RichText'
import SpecTable from './SpecTable'

const mono = (text) => <span className="font-mono">{text}</span>
const count = (n) => n.toLocaleString('en-US')

export function Overview({ info }) {
  const { name, version, algorithm, training_data: data } = info
  return (
    <div className="space-y-2 text-[13px] text-ink-muted">
      <p className="flex flex-wrap items-center gap-2">
        <span className="text-base font-semibold text-ink">{name}</span>
        <Tag>{version}</Tag>
      </p>
      <p>
        {mono(algorithm.estimator)} with the {mono(algorithm.objective)} objective, trained on {data.dataset}.
      </p>
      <p>Scope: {data.filter}.</p>
      {info.sha256 && (
        <p>
          Artifact sha256: <span className="font-mono break-all text-ink">{info.sha256}</span>
        </p>
      )}
    </div>
  )
}

/** The metrics were computed at a fixed cut-off, named in the key (fraud_class_at_0_5 means 0.5). */
function cutoffOf(metrics) {
  const key = Object.keys(metrics).find((k) => /^fraud_class_at_\d+_\d+$/.test(k))
  return { key, cutoff: key?.replace('fraud_class_at_', '').replace('_', '.') }
}

export function Metrics({ metrics }) {
  const { key, cutoff } = cutoffOf(metrics)
  const fraud = metrics[key]
  const hint = `fraud class at ${cutoff}`
  const cells = [
    { label: 'AUPRC', value: metrics.auprc.toFixed(4), hint: 'area under precision-recall' },
    ...(fraud
      ? [
          { label: 'Precision', value: fraud.precision.toFixed(2), hint },
          { label: 'Recall', value: fraud.recall.toFixed(2), hint },
          { label: 'F1', value: fraud.f1.toFixed(2), hint },
        ]
      : []),
  ]
  return (
    <div className="space-y-2">
      <SummaryStrip wide cells={cells} />
      <p className="text-xs leading-relaxed text-ink-muted">
        Held-out test set: {count(metrics.test_rows)} transactions, {count(metrics.test_frauds)} of them fraud (
        {formatPercent(metrics.test_frauds / metrics.test_rows, 2)}). Values as reported by the training notebook.
      </p>
    </div>
  )
}

export function TrainingSetup({ algorithm, data }) {
  const rows = [
    { key: 'estimator', label: 'Estimator', value: mono(algorithm.estimator) },
    { key: 'objective', label: 'Objective', value: mono(algorithm.objective) },
    ...Object.entries(algorithm.hyperparameters).map(([name, value]) => ({
      key: name,
      label: mono(name),
      value: mono(String(value)),
    })),
    { key: 'dataset', label: 'Dataset', value: data.dataset },
    { key: 'total', label: 'Rows in the dataset', value: mono(count(data.total_rows)) },
    { key: 'filter', label: 'Filter', value: data.filter },
    ...Object.entries(data.rows_after_filter).map(([type, rows]) => ({
      key: type,
      label: mono(type),
      value: <>{mono(count(rows))} rows</>,
    })),
    { key: 'split', label: 'Split', value: data.split },
    { key: 'weighting', label: 'Class weighting', value: <RichText text={data.class_weighting} /> },
  ]
  return <SpecTable rows={rows} />
}

const upperFirst = (text) => text.charAt(0).toUpperCase() + text.slice(1)

export function Thresholds({ thresholds }) {
  const levels = [...RISK_LEVELS].reverse().filter((level) => thresholds.levels[level])
  return (
    <div className="space-y-3">
      <div className="rounded border border-line-strong bg-surface px-4 py-3">
        <ThresholdMeter reviewThreshold={thresholds.review} fraudThreshold={thresholds.fraud} />
      </div>
      <div className="overflow-hidden rounded border border-line-strong bg-surface">
        <Table>
          <thead>
            <tr>
              <Th>Band</Th>
              <Th>Range</Th>
              <Th className="hidden md:table-cell">Decision</Th>
            </tr>
          </thead>
          <tbody>
            {levels.map((level) => {
              const text = thresholds.levels[level]
              const split = text.indexOf(': ')
              const range = split > 0 ? text.slice(0, split) : text
              const decision = split > 0 ? upperFirst(text.slice(split + 2)) : ''
              return (
                <Tr key={level}>
                  <Td className="py-1.5 align-top">
                    <RiskBadge level={level} />
                  </Td>
                  <Td mono className="py-1.5 align-top">
                    {range}
                    {/* Narrow screens fold the decision under the range instead of its own column. */}
                    {decision && <span className="mt-0.5 block font-sans text-xs text-ink-muted md:hidden">{decision}</span>}
                  </Td>
                  <Td className="hidden py-1.5 align-top text-ink-muted md:table-cell">{decision}</Td>
                </Tr>
              )
            })}
          </tbody>
        </Table>
      </div>
      <p className="text-xs leading-relaxed text-ink-muted">
        Thresholds are read from the API configuration, so the whole interface uses the same cut-offs.
      </p>
    </div>
  )
}

export function Features({ features }) {
  return (
    <div className="overflow-hidden rounded border border-line-strong bg-surface">
      <Table>
        <thead>
          <tr>
            <Th className="w-10">#</Th>
            <Th>Feature</Th>
            <Th className="hidden md:table-cell">Description</Th>
          </tr>
        </thead>
        <tbody>
          {features.map((f, i) => (
            <Tr key={f.name}>
              <Td mono className="py-1.5 align-top text-ink-muted">
                {i + 1}
              </Td>
              <Td mono className="py-1.5 align-top">
                <span className="whitespace-nowrap">{f.name}</span>
                {/* Narrow screens fold the description under the name instead of its own column. */}
                <span className="mt-0.5 block font-sans text-xs text-ink-muted md:hidden">
                  <RichText text={f.description} />
                </span>
              </Td>
              <Td className="hidden py-1.5 align-top text-ink-muted md:table-cell">
                <RichText text={f.description} />
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </div>
  )
}

export function Limitations({ items }) {
  return (
    <ul className="divide-y divide-line overflow-hidden rounded border border-line-strong bg-surface">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5 px-3 py-2 text-[13px] text-ink-muted">
          <Icon name="alert" className="mt-0.5 size-4 shrink-0 text-ink-faint" />
          <span>
            <RichText text={item} />
          </span>
        </li>
      ))}
    </ul>
  )
}
