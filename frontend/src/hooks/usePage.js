import { useCallback, useEffect, useEffectEvent, useState } from 'react'

/**
 * Loads one page of a paginated listing. `key` identifies what is being asked for (page, filters,
 * reload counter): when it changes, `load` runs again and `loading` is true until it answers. The
 * previous page stays in `page` meanwhile, so the table can dim instead of vanishing.
 *
 * `replace(record)` swaps a record in the loaded page by id, for edits that need no reload.
 */
export default function usePage({ enabled, key, load }) {
  const [state, setState] = useState({ key: null, page: null, error: null })
  const fetchPage = useEffectEvent(load)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    fetchPage()
      .then((page) => !cancelled && setState({ key, page, error: null }))
      .catch((err) => !cancelled && setState((s) => ({ ...s, key, error: err.message })))
    return () => {
      cancelled = true
    }
  }, [enabled, key])

  const replace = useCallback(
    (record) =>
      setState((s) =>
        s.page ? { ...s, page: { ...s.page, items: s.page.items.map((i) => (i.id === record.id ? record : i)) } } : s,
      ),
    [],
  )

  return { page: state.page, error: state.error, loading: enabled && state.key !== key, replace }
}
