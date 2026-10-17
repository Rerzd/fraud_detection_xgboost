const BASE =
  'h-8 w-full rounded border bg-surface px-2.5 text-[13px] text-ink placeholder:text-ink-faint focus:border-brand-700'

export function Input({ invalid = false, className = '', ...props }) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={`${BASE} ${invalid ? 'border-risk-high' : 'border-line-input'} ${className}`}
      {...props}
    />
  )
}

export function Select({ invalid = false, className = '', children, ...props }) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={`${BASE} ${invalid ? 'border-risk-high' : 'border-line-input'} ${className}`}
      {...props}
    >
      {children}
    </select>
  )
}

/** Label, input, hint and inline error wired together with aria-describedby. */
export function Field({ id, label, hint, error, mono = false, className = '', ...inputProps }) {
  const describedBy = [hint && !error && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ')
  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-ink-muted">
        {label}
      </label>
      <Input
        id={id}
        name={id}
        invalid={Boolean(error)}
        aria-describedby={describedBy || undefined}
        className={mono ? 'font-mono' : ''}
        {...inputProps}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-ink-faint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-risk-high">
          {error}
        </p>
      )}
    </div>
  )
}
