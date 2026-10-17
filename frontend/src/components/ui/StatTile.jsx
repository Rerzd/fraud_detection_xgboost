export default function StatTile({ label, value, hint, accent = 'text-fg' }) {
  return (
    <div className="rounded-xl border border-line bg-panel px-4 py-3.5">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 font-mono text-2xl font-medium tabular ${accent}`}>{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-subtle">{hint}</p>}
    </div>
  )
}
