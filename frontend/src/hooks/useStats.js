import { useCallback, useEffect, useRef, useState } from 'react'
import { getStats } from '../api'

const POLL_MS = 15000

/**
 * Store-wide statistics (counts by risk and source, plus the review block). Refreshed on a timer
 * and on demand: call `refresh` after anything that changes the log.
 */
export default function useStats(online) {
  const [stats, setStats] = useState(null)
  const mounted = useRef(true)

  const refresh = useCallback(async () => {
    let next
    try {
      next = await getStats()
    } catch {
      return // The header already says when the API is unreachable; keep the last numbers meanwhile.
    }
    if (mounted.current) setStats(next)
  }, [])

  useEffect(() => {
    mounted.current = true
    if (!online) return
    refresh()
    const id = setInterval(refresh, POLL_MS)
    return () => {
      mounted.current = false
      clearInterval(id)
    }
  }, [online, refresh])

  return { stats: online ? stats : null, refresh }
}
