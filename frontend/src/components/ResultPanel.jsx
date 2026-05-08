const typeNames = { 0: 'Transfer', 1: 'Cash out', 2: 'Cash in', 3: 'Debit', 4: 'Payment' }

const getStyle = (prob) => {
  if (prob < 0.4) return { bg: '#EAF3DE', color: '#27500A', label: 'Legitimate transaction', value: 'LOW RISK', bar: '#16A34A' }
  if (prob < 0.7) return { bg: '#FAEEDA', color: '#633806', label: 'Manual review required', value: 'MEDIUM RISK', bar: '#EA580C' }
  return { bg: '#FCEBEB', color: '#501313', label: 'Fraud detected', value: 'HIGH RISK', bar: '#DC2626' }
}

const ResultPanel = ({ result, formData }) => {
  if (!result) return (
    <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, color: '#9CA3AF', fontSize: 14, gap: 10 }}>
      <span style={{ fontSize: 32 }}>🔍</span>
      <span>Enter transaction details and click analyze</span>
    </div>
  )

  const s = getStyle(result.probability)
  const pct = (result.probability * 100).toFixed(1)
  const fmt = (n) => n?.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

  return (
    <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20 }}>
      <p style={{ fontSize: 11, fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Analysis result</p>

      <div style={{ background: s.bg, borderRadius: 10, padding: '16px 20px', textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: s.color, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
        <div style={{ fontSize: 22, fontWeight: 500, color: s.color }}>{s.value}</div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
          <span style={{ color: '#6B7280' }}>Fraud probability</span>
          <span style={{ fontWeight: 500 }}>{pct}%</span>
        </div>
        <div style={{ height: 8, background: '#F3F4F6', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: s.bar, borderRadius: 999, transition: 'width 0.5s ease' }} />
        </div>
      </div>

      <p style={{ fontSize: 11, fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Transaction summary</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          ['Amount', fmt(formData?.amount)],
          ['Type', typeNames[formData?.type]],
          ['Origin change', fmt(formData?.newbalanceOrig - formData?.oldbalanceOrg)],
          ['Dest. change', fmt(formData?.newbalanceDest - formData?.oldbalanceDest)],
        ].map(([label, value]) => (
          <div key={label} style={{ background: '#F9FAFB', borderRadius: 8, padding: '8px 10px' }}>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ResultPanel