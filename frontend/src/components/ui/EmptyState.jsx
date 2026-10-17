import Icon from './Icon'

export default function EmptyState({ icon = 'info', title, children }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <div className="grid size-10 place-items-center rounded-full border border-line bg-raised text-muted">
        <Icon name={icon} className="size-5" />
      </div>
      <p className="text-sm font-medium text-fg">{title}</p>
      {children && <div className="max-w-sm text-sm text-muted">{children}</div>}
    </div>
  )
}
