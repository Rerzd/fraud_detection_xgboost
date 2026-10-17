import { STEP_MAX, STEP_MIN, TRANSACTION_TYPES } from '../../lib/validation'
import { RISK, TYPE_LABELS } from '../../lib/format'
import Button from '../ui/Button'
import Spinner from '../ui/Spinner'

function Field({ name, label, hint, value, error, onChange, inputMode = 'decimal', placeholder = '0.00' }) {
  const describedBy = [hint && `${name}-hint`, error && `${name}-error`].filter(Boolean).join(' ')
  return (
    <div className="min-w-0">
      <label htmlFor={name} className="mb-1.5 block text-xs text-muted">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="number"
        inputMode={inputMode}
        step="any"
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy || undefined}
        className={`w-full rounded-lg border bg-raised px-3 py-2 font-mono text-sm text-fg tabular placeholder:text-ink-faint focus:border-accent focus:outline-none ${
          error ? 'border-risk-high/60' : 'border-line'
        }`}
        placeholder={placeholder}
      />
      {hint && !error && (
        <p id={`${name}-hint`} className="mt-1 text-[11px] text-ink-faint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${name}-error`} className="mt-1 text-[11px] text-risk-high">
          {error}
        </p>
      )}
    </div>
  )
}

function TypeControl({ value, onChange, error }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-xs text-muted">Transaction type</legend>
      <div className="grid grid-cols-2 gap-1 rounded-lg border border-line bg-raised p-1" role="radiogroup">
        {TRANSACTION_TYPES.map((type) => {
          const selected = value === type
          return (
            <button
              key={type}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange('type', type)}
              className={`rounded-md px-3 py-1.5 font-mono text-xs transition-colors ${
                selected ? 'bg-accent text-white' : 'text-muted hover:text-fg'
              }`}
            >
              {type}
              <span className="sr-only"> ({TYPE_LABELS[type]})</span>
            </button>
          )
        })}
      </div>
      <p className="mt-1.5 text-[11px] text-ink-faint">
        The model was trained only on these two types: in PaySim, fraud never occurs in the others.
      </p>
      {error && <p className="mt-1 text-[11px] text-risk-high">{error}</p>}
    </fieldset>
  )
}

function AccountGroup({ title, fields, values, errors, onChange }) {
  return (
    <fieldset className="rounded-lg border border-line p-3.5">
      <legend className="px-1 text-[11px] font-medium tracking-wider text-ink-faint uppercase">{title}</legend>
      <div className="grid grid-cols-2 gap-3">
        {fields.map(([name, label]) => (
          <Field
            key={name}
            name={name}
            label={label}
            value={values[name]}
            error={errors[name]}
            onChange={onChange}
          />
        ))}
      </div>
    </fieldset>
  )
}

export default function TransactionForm({ values, errors, onChange, onSubmit, loading, examples, onExample }) {
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
      className="space-y-5"
    >
      {examples.length > 0 && (
        <div>
          <p className="mb-2 text-xs text-muted">Load an example</p>
          <div className="flex flex-wrap gap-1.5">
            {examples.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => onExample(ex)}
                title={ex.description}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-raised px-2.5 py-1 text-xs text-muted transition-colors hover:border-accent/60 hover:text-fg"
              >
                <span className={`size-1.5 rounded-full ${RISK[ex.label].bg}`} aria-hidden="true" />
                {ex.id.replaceAll('-', ' ')}
                <span className="sr-only"> (expected {RISK[ex.label].label})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <TypeControl value={values.type} onChange={onChange} error={errors.type} />

      <div className="grid grid-cols-2 gap-3">
        <Field name="amount" label="Amount" value={values.amount} error={errors.amount} onChange={onChange} />
        <Field
          name="step"
          label={`Simulation hour (${STEP_MIN}–${STEP_MAX})`}
          hint="1 step = 1 hour of the 30-day simulation"
          inputMode="numeric"
          placeholder="1"
          value={values.step}
          error={errors.step}
          onChange={onChange}
        />
      </div>

      <AccountGroup
        title="Origin account"
        fields={[
          ['oldbalanceOrg', 'Balance before'],
          ['newbalanceOrig', 'Balance after'],
        ]}
        values={values}
        errors={errors}
        onChange={onChange}
      />
      <AccountGroup
        title="Destination account"
        fields={[
          ['oldbalanceDest', 'Balance before'],
          ['newbalanceDest', 'Balance after'],
        ]}
        values={values}
        errors={errors}
        onChange={onChange}
      />

      <Button type="submit" variant="primary" disabled={loading} className="w-full py-2.5">
        {loading && <Spinner />}
        {loading ? 'Scoring' : 'Analyze transaction'}
      </Button>
    </form>
  )
}
