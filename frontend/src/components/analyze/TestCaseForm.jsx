import { RISK } from '../../lib/format'
import { STEP_MAX, STEP_MIN, TRANSACTION_TYPES } from '../../lib/validation'
import Button from '../ui/Button'
import { Field } from '../ui/Field'
import Kbd from '../ui/Kbd'
import Panel from '../ui/Panel'
import RiskBadge from '../ui/RiskBadge'
import SegmentedControl from '../ui/SegmentedControl'

const isMac = /Mac|iPhone|iPad/.test(navigator.userAgentData?.platform ?? navigator.platform ?? '')
const SHORTCUT_KEY = isMac ? 'Cmd' : 'Ctrl'

const TYPE_OPTIONS = TRANSACTION_TYPES.map((type) => ({ value: type, label: type }))

function Section({ number, title, children }) {
  return (
    <section aria-label={title} className="border-b border-line px-4 py-3">
      <h3 className="mb-2.5 flex items-center gap-2 text-[11px] font-semibold tracking-wider text-ink-muted uppercase">
        <span className="grid size-5 place-items-center rounded-sm border border-line-strong bg-subtle font-mono text-ink-muted">
          {number}
        </span>
        {title}
      </h3>
      {children}
    </section>
  )
}

function Fixtures({ examples, onExample }) {
  return (
    <div className="border-b border-line px-4 py-3">
      <p className="mb-2 text-[11px] font-semibold tracking-wider text-ink-muted uppercase">Load fixture</p>
      <div className="flex flex-wrap gap-1.5">
        {examples.map((ex) => (
          <button
            key={ex.id}
            type="button"
            onClick={() => onExample(ex)}
            title={ex.description}
            className="inline-flex h-7 items-center gap-2 rounded border border-line-input bg-surface pr-1 pl-2 text-xs text-ink hover:bg-subtle"
          >
            {ex.id.replaceAll('-', ' ')}
            <RiskBadge level={ex.label} />
            <span className="sr-only">(expected {RISK[ex.label].label})</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function BalancePair({ before, after, values, errors, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[
        [before, 'Balance before'],
        [after, 'Balance after'],
      ].map(([name, label]) => (
        <Field
          key={name}
          id={name}
          label={label}
          mono
          type="number"
          inputMode="decimal"
          step="any"
          placeholder="0.00"
          value={values[name]}
          error={errors[name]}
          onChange={(e) => onChange(name, e.target.value)}
        />
      ))}
    </div>
  )
}

export default function TestCaseForm({ values, errors, onChange, onSubmit, onReset, loading, examples, onExample }) {
  return (
    <Panel title="Test case input" flush>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit()
        }}
      >
        {examples.length > 0 && <Fixtures examples={examples} onExample={onExample} />}

        <Section number="1" title="Transaction">
          <SegmentedControl
            label="Transaction type"
            options={TYPE_OPTIONS}
            value={values.type}
            onChange={(type) => onChange('type', type)}
          />
          {errors.type && <p className="mt-1 text-xs text-risk-high">{errors.type}</p>}
          <p className="mt-1.5 text-xs text-ink-faint">
            Only these two types: in PaySim, fraud never occurs in the others.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field
              id="amount"
              label="Amount"
              mono
              type="number"
              inputMode="decimal"
              step="any"
              placeholder="0.00"
              value={values.amount}
              error={errors.amount}
              onChange={(e) => onChange('amount', e.target.value)}
            />
            <Field
              id="step"
              label="Step"
              mono
              type="number"
              inputMode="numeric"
              step="any"
              placeholder="1"
              hint={`Simulation hour, ${STEP_MIN}–${STEP_MAX}`}
              value={values.step}
              error={errors.step}
              onChange={(e) => onChange('step', e.target.value)}
            />
          </div>
        </Section>

        <Section number="2" title="Origin account">
          <BalancePair before="oldbalanceOrg" after="newbalanceOrig" values={values} errors={errors} onChange={onChange} />
          <p className="mt-1.5 text-xs text-ink-faint">Both 0: the model receives NaN, as in training.</p>
        </Section>

        <Section number="3" title="Destination account">
          <BalancePair before="oldbalanceDest" after="newbalanceDest" values={values} errors={errors} onChange={onChange} />
          <p className="mt-1.5 text-xs text-ink-faint">Both 0 with a non-zero amount: the model receives -1.</p>
        </Section>

        <div className="flex flex-wrap items-center gap-2 rounded-b-[3px] bg-subtle px-4 py-3">
          <Button type="submit" variant="primary" loading={loading}>
            {loading ? 'Running' : 'Run test'}
            {!loading && (
              <span className="flex items-center gap-1" aria-hidden="true">
                <Kbd>{SHORTCUT_KEY}</Kbd>
                <Kbd>Enter</Kbd>
              </span>
            )}
          </Button>
          <Button onClick={onReset} disabled={loading}>
            Reset
          </Button>
          <span className="sr-only">Keyboard shortcut: {SHORTCUT_KEY} plus Enter runs the test.</span>
        </div>
      </form>
    </Panel>
  )
}
