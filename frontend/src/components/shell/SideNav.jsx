import { PAGE_GROUPS, PAGES } from '../../pages'
import Icon from '../ui/Icon'

/** Count pill for a page, such as the review queue length. Nothing is drawn for zero. */
function Badge({ count }) {
  if (!count) return null
  return (
    <>
      <span
        aria-hidden="true"
        className="ml-auto rounded-xs border border-risk-review-line bg-risk-review-bg px-1.5 font-mono text-[11px] font-semibold text-risk-review"
      >
        {count}
      </span>
      <span className="sr-only">({count} pending)</span>
    </>
  )
}

/**
 * Grouped navigation for md and up. The page is the URL hash, so these are plain links.
 * `badges` maps a page id to a count shown next to its label.
 */
export function SideNav({ active, badges = {} }) {
  return (
    <nav aria-label="Main" className="sticky top-12 py-2">
      {PAGE_GROUPS.map((group) => (
        <div key={group}>
          <p className="px-4 pt-3 pb-1 text-[11px] font-semibold tracking-wider text-ink-faint uppercase">{group}</p>
          {PAGES.filter((p) => p.group === group).map((page) => {
            const current = page.id === active
            return (
              <a
                key={page.id}
                href={`#${page.id}`}
                aria-current={current ? 'page' : undefined}
                className={`relative flex h-9 items-center gap-2.5 px-4 text-[13px] ${
                  current
                    ? 'bg-brand-50 font-medium text-ink before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-brand-700'
                    : 'text-ink-muted hover:bg-subtle hover:text-ink'
                }`}
              >
                <Icon name={page.icon} className={`size-4 ${current ? 'text-brand-700' : ''}`} />
                {page.label}
                <Badge count={badges[page.id]} />
              </a>
            )
          })}
        </div>
      ))}
    </nav>
  )
}

/** Horizontal, scrollable version of the navigation for narrow screens. */
export function MobileNav({ active, badges = {} }) {
  return (
    <nav
      aria-label="Main"
      className="flex overflow-x-auto border-b border-line-strong bg-surface [scrollbar-width:none] md:hidden"
    >
      {PAGES.map((page) => {
        const current = page.id === active
        return (
          <a
            key={page.id}
            href={`#${page.id}`}
            aria-current={current ? 'page' : undefined}
            className={`flex h-10 shrink-0 items-center gap-1.5 border-b-2 px-3 text-[13px] whitespace-nowrap ${
              current
                ? 'border-brand-700 bg-brand-50 font-medium text-ink'
                : 'border-transparent text-ink-muted hover:bg-subtle hover:text-ink'
            }`}
          >
            <Icon name={page.icon} className={`hidden size-4 sm:block ${current ? 'text-brand-700' : ''}`} />
            {page.label}
            <Badge count={badges[page.id]} />
          </a>
        )
      })}
    </nav>
  )
}
