import { pageById } from '../../pages'

/** Breadcrumb, page title, one-line description and right-aligned page actions. */
export default function PageHeader({ id, actions }) {
  const page = pageById(id)
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-line pb-3">
      <div className="min-w-0">
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5 text-xs text-ink-faint">
            <li>{page.group}</li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">{page.label}</li>
          </ol>
        </nav>
        <h1 className="mt-1 text-lg font-semibold text-ink">{page.label}</h1>
        <p className="text-[13px] text-ink-muted">{page.description}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/** Page wrapper: header on top, then the content with a consistent vertical rhythm. */
export function Page({ id, actions, children }) {
  return (
    <>
      <PageHeader id={id} actions={actions} />
      <div className="space-y-4">{children}</div>
    </>
  )
}
