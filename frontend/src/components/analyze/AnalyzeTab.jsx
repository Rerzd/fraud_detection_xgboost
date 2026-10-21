import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { getExamples, predict } from '../../api'
import { caseId } from '../../lib/testcase'
import { EMPTY_FORM, toFormValues, validateTransaction } from '../../lib/validation'
import { Page } from '../shell/PageHeader'
import ResultPanel from './ResultPanel'
import TestCaseForm from './TestCaseForm'

export default function AnalyzeTab({ thresholds, online, onScored = () => {} }) {
  const [values, setValues] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState(false)
  const [examples, setExamples] = useState([])
  const [run, setRun] = useState(null)
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

  function reset() {
    setValues(EMPTY_FORM)
    setErrors({})
    setTouched(false)
  }

  async function submit() {
    if (loading) return
    const { errors: found, transaction } = validateTransaction(values)
    setTouched(true)
    setErrors(found)
    if (!transaction) return

    setLoading(true)
    setApiError(null)
    try {
      const result = await predict(transaction)
      const at = new Date()
      setRun({ result, request: transaction, caseId: caseId(at), at })
      onScored()
    } catch (err) {
      setApiError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // On narrow screens the result sits below the form. Scroll after it has rendered: before that the
  // page is still short, and the browser would stop at the old end of the document.
  useEffect(() => {
    if (run && window.matchMedia('(max-width: 1023px)').matches) {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [run])

  // Ctrl/Cmd+Enter runs the test from anywhere on the page.
  const onShortcut = useEffectEvent((event) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault()
      submit()
    }
  })
  useEffect(() => {
    window.addEventListener('keydown', onShortcut)
    return () => window.removeEventListener('keydown', onShortcut)
  }, [])

  // Thresholds come from /model/info; until it loads, fall back to the threshold in the response.
  const activeThresholds = thresholds ?? { review: null, fraud: run?.result.threshold }

  return (
    <Page id="analyze">
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <TestCaseForm
          values={values}
          errors={errors}
          onChange={change}
          onSubmit={submit}
          onReset={reset}
          loading={loading}
          examples={examples}
          onExample={loadExample}
        />
        <div ref={resultRef} className="scroll-mt-16">
          <ResultPanel run={run} thresholds={activeThresholds} error={apiError} loading={loading} />
        </div>
      </div>
    </Page>
  )
}
