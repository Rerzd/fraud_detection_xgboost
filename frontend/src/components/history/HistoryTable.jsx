import { useState } from 'react'
import { formatAmount, formatRawProbability, formatTimestamp, formatUtc } from '../../lib/format'
import { Table, Td, Th, Tr } from '../ui/DataTable'
import Icon from '../ui/Icon'
import RiskBadge from '../ui/RiskBadge'
import Tag from '../ui/Tag'
import RecordDetail from './RecordDetail'

const COLUMNS = 9

/** One record: a summary row and, when open, a detail row. Each record is its own tbody. */
function LogRow({ item, index, open, onToggle }) {
  const detailId = `record-${item.id}`
  return (
    <tbody>
      <Tr
        tone={open ? 'selected' : undefined}
        onClick={onToggle}
        className={`cursor-pointer ${open ? '' : `hover:bg-line/50 ${index % 2 ? 'bg-subtle/60' : ''}`}`}
      >
        <Td className="w-8 pr-0">
          <button
            type="button"
            aria-expanded={open}
            aria-controls={open ? detailId : undefined}
            aria-label={`${open ? 'Hide' : 'Show'} stored payload for record ${item.id}`}
            className="grid size-6 place-items-center rounded-sm text-ink-muted hover:bg-line"
          >
            <Icon name={open ? 'chevron-down' : 'chevron-right'} className="size-4" />
          </button>
        </Td>
        <Td mono className="text-ink-muted">
          {item.id}
        </Td>
        <Td mono className="whitespace-nowrap" title={`${formatUtc(item.created_at)} UTC`}>
          {formatTimestamp(item.created_at)}
        </Td>
        <Td>
          <Tag tone={item.source === 'batch' ? 'brand' : 'neutral'}>{item.source}</Tag>
        </Td>
        <Td mono className="text-ink-muted" title={item.batch_id ?? undefined}>
          {item.batch_id ? item.batch_id.slice(0, 8) : '-'}
        </Td>
        <Td mono className="text-ink-muted">
          {item.type}
        </Td>
        <Td numeric>{formatAmount(item.amount)}</Td>
        <Td numeric>{formatRawProbability(item.probability)}</Td>
        <Td>
          <RiskBadge level={item.risk_level} />
        </Td>
      </Tr>
      {open && (
        <tr id={detailId} className="bg-surface">
          <td colSpan={COLUMNS} className="border-b border-line-strong p-0">
            {/* Sticky and as wide as the visible area, so the detail stays readable when the table scrolls sideways. */}
            <div className="sticky left-0 w-[calc(100vw-2.25rem)] px-3 py-3 md:w-[calc(100vw-220px-3.25rem)] min-[1120px]:w-full">
              <RecordDetail item={item} />
            </div>
          </td>
        </tr>
      )}
    </tbody>
  )
}

/** Audit log table. Click a row (or its chevron) to expand the stored payload inline. */
export default function HistoryTable({ items }) {
  const [open, setOpen] = useState(() => new Set())

  function toggle(id) {
    setOpen((current) => {
      const next = new Set(current)
      if (!next.delete(id)) next.add(id)
      return next
    })
  }

  return (
    <Table minWidth="52rem" maxHeight="min(36rem, 70vh)">
      <thead>
        <tr>
          <Th className="w-8">
            <span className="sr-only">Details</span>
          </Th>
          <Th>ID</Th>
          <Th>Timestamp</Th>
          <Th>Source</Th>
          <Th>Batch ID</Th>
          <Th>Type</Th>
          <Th align="right">Amount</Th>
          <Th align="right">Probability</Th>
          <Th>Decision</Th>
        </tr>
      </thead>
      {items.map((item, index) => (
        <LogRow key={item.id} item={item} index={index} open={open.has(item.id)} onToggle={() => toggle(item.id)} />
      ))}
    </Table>
  )
}
