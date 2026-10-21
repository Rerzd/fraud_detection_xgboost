import { useState } from 'react'
import { getBatches } from '../../api'
import usePage from '../../hooks/usePage'
import { formatTimestamp, formatUtc } from '../../lib/format'
import Button from '../ui/Button'
import Callout from '../ui/Callout'
import { Table, Td, Th, Tr } from '../ui/DataTable'
import EmptyState from '../ui/EmptyState'
import Pager from '../ui/Pager'
import Panel from '../ui/Panel'
import Spinner from '../ui/Spinner'

const PAGE_SIZE = 10
const count = (n) => n.toLocaleString('en-US')

/** Earlier uploads, newest first, from /batches. "View rows" opens the rows that run stored. */
export default function PreviousRuns({ online, reloadKey, selectedId, onSelect }) {
  const [offset, setOffset] = useState(0)
  const { page, error, loading } = usePage({
    enabled: online,
    key: `${offset}:${reloadKey}`,
    load: () => getBatches({ limit: PAGE_SIZE, offset }),
  })

  return (
    <Panel title="Previous runs" meta={page && `${count(page.total)} stored`} flush>
      {error && (
        <Callout tone="danger" className="m-3">
          {error}
        </Callout>
      )}
      {!page ? (
        !error && (
          <div className="flex justify-center py-8 text-ink-muted">
            <Spinner className="size-5" />
          </div>
        )
      ) : page.total === 0 ? (
        <EmptyState title="No previous runs">Every file you score is listed here, with its stored rows.</EmptyState>
      ) : (
        <>
          <div className={`transition-opacity ${loading ? 'opacity-50' : ''}`} aria-busy={loading}>
            <Table minWidth="46rem">
              <thead>
                <tr>
                  <Th>Run ID</Th>
                  <Th>File</Th>
                  <Th>Run at</Th>
                  <Th align="right">Rows</Th>
                  <Th align="right">Scored</Th>
                  <Th align="right">Invalid</Th>
                  <Th align="right">Flagged</Th>
                  <Th>Model</Th>
                  <Th>
                    <span className="sr-only">Actions</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {page.items.map((batch) => {
                  const selected = batch.id === selectedId
                  return (
                    <Tr key={batch.id} tone={selected ? 'selected' : undefined}>
                      <Td mono title={batch.id}>
                        {batch.id.slice(0, 8)}
                      </Td>
                      <Td className="max-w-56 truncate" title={batch.filename ?? undefined}>
                        {batch.filename ?? <span className="text-ink-faint">unnamed</span>}
                      </Td>
                      <Td mono className="whitespace-nowrap" title={`${formatUtc(batch.created_at)} UTC`}>
                        {formatTimestamp(batch.created_at)}
                      </Td>
                      <Td numeric>{count(batch.total_rows)}</Td>
                      <Td numeric>{count(batch.scored)}</Td>
                      <Td numeric>{count(batch.invalid)}</Td>
                      <Td numeric className={batch.flagged ? 'text-risk-high' : ''}>
                        {count(batch.flagged)}
                      </Td>
                      <Td mono className="text-ink-muted" title={`${batch.model_version} · ${batch.model_hash}`}>
                        {batch.model_hash}
                      </Td>
                      <Td className="text-right">
                        <Button
                          size="sm"
                          aria-pressed={selected}
                          aria-label={`View rows of run ${batch.id.slice(0, 8)}`}
                          onClick={() => onSelect(batch)}
                          disabled={selected}
                        >
                          {selected ? 'Viewing' : 'View rows'}
                        </Button>
                      </Td>
                    </Tr>
                  )
                })}
              </tbody>
            </Table>
          </div>
          <div className="flex items-center rounded-b-[3px] border-t border-line bg-subtle px-3 py-1.5">
            <Pager
              offset={page.offset}
              count={page.items.length}
              total={page.total}
              limit={PAGE_SIZE}
              busy={loading}
              onChange={setOffset}
              label="Previous runs pages"
            />
          </div>
        </>
      )}
    </Panel>
  )
}
