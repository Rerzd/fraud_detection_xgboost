import { useState } from 'react'
import Callout from '../ui/Callout'
import EmptyState from '../ui/EmptyState'
import Panel from '../ui/Panel'
import Tabs, { TabPanel } from '../ui/Tabs'
import DecisionPanel from './DecisionPanel'
import FeaturesTable from './FeaturesTable'
import RequestResponse from './RequestResponse'
import ScoreBreakdown from './ScoreBreakdown'
import SignalsList from './SignalsList'

const TABS = [
  { id: 'breakdown', label: 'Score breakdown' },
  { id: 'features', label: 'Engineered features' },
  { id: 'signals', label: 'Signals' },
  { id: 'http', label: 'Request / Response' },
]

/** Right-hand side of the page: empty state, error, or the decision plus the analysis tabs. */
export default function ResultPanel({ run, thresholds, error, loading }) {
  const [tab, setTab] = useState('breakdown')

  if (error) {
    return (
      <Panel title="Result">
        <Callout tone="danger" title="The test case could not be scored">
          {error}
        </Callout>
      </Panel>
    )
  }

  if (!run) {
    return (
      <Panel title="Result">
        <EmptyState title="No test run yet">Fill the case or load a fixture, then Run test.</EmptyState>
      </Panel>
    )
  }

  const { result, request } = run
  return (
    <div className={`space-y-4 transition-opacity ${loading ? 'opacity-50' : ''}`} aria-busy={loading}>
      <DecisionPanel run={run} thresholds={thresholds} />
      <Panel flush>
        <Tabs
          tabs={TABS}
          value={tab}
          onChange={setTab}
          label="Result details"
          idPrefix="result"
          className="rounded-t-[3px] bg-subtle px-2"
        />
        <TabPanel idPrefix="result" id="breakdown" value={tab} className="px-4 py-3">
          <ScoreBreakdown explanation={result.explanation} />
        </TabPanel>
        <TabPanel idPrefix="result" id="features" value={tab} className="px-4 py-3">
          <FeaturesTable features={result.features} raw={request} />
        </TabPanel>
        <TabPanel idPrefix="result" id="signals" value={tab} className="px-4 py-3">
          <SignalsList signals={result.signals} />
        </TabPanel>
        <TabPanel idPrefix="result" id="http" value={tab} className="px-4 py-3">
          <RequestResponse request={request} response={result} />
        </TabPanel>
      </Panel>
    </div>
  )
}
