import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import ModelTab from './ModelTab'

// Same shape as GET /model/info. The cut-off in the metrics key is 0.7 on purpose: the page must read
// it from the API instead of assuming 0.5.
const INFO = {
  name: 'Test classifier',
  version: 'xgb-test-v9',
  algorithm: {
    estimator: 'XGBClassifier',
    objective: 'binary:logistic',
    hyperparameters: { max_depth: 3, n_estimators: 100, scale_pos_weight: 336.32, missing: 'NaN' },
  },
  training_data: {
    dataset: 'Synthetic dataset',
    total_rows: 6362620,
    filter: 'Only TRANSFER and CASH_OUT',
    rows_after_filter: { TRANSFER: 532909, CASH_OUT: 2237500 },
    split: '80/20 train/test',
    class_weighting: '`scale_pos_weight` = negatives / positives',
  },
  metrics: {
    test_rows: 554082,
    test_frauds: 1670,
    auprc: 0.9926,
    fraud_class_at_0_7: { precision: 0.85, recall: 1.0, f1: 0.92 },
  },
  thresholds: {
    review: 0.2,
    fraud: 0.5,
    levels: {
      low: 'probability < 0.2: approve',
      review: '0.2 <= probability < 0.5: send to manual review',
      high: 'probability >= 0.5: flag for fraud',
    },
  },
  features: [
    { name: 'step', description: 'Simulation hour.' },
    { name: 'errorbalanceDest', description: 'Computed from `amount` and the balances.' },
  ],
  limitations: ['Trained on synthetic data.', '`step` is simulation time.'],
}

const render = (props) => renderToStaticMarkup(<ModelTab online info={INFO} error={null} {...props} />)

describe('ModelTab', () => {
  it('lays the card out as the six document sections, with a matching "On this page" list', () => {
    const html = render()
    for (const id of ['overview', 'metrics', 'training', 'thresholds', 'features', 'limitations']) {
      expect(html).toContain(`<section id="${id}"`)
    }
    expect(html).toContain('aria-label="On this page"')
    expect(html.match(/aria-current="location"/g)).toHaveLength(1)
  })

  it('shows what the API sends: name, version, estimator, features and limitations', () => {
    const html = render()
    for (const text of ['Test classifier', 'xgb-test-v9', 'XGBClassifier', 'errorbalanceDest', 'Trained on synthetic data.']) {
      expect(html).toContain(text)
    }
    expect(html).toContain('6,362,620')
    expect(html).toContain('2,237,500')
  })

  it('reads the metrics cut-off from the API key instead of assuming 0.5', () => {
    const html = render()
    expect(html).toContain('fraud class at 0.7')
    expect(html).not.toContain('fraud class at 0.5')
    expect(html).toContain('0.9926')
  })

  it('reports only the notebook metrics, never ROC-AUC', () => {
    expect(render()).not.toMatch(/ROC/i)
  })

  it('builds the threshold table from the API level texts', () => {
    const html = render()
    expect(html).toContain('probability &lt; 0.2')
    expect(html).toContain('0.2 &lt;= probability &lt; 0.5')
    expect(html).toContain('Send to manual review')
    expect(html).toContain('Flag for fraud')
  })

  it('renders backticked words as code', () => {
    const html = render()
    expect(html).toContain('<code')
    expect(html).not.toContain('`')
  })

  it('shows an offline state, an error state and a loading state instead of the document', () => {
    expect(render({ online: false, info: null })).toContain('Backend offline')
    expect(render({ error: 'boom', info: null })).toContain('Could not load the model card')
    expect(render({ info: null })).not.toContain('<section id="overview"')
  })
})
