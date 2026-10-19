import { useMemo, useState } from 'react'
import { formatAmount, formatRawProbability } from '../../lib/format'
import { Table, Td, Th, Tr } from '../ui/DataTable'
import EmptyState from '../ui/EmptyState'
import Panel from '../ui/Panel'
import RiskBadge from '../ui/RiskBadge'
import Tabs, { TabPanel } from '../ui/Tabs'

const MAX_VISIBLE_ROWS = 200

function RowsTable({ rows }) {
  return (
    <Table minWidth="56rem" maxHeight="min(32rem, 70vh)">
      <thead>
        <tr>
          <Th>Line</Th>
          <Th>Risk</Th>
          <Th align="right">Probability</Th>
          <Th>Type</Th>
          <Th align="right">Amount</Th>
          <Th align="right">Orig. before</Th>
          <Th align="right">Orig. after</Th>
          <Th align="right">Dest. before</Th>
          <Th align="right">Dest. after</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <Tr key={r.row}>
            <Td mono className="text-ink-muted">
              {r.row}
            </Td>
            <Td>
              <RiskBadge level={r.risk_level} />
            </Td>
            <Td numeric>{formatRawProbability(r.probability)}</Td>
            <Td mono className="text-ink-muted">
              {r.type}
            </Td>
            <Td numeric>{formatAmount(r.amount)}</Td>
            <Td numeric className="text-ink-muted">
              {formatAmount(r.oldbalanceOrg)}
            </Td>
            <Td numeric className="text-ink-muted">
              {formatAmount(r.newbalanceOrig)}
            </Td>
            <Td numeric className="text-ink-muted">
              {formatAmount(r.oldbalanceDest)}
            </Td>
            <Td numeric className="text-ink-muted">
              {formatAmount(r.newbalanceDest)}
            </Td>
          </Tr>
        ))}
      </tbody>
    </Table>
  )
}

/** Scored rows, highest probability first, with All / High / Review / Low filter tabs. */
export default function ScoredRows({ rows, riskCounts }) {
  const [filter, setFilter] = useState('all')

  const sorted = useMemo(() => [...rows].sort((a, b) => b.probability - a.probability), [rows])
  const filtered = filter === 'all' ? sorted : sorted.filter((r) => r.risk_level === filter)
  const visible = filtered.slice(0, MAX_VISIBLE_ROWS)

  const tabs = [
    { id: 'all', label: 'All', count: rows.length },
    { id: 'high', label: 'High', count: riskCounts.high },
    { id: 'review', label: 'Review', count: riskCounts.review },
    { id: 'low', label: 'Low', count: riskCounts.low },
  ]

  return (
    <Panel title="Scored rows" flush>
      <Tabs
        tabs={tabs}
        value={filter}
        onChange={setFilter}
        label="Filter by risk level"
        idPrefix="batch-filter"
        className="bg-surface px-2"
      />
      <TabPanel idPrefix="batch-filter" id={filter} value={filter}>
        {filtered.length ? (
          <RowsTable rows={visible} />
        ) : (
          <EmptyState title="No rows at this risk level" />
        )}
      </TabPanel>
      <p className="rounded-b-[3px] border-t border-line bg-subtle px-3 py-1.5 text-xs text-ink-muted">
        {filtered.length > MAX_VISIBLE_ROWS
          ? `Showing the top ${MAX_VISIBLE_ROWS} of ${filtered.length.toLocaleString('en-US')} rows by probability. Download the results CSV for all of them.`
          : `${filtered.length.toLocaleString('en-US')} ${filtered.length === 1 ? 'row' : 'rows'}, sorted by probability, highest first.`}
      </p>
    </Panel>
  )
}
