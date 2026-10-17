import { useRef, useState } from 'react'
import { formatBytes } from '../../lib/csv'
import Icon from '../ui/Icon'
import Spinner from '../ui/Spinner'

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
      className={`flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center transition-colors ${
        dragging ? 'border-accent bg-accent-soft' : 'border-line-strong bg-raised/40'
      }`}
    >
      <div className="grid size-10 place-items-center rounded-full border border-line bg-panel text-accent">
        {loading ? <Spinner className="size-5" /> : <Icon name="upload" className="size-5" />}
      </div>
      <div>
        <p className="text-sm text-fg">
          {loading ? 'Scoring file' : 'Drop a CSV here or '}
          {!loading && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="font-medium text-accent hover:text-accent-hover"
            >
              choose a file
            </button>
          )}
        </p>
        {limits && (
          <p className="mt-1 text-xs text-subtle">
            Up to {limits.max_rows.toLocaleString('en-US')} rows and {formatBytes(limits.max_bytes)}. Columns:{' '}
            <span className="font-mono">{limits.required_columns.join(', ')}</span>
          </p>
        )}
      </div>
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
