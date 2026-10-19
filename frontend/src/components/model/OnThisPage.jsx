import { useEffect, useRef, useState } from 'react'

// Distance from the top of the viewport at which a section counts as the current one: the sticky
// header (48px) plus some air.
const READING_LINE = 96

// After a click the page scrolls on its own. For this long the click decides the current section, so a
// section that cannot reach the top of a short page does not hand the highlight to the last one.
const SETTLE_MS = 900

/**
 * Sticky list of the page's sections. The page itself is routed by the URL hash, so these are buttons
 * that scroll, not hash links. The current section follows the scroll position.
 */
export default function OnThisPage({ sections }) {
  const [active, setActive] = useState(sections[0].id)
  const settleUntil = useRef(0)

  useEffect(() => {
    function update(event) {
      if (event.timeStamp < settleUntil.current) return
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
      let current = sections[0].id
      for (const { id } of sections) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= READING_LINE) current = id
      }
      setActive(atBottom ? sections.at(-1).id : current)
    }
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [sections])

  function go(id, now) {
    const el = document.getElementById(id)
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    el.querySelector('h2')?.focus({ preventScroll: true })
    settleUntil.current = now + SETTLE_MS
    setActive(id)
  }

  return (
    <nav aria-label="On this page" className="sticky top-16 hidden self-start lg:block">
      <p className="mb-2 text-[11px] font-semibold tracking-wider text-ink-muted uppercase">On this page</p>
      <ul className="border-l border-line-strong">
        {sections.map(({ id, label }) => {
          const current = id === active
          return (
            <li key={id}>
              <button
                type="button"
                onClick={(event) => go(id, event.timeStamp)}
                aria-current={current ? 'location' : undefined}
                className={`-ml-px block w-full border-l-2 py-1 pl-3 text-left text-[13px] ${
                  current
                    ? 'border-brand-700 font-medium text-brand-700'
                    : 'border-transparent text-ink-muted hover:text-ink'
                }`}
              >
                {label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
