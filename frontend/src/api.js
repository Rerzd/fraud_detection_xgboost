export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')

// Every endpoint lives under this path; VITE_API_URL is only the origin.
export const API_BASE_PATH = '/api/v1'
export const API_BASE = `${API_URL}${API_BASE_PATH}`

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

// Every API error has the same body: {"error": {"code", "message", "details", "request_id"}}.
function errorMessage(body, status) {
  return body?.error?.message || `Request failed (${status})`
}

export async function request(path, options = {}) {
  let response
  try {
    response = await fetch(`${API_BASE}${path}`, options)
  } catch {
    throw new ApiError('Cannot reach the backend. Is it running?', 0)
  }
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new ApiError(errorMessage(body, response.status), response.status)
  return body
}

const json = (method, data) => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
})

export const getHealth = () => request('/health')
export const getModelInfo = () => request('/model/info')
export const getExamples = () => request('/examples')
export const predict = (transaction) => request('/predict', json('POST', transaction))

export const getBatchLimits = () => request('/predict/batch/limits')

export function predictBatch(file) {
  const form = new FormData()
  form.append('file', file)
  return request('/predict/batch', { method: 'POST', body: form })
}

/**
 * One page of the audit log: `{ items, total, limit, offset }`. `filters` uses the API's own query
 * names (risk_level, source, batch_id, review_status, created_from, created_to, sort); empty values
 * are left out.
 */
export function getHistory({ limit = 50, offset = 0, filters = {} } = {}) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
  for (const [name, value] of Object.entries(filters)) if (value) params.set(name, value)
  return request(`/predictions?${params}`)
}

export const getPrediction = (id) => request(`/predictions/${id}`)

/** Record an analyst's verdict. A blank note is sent as null; the API trims and validates it. */
export const reviewPrediction = (id, { status, note }) =>
  request(`/predictions/${id}/review`, json('PATCH', { status, note: note?.trim() ? note : null }))

/** One page of previous batch runs, newest first: `{ items, total, limit, offset }`. */
export function getBatches({ limit = 10, offset = 0 } = {}) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
  return request(`/batches?${params}`)
}

export const getBatch = (id) => request(`/batches/${id}`)

export const getStats = () => request('/predictions/stats')
export const clearHistory = () => request('/predictions', { method: 'DELETE' })
