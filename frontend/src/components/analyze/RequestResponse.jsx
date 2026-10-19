import { API_URL } from '../../api'
import useCopy from '../../hooks/useCopy'
import { buildCurl } from '../../lib/testcase'
import Button from '../ui/Button'
import CodeBlock from '../ui/CodeBlock'
import Icon from '../ui/Icon'
import Tag from '../ui/Tag'

const ENDPOINT = `${API_URL}/predict`

/** The exact request that was sent and the raw response, ready to reproduce with cURL. */
export default function RequestResponse({ request, response }) {
  const { copied, failed, copy } = useCopy()
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex min-w-0 items-center gap-2 font-mono text-xs text-ink-muted">
          <Tag tone="brand">POST</Tag>
          <span className="truncate">{ENDPOINT}</span>
        </p>
        <Button size="sm" onClick={() => copy(buildCurl(ENDPOINT, request))}>
          <Icon name={copied ? 'check' : 'copy'} />
          <span aria-live="polite">{copied ? 'Copied cURL' : failed ? 'Copy failed' : 'Copy as cURL'}</span>
        </Button>
      </div>
      <CodeBlock label="Request body" code={JSON.stringify(request, null, 2)} />
      <CodeBlock label="Response body" code={JSON.stringify(response, null, 2)} />
    </div>
  )
}
