import { useRef, useState } from 'react'
import { formatBytes } from '../../lib/csv'
import Button from '../ui/Button'
import Icon from '../ui/Icon'
import Tag from '../ui/Tag'

/** Dashed drop target with the backend limits and required columns spelled out. */
export default function Dropzone({ onFile, limits, loading }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  function pick(files) {
    if (files?.length) onFile(files[0])
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        if (!loading) pick(e.dataTransfer.files)
      }}
      className={`flex flex-col gap-3 rounded border border-dashed px-4 py-4 transition-colors sm:flex-row sm:items-center ${
        dragging ? 'border-brand-700 bg-brand-50' : 'border-line-input bg-subtle/60'
      }`}
    >
      <span className="hidden size-9 shrink-0 place-items-center rounded-sm border border-line-strong bg-surface text-ink-muted sm:grid">
        <Icon name="upload" className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-ink">{loading ? 'Scoring file' : 'Drop a CSV file here'}</p>
        {limits ? (
          <>
            <p className="mt-0.5 text-xs text-ink-muted">
              Up to {limits.max_rows.toLocaleString('en-US')} rows and {formatBytes(limits.max_bytes)}. Required
              columns:
            </p>
            <ul className="mt-1.5 flex flex-wrap gap-1">
              {limits.required_columns.map((column) => (
                <li key={column}>
                  <Tag>{column}</Tag>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-0.5 text-xs text-ink-muted">Only .csv files are accepted.</p>
        )}
      </div>
      <Button onClick={() => inputRef.current?.click()} loading={loading} className="self-start sm:self-center">
        {loading ? 'Scoring' : 'Choose file'}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          pick(e.target.files)
          e.target.value = ''
        }}
      />
    </div>
  )
}
