import { afterEach, describe, expect, it, vi } from 'vitest'
import { API_BASE, API_BASE_PATH, ApiError, request } from './api'

function stubFetch(response) {
  vi.stubGlobal('fetch', vi.fn(response))
}

const jsonResponse = (status, body) =>
  Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) })

afterEach(() => vi.unstubAllGlobals())

describe('request', () => {
  it('sends every call under the /api/v1 base path', async () => {
    stubFetch(() => jsonResponse(200, {}))
    await request('/predict', { method: 'POST' })
    expect(API_BASE_PATH).toBe('/api/v1')
    expect(API_BASE.endsWith('/api/v1')).toBe(true)
    expect(fetch).toHaveBeenCalledWith(`${API_BASE}/predict`, { method: 'POST' })
  })

  it('returns the parsed body of a successful response', async () => {
    stubFetch(() => jsonResponse(200, { status: 'ok' }))
    expect(await request('/health')).toEqual({ status: 'ok' })
  })

  it('throws the message of the error envelope, with the status', async () => {
    stubFetch(() =>
      jsonResponse(422, {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'amount: Input should be greater than 0',
          details: [{ field: 'amount', message: 'Input should be greater than 0' }],
          request_id: 'abc',
        },
      }),
    )
    const error = await request('/predict').catch((e) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error.message).toBe('amount: Input should be greater than 0')
    expect(error.status).toBe(422)
  })

  it('falls back to the status when the error body is not an envelope', async () => {
    stubFetch(() => jsonResponse(502, { detail: 'Bad gateway' }))
    await expect(request('/predict')).rejects.toThrow('Request failed (502)')
  })

  it('falls back to the status when the error body is not JSON', async () => {
    stubFetch(() => Promise.resolve({ ok: false, status: 500, json: () => Promise.reject(new Error('html')) }))
    await expect(request('/predict')).rejects.toThrow('Request failed (500)')
  })

  it('reports an unreachable backend with status 0', async () => {
    stubFetch(() => Promise.reject(new TypeError('Failed to fetch')))
    const error = await request('/health').catch((e) => e)
    expect(error.status).toBe(0)
    expect(error.message).toBe('Cannot reach the backend. Is it running?')
  })
})
