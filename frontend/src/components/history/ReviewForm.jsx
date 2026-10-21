import { useState } from 'react'
import { reviewPrediction } from '../../api'
import { allowedVerdicts, NOTE_MAX_LENGTH, REVIEW_STATUS, reviewProblem } from '../../lib/review'
import Button from '../ui/Button'
import { Select, Textarea } from '../ui/Field'

/**
 * Verdict and note for one stored prediction. The same rules the API enforces are checked first so
 * the message appears at once; whatever the API still rejects is shown as it answers.
 */
export default function ReviewForm({ item, onSaved }) {
  // A low-risk record starts as "legitimate" without anyone having looked: make the analyst choose.
  const [status, setStatus] = useState(item.reviewed_at ? item.review_status : '')
  const [note, setNote] = useState(item.review_note ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)
  const id = `review-${item.id}`
  const noteRequired = item.risk_level === 'low' && status === 'confirmed_fraud'

  function edit(setter) {
    return (event) => {
      setter(event.target.value)
      setSaved(false)
      setError(null)
    }
  }

  async function save(event) {
    event.preventDefault()
    const problem = reviewProblem({ riskLevel: item.risk_level, status, note })
    if (problem) {
      setError(problem)
      return
    }
    setSaving(true)
    setError(null)
    try {
      onSaved(await reviewPrediction(item.id, { status, note }))
      setSaved(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save} noValidate className="grid gap-3 md:grid-cols-[14rem_minmax(0,1fr)]">
      <div>
        <label htmlFor={`${id}-status`} className="mb-1 block text-xs font-medium text-ink-muted">
          Verdict
        </label>
        <Select id={`${id}-status`} value={status} onChange={edit(setStatus)}>
          <option value="">Choose a verdict</option>
          {allowedVerdicts(item.risk_level).map((verdict) => (
            <option key={verdict} value={verdict}>
              {REVIEW_STATUS[verdict].label}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label htmlFor={`${id}-note`} className="mb-1 flex justify-between gap-2 text-xs font-medium text-ink-muted">
          <span>Note {noteRequired ? '(required for a low-risk prediction)' : '(optional)'}</span>
          <span className="font-mono font-normal text-ink-faint">
            {note.length}/{NOTE_MAX_LENGTH}
          </span>
        </label>
        <Textarea
          id={`${id}-note`}
          value={note}
          maxLength={NOTE_MAX_LENGTH}
          onChange={edit(setNote)}
          invalid={Boolean(error) && noteRequired && !note.trim()}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3 md:col-span-2">
        <Button type="submit" variant="primary" loading={saving}>
          Save review
        </Button>
        <p className="min-w-0 text-xs" role={error ? 'alert' : 'status'}>
          {error ? (
            <span className="text-risk-high">{error}</span>
          ) : saved ? (
            <span className="text-ink-muted">Saved.</span>
          ) : null}
        </p>
      </div>
    </form>
  )
}
