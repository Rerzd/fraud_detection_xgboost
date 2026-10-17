import { useCallback, useEffect, useRef, useState } from 'react'

function legacyCopy(text) {
  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.opacity = '0'
  document.body.appendChild(area)
  area.select()
  const ok = document.execCommand('copy')
  area.remove()
  if (!ok) throw new Error('copy failed')
}

/** Copy text to the clipboard; `copied` / `failed` reset after a short delay. */
export default function useCopy(resetMs = 1500) {
  const [state, setState] = useState('idle')
  const timer = useRef(null)

  const copy = useCallback(
    async (text) => {
      try {
        try {
          await navigator.clipboard.writeText(text)
        } catch {
          // Missing API (insecure context) or permission denied: fall back to execCommand.
          legacyCopy(text)
        }
        setState('copied')
      } catch {
        setState('failed')
      }
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setState('idle'), resetMs)
    },
    [resetMs],
  )

  useEffect(() => () => clearTimeout(timer.current), [])

  return { copied: state === 'copied', failed: state === 'failed', copy }
}
