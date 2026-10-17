import { useEffect, useState } from 'react'
import { getBatchLimits, predictBatch } from '../../api'
import { checkFile, downloadText, resultsCsv, templateCsv } from '../../lib/csv'
import { Page } from '../shell/PageHeader'
import Button from '../ui/Button'
import Icon from '../ui/Icon'
import Panel from '../ui/Panel'
import BatchResults from './BatchResults'
import Dropzone from './Dropzone'

export default function BatchTab({ online }) {
  const [limits, setLimits] = useState(null)
  const [fileName, setFileName] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!online) return
    getBatchLimits()
      .then(setLimits)
      .catch(() => setLimits(null))
  }, [online])

  async function score(file) {
    setFileName(file.name)
    const problem = checkFile(file, limits)
    if (problem) {
      setError(problem)
      setResult(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      setResult(await predictBatch(file))
    } catch (err) {
      setError(err.message)
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  function downloadResults() {
    const base = fileName?.replace(/\.csv$/i, '') || 'batch'
    downloadText(`${base}-scored.csv`, resultsCsv(result.rows))
  }

  return (
    <Page id="batch">
      <Panel
        title="Batch scoring"
        description="Score a CSV of raw transactions. Scored rows are saved to the history."
        actions={
          <Button onClick={() => downloadText('transactions-template.csv', templateCsv())}>
            <Icon name="download" />
            Download template
          </Button>
        }
      >
        <Dropzone onFile={score} limits={limits} loading={loading} />
        {error && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-risk-high/30 bg-risk-high/5 p-3 text-sm" role="alert">
            <Icon name="alert" className="mt-0.5 size-4 shrink-0 text-risk-high" />
            <p className="text-muted">
              {fileName && <span className="font-mono text-fg">{fileName}: </span>}
              {error}
            </p>
          </div>
        )}
      </Panel>

      {result && (
        <Panel
          title="Results"
          description={
            <>
              <span className="font-mono">{fileName}</span> · batch{' '}
              <span className="font-mono">{result.batch_id.slice(0, 8)}</span>
            </>
          }
          actions={
            result.rows.length > 0 && (
              <Button onClick={downloadResults}>
                <Icon name="download" />
                Download results CSV
              </Button>
            )
          }
        >
          <BatchResults key={result.batch_id} result={result} />
        </Panel>
      )}
    </Page>
  )
}
