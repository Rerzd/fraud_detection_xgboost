import Spinner from './Spinner'

const VARIANTS = {
  primary: 'border-brand-700 bg-brand-700 text-white hover:border-brand-600 hover:bg-brand-600',
  secondary: 'border-line-input bg-surface text-ink hover:bg-subtle',
  ghost: 'border-transparent text-ink-muted hover:bg-subtle hover:text-ink',
  danger: 'border-risk-high bg-surface text-risk-high hover:bg-risk-high-bg',
}

const SIZES = {
  sm: 'h-7 gap-1.5 px-2.5 text-xs',
  md: 'h-8 gap-2 px-3 text-[13px]',
}

/** `loading` shows a spinner, disables the button and sets aria-busy. */
export default function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center rounded border font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {loading && <Spinner className="size-3.5" />}
      {children}
    </button>
  )
}
