import { useEffect, useRef, useState } from 'react'
import { getExamples, predict } from '../../api'
import { EMPTY_FORM, toFormValues, validateTransaction } from '../../lib/validation'
import { Page } from '../shell/PageHeader'
import Panel from '../ui/Panel'
import ResultPanel from './ResultPanel'
import TransactionForm from './TransactionForm'

export default function AnalyzeTab({ thresholds, online }) {
  const [values, setValues] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState(false)
  const [examples, setExamples] = useState([])
  const [result, setResult] = useState(null)
  const [submitted, setSubmitted] = useState(null)
  const [apiError, setApiError] = useState(null)
  const [loading, setLoading] = useState(false)
  const resultRef = useRef(null)

  useEffect(() => {
    if (!online) return
    getExamples()
      .then(setExamples)
      .catch(() => setExamples([]))
  }, [online])

  function change(name, value) {
    const next = { ...values, [name]: value }
    setValues(next)
    if (touched) setErrors(validateTransaction(next).errors)
  }

  function loadExample(example) {
    setValues(toFormValues(example.transaction))
    setErrors({})
    setTouched(false)
  }

  async function submit() {
    const { errors: found, transaction } = validateTransaction(values)
    setTouched(true)
    setErrors(found)
    if (!transaction) return

    setLoading(true)
    setApiError(null)
    try {
      setResult(await predict(transaction))
      setSubmitted(transaction)
      // On narrow screens the result sits below the form; bring it into view.
      if (window.matchMedia('(max-width: 1023px)').matches) {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } catch (err) {
      setApiError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Thresholds come from /model/info; until it loads, fall back to the threshold in the response.
  const activeThresholds = thresholds ?? { review: null, fraud: result?.threshold }

  return (
    <Page id="analyze">
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <Panel title="Transaction" description="Raw PaySim fields. Derived features are computed by the backend.">
          <TransactionForm
            values={values}
            errors={errors}
            onChange={change}
            onSubmit={submit}
            loading={loading}
            examples={examples}
            onExample={loadExample}
          />
        </Panel>
        <div ref={resultRef} className="scroll-mt-4">
          <Panel title="Result" className="min-h-80">
            <ResultPanel
              result={result}
              raw={submitted}
              thresholds={activeThresholds}
              error={apiError}
              loading={loading}
            />
          </Panel>
        </div>
      </div>
    </Page>
  )
}
