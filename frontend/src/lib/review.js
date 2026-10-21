// The analyst review workflow, mirrored from the API so the form can explain a problem before
// sending. The API stays the authority: it checks the same rules and answers with an error envelope.

import { formatPercent } from './format'

export const NOTE_MAX_LENGTH = 500

/** What an analyst can decide. `pending` is only ever the starting state. */
export const VERDICTS = ['confirmed_fraud', 'false_positive', 'legitimate']

export const REVIEW_STATUS = {
  pending: { label: 'Pending', tone: 'review' },
  confirmed_fraud: { label: 'Confirmed fraud', tone: 'high' },
  false_positive: { label: 'False positive', tone: 'neutral' },
  legitimate: { label: 'Legitimate', tone: 'low' },
}

export const REVIEW_STATUSES = Object.keys(REVIEW_STATUS)

/** Verdicts allowed for a prediction at this risk level: a low-risk one was never flagged. */
export const allowedVerdicts = (riskLevel) =>
  riskLevel === 'low' ? VERDICTS.filter((verdict) => verdict !== 'false_positive') : VERDICTS

/** Why a draft review cannot be sent, in the API's words, or null when it can. */
export function reviewProblem({ riskLevel, status, note = '' }) {
  if (!status) return 'Choose a verdict.'
  if (!allowedVerdicts(riskLevel).includes(status)) {
    return 'A low-risk prediction was not flagged, so it cannot be a false positive.'
  }
  if (note.length > NOTE_MAX_LENGTH) return `The note is limited to ${NOTE_MAX_LENGTH} characters.`
  if (riskLevel === 'low' && status === 'confirmed_fraud' && !note.trim()) {
    return 'A note is required to confirm fraud on a low-risk prediction.'
  }
  return null
}

/** Precision observed on analyst verdicts; null until at least one flagged prediction was judged. */
export const formatObservedPrecision = (precision) =>
  precision === null || precision === undefined ? 'n/a' : formatPercent(precision)
