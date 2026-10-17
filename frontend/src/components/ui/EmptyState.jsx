import Icon from './Icon'

/** Quiet placeholder: a title and one or two plain sentences. No illustration. */
export default function EmptyState({ icon, title, children }) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-6 py-10 text-center">
      {icon && <Icon name={icon} className="size-5 text-ink-faint" />}
      <p className="text-[13px] font-semibold text-ink">{title}</p>
      {children && <div className="max-w-md text-[13px] text-ink-muted">{children}</div>}
    </div>
  )
}
