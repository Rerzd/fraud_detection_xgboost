export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

function errorMessage(body, status) {
  const detail = body?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail.map((d) => `${d.loc?.slice(1).join('.') || 'request'}: ${d.msg}`).join('; ')
  }
  return `Request failed (${status})`
}

async function request(path, options = {}) {
  let response
  try {
    response = await fetch(`${API_URL}${path}`, options)
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

export function predictBatch(file) {
  const form = new FormData()
  form.append('file', file)
  return request('/predict/batch', { method: 'POST', body: form })
}

export function getHistory({ limit = 50, riskLevel } = {}) {
  const params = new URLSearchParams({ limit: String(limit) })
  if (riskLevel) params.set('risk_level', riskLevel)
  return request(`/predictions?${params}`)
}

export const getStats = () => request('/predictions/stats')
export const clearHistory = () => request('/predictions', { method: 'DELETE' })
