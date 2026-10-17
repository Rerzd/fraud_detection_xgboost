import { useEffect, useState } from 'react'
import { getModelInfo } from '../api'

/** Model card from GET /model/info, fetched once the backend is online. */
export default function useModelInfo(online) {
  const [state, setState] = useState({ info: null, error: null })

  useEffect(() => {
    if (!online) return
    let cancelled = false
    getModelInfo()
      .then((info) => !cancelled && setState({ info, error: null }))
      .catch((err) => !cancelled && setState({ info: null, error: err.message }))
    return () => {
      cancelled = true
    }
  }, [online])

  return state
}
