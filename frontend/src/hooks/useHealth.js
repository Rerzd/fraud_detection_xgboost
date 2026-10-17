import { useEffect, useState } from 'react'
import { getHealth } from '../api'

const POLL_MS = 10000

/** Backend status: 'checking' until the first answer, then 'online' or 'offline'. */
export default function useHealth() {
  const [state, setState] = useState({ status: 'checking', modelVersion: null })

  useEffect(() => {
    let cancelled = false
    async function check() {
      try {
        const health = await getHealth()
        if (!cancelled) {
          setState({
            status: health.model_loaded ? 'online' : 'offline',
            modelVersion: health.model_version,
          })
        }
      } catch {
        if (!cancelled) setState({ status: 'offline', modelVersion: null })
      }
    }
    check()
    const id = setInterval(check, POLL_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  return state
}
