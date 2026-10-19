import { formatAmount } from '../../lib/format'
import { Table, Td, Th, Tr } from '../ui/DataTable'
import Tag from '../ui/Tag'

const DERIVED = new Set(['errorbalanceDest', 'errorbalanceOrig'])

/** What happened to a feature on its way to the model: encoded, derived, or changed by a sentinel rule. */
function describe(feature, value, raw) {
  if (feature === 'type') return { text: 'encoded' }
  if (DERIVED.has(feature)) return { text: 'derived' }
  if (raw && feature in raw && value !== raw[feature]) {
    return { text: value === null ? 'set to NaN' : `set to ${value}`, sentinel: true }
  }
  return { text: '' }
}

function display(feature, value) {
  if (value === null) return 'NaN'
  if (feature === 'step' || feature === 'type') return String(value)
  return formatAmount(value)
}

/** The 9 inputs the model received, with values changed by the sentinel rules highlighted. */
export default function FeaturesTable({ features, raw }) {
  return (
    <div>
      <Table minWidth="18rem">
        <thead>
          <tr>
            <Th>Feature</Th>
            <Th align="right">Model input</Th>
            <Th className="hidden md:table-cell">Note</Th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(features).map(([feature, value]) => {
            const note = describe(feature, value, raw)
            const noteContent = (
              <>
                {note.sentinel && (
                  <Tag tone="review" className="mr-2">
                    sentinel
                  </Tag>
                )}
                {note.text}
              </>
            )
            return (
              <Tr key={feature} tone={note.sentinel ? 'warning' : undefined}>
                <Td mono>
                  {feature}
                  {/* Narrow screens fold the note under the name instead of its own column. */}
                  {note.text && <span className="mt-0.5 block font-sans text-xs text-ink-muted md:hidden">{noteContent}</span>}
                </Td>
                <Td numeric>{display(feature, value)}</Td>
                <Td className="hidden text-ink-muted md:table-cell">{noteContent}</Td>
              </Tr>
            )
          })}
        </tbody>
      </Table>
      <p className="mt-3 text-xs leading-relaxed text-ink-muted">
        Rules from training: destination balances 0/0 with a non-zero amount become -1; origin balances 0/0 become
        NaN. The error balances are computed afterwards.
      </p>
    </div>
  )
}
