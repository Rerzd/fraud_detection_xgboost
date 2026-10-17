import { useCallback, useEffect, useRef, useState } from 'react'
import { getHealth } from '../api'

const POLL_MS = 10000

/**
 * Backend status: 'checking' until the first answer, then 'online' or 'offline'.
 * `refresh` re-checks immediately and resolves when the answer is in.
 */
export default function useHealth() {
  const [state, setState] = useState({ status: 'checking', modelVersion: null })
  const mounted = useRef(true)

  const refresh = useCallback(async () => {
    let next
    try {
      const health = await getHealth()
      next = { status: health.model_loaded ? 'online' : 'offline', modelVersion: health.model_version }
    } catch {
      next = { status: 'offline', modelVersion: null }
    }
    if (mounted.current) setState(next)
  }, [])

  useEffect(() => {
    mounted.current = true
    refresh()
    const id = setInterval(refresh, POLL_MS)
    return () => {
      mounted.current = false
      clearInterval(id)
    }
  }, [refresh])

  return { ...state, refresh }
}
