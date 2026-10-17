import { useEffect, useId, useRef } from 'react'
import Button from './Button'

/** Modal confirmation built on the native <dialog>: focus trap, Escape and backdrop click cancel. */
export default function ConfirmDialog({ open, title, children, confirmLabel, busy, onConfirm, onCancel }) {
  const ref = useRef(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault()
        if (!busy) onCancel()
      }}
      onClick={(e) => {
        if (e.target === ref.current && !busy) onCancel()
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded border border-line-strong bg-surface p-0 text-ink backdrop:bg-ink/50"
    >
      <h2
        id={titleId}
        className="rounded-t-[3px] border-b border-line bg-subtle px-4 py-2 text-xs font-semibold tracking-wider text-ink-muted uppercase"
      >
        {title}
      </h2>
      <div className="px-4 py-3 text-[13px] text-ink-muted">{children}</div>
      <div className="flex justify-end gap-2 border-t border-line px-4 py-3">
        <Button onClick={onCancel} disabled={busy} autoFocus>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={busy}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  )
}
