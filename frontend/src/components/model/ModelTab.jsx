import { Page } from '../shell/PageHeader'
import EmptyState from '../ui/EmptyState'
import Panel from '../ui/Panel'
import Spinner from '../ui/Spinner'
import { Features, Limitations, Metrics, Overview, Thresholds, TrainingSetup } from './ModelSections'
import OnThisPage from './OnThisPage'
import Section from './Section'

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'metrics', label: 'Metrics' },
  { id: 'training', label: 'Training setup' },
  { id: 'thresholds', label: 'Decision thresholds' },
  { id: 'features', label: 'Features' },
  { id: 'limitations', label: 'Limitations' },
]

/** The model card as a document: an "On this page" list on the left, sections on the right. */
export default function ModelTab({ info, error, online }) {
  if (!online || error) {
    return (
      <Page id="model">
        <Panel title="Model card">
          <EmptyState icon="cpu" title={online ? 'Could not load the model card' : 'Backend offline'}>
            {error || 'The model card is served by the API. Start the backend to see it.'}
          </EmptyState>
        </Panel>
      </Page>
    )
  }
  if (!info) {
    return (
      <Page id="model">
        <Panel title="Model card">
          <div className="flex justify-center py-10 text-ink-muted">
            <Spinner className="size-5" />
          </div>
        </Panel>
      </Page>
    )
  }

  const body = {
    overview: <Overview info={info} />,
    metrics: <Metrics metrics={info.metrics} />,
    training: <TrainingSetup algorithm={info.algorithm} data={info.training_data} />,
    thresholds: <Thresholds thresholds={info.thresholds} />,
    features: <Features features={info.features} />,
    limitations: <Limitations items={info.limitations} />,
  }

  return (
    <Page id="model">
      <div className="lg:grid lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-8">
        <OnThisPage sections={SECTIONS} />
        <div className="max-w-4xl min-w-0 space-y-8">
          {SECTIONS.map(({ id, label }) => (
            <Section key={id} id={id} title={label}>
              {body[id]}
            </Section>
          ))}
        </div>
      </div>
    </Page>
  )
}
