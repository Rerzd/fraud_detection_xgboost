const VARIANTS = {
  primary: 'bg-accent text-white hover:bg-accent-hover disabled:bg-accent/50',
  secondary: 'border border-line-strong bg-raised text-fg hover:border-accent/60 disabled:text-subtle',
  ghost: 'text-muted hover:bg-raised hover:text-fg disabled:text-subtle',
  danger: 'border border-risk-high/40 text-risk-high hover:bg-risk-high/10',
}

export default function Button({ variant = 'secondary', className = '', children, ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
