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
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-line-strong bg-panel text-fg shadow-2xl backdrop:bg-ink/75"
    >
      <div className="p-5">
        <h2 id={titleId} className="text-sm font-medium text-fg">
          {title}
        </h2>
        <div className="mt-2 text-sm text-muted">{children}</div>
        <div className="mt-5 flex justify-end gap-2">
          <Button onClick={onCancel} disabled={busy} autoFocus>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={busy}>
            {busy ? 'Working' : confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  )
}
