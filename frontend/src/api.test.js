import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  API_BASE,
  API_BASE_PATH,
  ApiError,
  getBatch,
  getBatches,
  getHistory,
  getPrediction,
  request,
  reviewPrediction,
} from './api'

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

describe('getHistory', () => {
  const requestedUrl = () => new URL(fetch.mock.calls[0][0])

  it('asks for the first page of 50 by default', async () => {
    stubFetch(() => jsonResponse(200, { items: [], total: 0, limit: 50, offset: 0 }))
    const page = await getHistory()
    expect(page).toEqual({ items: [], total: 0, limit: 50, offset: 0 })
    expect(requestedUrl().pathname).toBe('/api/v1/predictions')
    expect(Object.fromEntries(requestedUrl().searchParams)).toEqual({ limit: '50', offset: '0' })
  })

  it('sends the page and only the filters that have a value', async () => {
    stubFetch(() => jsonResponse(200, { items: [], total: 0, limit: 25, offset: 50 }))
    await getHistory({ limit: 25, offset: 50, filters: { risk_level: 'high', source: '', batch_id: undefined } })
    expect(Object.fromEntries(requestedUrl().searchParams)).toEqual({
      limit: '25',
      offset: '50',
      risk_level: 'high',
    })
  })
})

describe('review and batch calls', () => {
  const lastCall = () => {
    const [url, options] = fetch.mock.calls.at(-1)
    return { url: new URL(url), options }
  }

  it('sends a verdict as a PATCH with a JSON body', async () => {
    stubFetch(() => jsonResponse(200, { id: 7, review_status: 'confirmed_fraud' }))
    const record = await reviewPrediction(7, { status: 'confirmed_fraud', note: 'Customer called.' })
    expect(record.review_status).toBe('confirmed_fraud')
    const { url, options } = lastCall()
    expect(url.pathname).toBe('/api/v1/predictions/7/review')
    expect(options.method).toBe('PATCH')
    expect(options.headers['Content-Type']).toBe('application/json')
    expect(JSON.parse(options.body)).toEqual({ status: 'confirmed_fraud', note: 'Customer called.' })
  })

  it('sends a blank or missing note as null', async () => {
    stubFetch(() => jsonResponse(200, {}))
    await reviewPrediction(1, { status: 'legitimate', note: '   ' })
    expect(JSON.parse(lastCall().options.body).note).toBeNull()
    await reviewPrediction(1, { status: 'legitimate' })
    expect(JSON.parse(lastCall().options.body).note).toBeNull()
  })

  it('surfaces the API rule that rejected a review', async () => {
    stubFetch(() =>
      jsonResponse(422, {
        error: { code: 'VALIDATION_ERROR', message: 'note: A note is required to confirm fraud on a low-risk prediction.' },
      }),
    )
    const error = await reviewPrediction(3, { status: 'confirmed_fraud' }).catch((e) => e)
    expect(error.status).toBe(422)
    expect(error.message).toContain('A note is required')
  })

  it('asks for a page of batches', async () => {
    stubFetch(() => jsonResponse(200, { items: [], total: 0, limit: 10, offset: 20 }))
    await getBatches({ offset: 20 })
    const { url } = lastCall()
    expect(url.pathname).toBe('/api/v1/batches')
    expect(Object.fromEntries(url.searchParams)).toEqual({ limit: '10', offset: '20' })
  })

  it('reads one prediction and one batch by id', async () => {
    stubFetch(() => jsonResponse(200, {}))
    await getPrediction(42)
    expect(lastCall().url.pathname).toBe('/api/v1/predictions/42')
    await getBatch('abc123')
    expect(lastCall().url.pathname).toBe('/api/v1/batches/abc123')
  })
})
