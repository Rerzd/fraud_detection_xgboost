import { formatAmount, formatSigned } from '../../lib/format'
import { Table, Td, Th, Tr } from '../ui/DataTable'

const TOP_N = 6

function displayValue(feature, value) {
  if (value === null) return 'NaN'
  if (feature === 'type') return value === 0 ? '0 (TRANSFER)' : '1 (CASH_OUT)'
  if (feature === 'step') return String(value)
  return formatAmount(value)
}

const sum = (items) => items.reduce((total, c) => total + c.contribution, 0)

/**
 * Per-feature contributions in log-odds. Bars to the right push toward fraud, bars to the left push
 * away. The rows add up, with the base value, to the model's raw score.
 */
export default function ScoreBreakdown({ explanation }) {
  const { contributions, base_value: base } = explanation
  const top = contributions.slice(0, TOP_N)
  const rest = contributions.slice(TOP_N)
  const scale = Math.max(...top.map((c) => Math.abs(c.contribution)), 1e-9)
  const total = base + sum(contributions)

  return (
    <div>
      <Table minWidth="18rem">
        <thead>
          <tr>
            <Th>Feature</Th>
            <Th align="right" className="hidden md:table-cell">
              Value
            </Th>
            <Th className="w-full min-w-16">
              <span className="hidden justify-between md:flex">
                <span>Away</span>
                <span>Toward fraud</span>
              </span>
              <span className="sr-only md:hidden">Direction</span>
            </Th>
            <Th align="right">Log-odds</Th>
          </tr>
        </thead>
        <tbody>
          {top.map((c) => {
            const positive = c.contribution > 0
            const width = `${(Math.abs(c.contribution) / scale) * 50}%`
            return (
              <Tr key={c.feature}>
                <Td mono>
                  {c.feature}
                  {/* Narrow screens fold the value under the name instead of its own column. */}
                  <span className="block text-xs text-ink-muted md:hidden">{displayValue(c.feature, c.value)}</span>
                </Td>
                <Td numeric className="hidden text-ink-muted md:table-cell">
                  {displayValue(c.feature, c.value)}
                </Td>
                <Td>
                  <div className="relative h-2.5 rounded-sm border border-line bg-surface">
                    <div className="absolute inset-y-0 left-1/2 w-px bg-line-strong" />
                    <div
                      className={`absolute inset-y-0 ${positive ? 'bg-risk-high' : 'bg-contrib-away'}`}
                      style={positive ? { left: '50%', width } : { right: '50%', width }}
                    />
                  </div>
                </Td>
                <Td numeric className={positive ? 'text-risk-high' : 'text-contrib-away'}>
                  {formatSigned(c.contribution)}
                </Td>
              </Tr>
            )
          })}
          {rest.length > 0 && (
            <Tr>
              <Td className="text-ink-muted italic">other {rest.length} features</Td>
              <Td className="hidden md:table-cell" />
              <Td />
              <Td numeric className="text-ink-muted">
                {formatSigned(sum(rest))}
              </Td>
            </Tr>
          )}
          <Tr>
            <Td mono className="text-ink-muted">
              base_value
            </Td>
            <Td numeric className="hidden text-ink-muted md:table-cell">
              model bias
            </Td>
            <Td />
            <Td numeric className="text-ink-muted">
              {formatSigned(base)}
            </Td>
          </Tr>
          <tr className="bg-subtle">
            <Td className="border-t border-line-strong font-semibold">Raw score</Td>
            <Td numeric className="hidden border-t border-line-strong text-ink-muted md:table-cell">
              log-odds
            </Td>
            <Td className="border-t border-line-strong" />
            <Td numeric className="border-t border-line-strong font-semibold">
              {formatSigned(total)}
            </Td>
          </tr>
        </tbody>
      </Table>
      <p className="mt-3 text-xs leading-relaxed text-ink-muted">
        Bars to the right push toward fraud, bars to the left push away. Contributions are in log-odds and add up,
        together with the base value, to the raw score; the sigmoid turns the raw score into the probability. Top {Math.min(TOP_N, contributions.length)} of {contributions.length}{' '}
        features by absolute contribution.
      </p>
    </div>
  )
}
