import { useEffect, useState } from 'react'
import { getBatchLimits, predictBatch } from '../../api'
import { checkFile, downloadText, resultsCsv, templateCsv } from '../../lib/csv'
import { Page } from '../shell/PageHeader'
import Button from '../ui/Button'
import Callout from '../ui/Callout'
import EmptyState from '../ui/EmptyState'
import Icon from '../ui/Icon'
import Panel from '../ui/Panel'
import BatchResults from './BatchResults'
import Dropzone from './Dropzone'

export default function BatchTab({ online }) {
  const [limits, setLimits] = useState(null)
  const [fileName, setFileName] = useState(null)
  // The results keep the name of the file they came from while the next file is still scoring.
  const [run, setRun] = useState(null)
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
      setRun(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      setRun({ result: await predictBatch(file), fileName: file.name })
    } catch (err) {
      setError(err.message)
      setRun(null)
    } finally {
      setLoading(false)
    }
  }

  function downloadResults() {
    const base = run.fileName.replace(/\.csv$/i, '') || 'batch'
    downloadText(`${base}-scored.csv`, resultsCsv(run.result.rows))
  }

  const actions = (
    <>
      <Button onClick={() => downloadText('transactions-template.csv', templateCsv())}>
        <Icon name="download" />
        Download template
      </Button>
      <Button onClick={downloadResults} disabled={!run?.result.rows.length}>
        <Icon name="download" />
        Download results CSV
      </Button>
    </>
  )

  return (
    <Page id="batch" actions={actions}>
      <Panel
        title="Input file"
        meta={fileName && <span className="max-w-64 truncate font-mono">{fileName}</span>}
      >
        <Dropzone onFile={score} limits={limits} loading={loading} />
        {error && (
          <Callout tone="danger" title="The file could not be scored" className="mt-3">
            {error}
          </Callout>
        )}
      </Panel>

      {run ? (
        <BatchResults result={run.result} fileName={run.fileName} loading={loading} />
      ) : (
        <Panel title="Results">
          <EmptyState title="No batch run yet">
            Upload a CSV to score it. Scored rows are saved to the Audit log.
          </EmptyState>
        </Panel>
      )}
    </Page>
  )
}
