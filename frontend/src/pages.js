// Pages of the app, in navigation order. The id is also the URL hash.

export const PAGES = [
  {
    id: 'analyze',
    group: 'Scoring',
    label: 'Single transaction',
    icon: 'pulse',
    description: 'Score one transaction and see which features drove the result.',
  },
  {
    id: 'batch',
    group: 'Scoring',
    label: 'Batch run',
    icon: 'layers',
    description: 'Score a CSV of raw transactions and export the results.',
  },
  {
    id: 'history',
    group: 'Records',
    label: 'Audit log',
    icon: 'clock',
    description: 'Every prediction stored by the API, newest first.',
  },
  {
    id: 'model',
    group: 'Model',
    label: 'Model card',
    icon: 'cpu',
    description: 'How the model was trained, how it was evaluated and where not to trust it.',
  },
]

export const PAGE_GROUPS = [...new Set(PAGES.map((p) => p.group))]

export const pageById = (id) => PAGES.find((p) => p.id === id)

/** Page for a location hash such as "#batch"; unknown hashes open the first page. */
export function pageFromHash(hash) {
  return pageById(hash.replace(/^#/, ''))?.id ?? PAGES[0].id
}
