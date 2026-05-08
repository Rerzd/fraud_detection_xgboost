const typeNames = { 0: '💸 Transfer', 1: '💵 Cash out', 2: '📥 Cash in', 3: '💳 Debit', 4: '✅ Payment' }

const getStyle = (prob) => {
  if (prob < 0.4) return { bg: '#134E2B', color: '#86EFAC', label: 'Legitimate transaction', value: 'LOW RISK', bar: '#16A34A' }
  if (prob < 0.7) return { bg: '#713F12', color: '#FCD34D', label: 'Manual review required', value: 'MEDIUM RISK', bar: '#EA580C' }
  return { bg: '#7F1D1D', color: '#FCA5A5', label: 'Fraud detected', value: 'HIGH RISK', bar: '#DC2626' }
}

const SkeletonResult = () => (
  <div style={{ background: '#12243D', border: '1px solid #1E3A5F', borderRadius: 12, padding: 20, minHeight: 300 }}>
    <div style={{ height: 14, width: '30%', background: '#1E3A5F', borderRadius: 4, marginBottom: 16 }} />
    <div style={{ height: 60, background: '#1E3A5F', borderRadius: 10, marginBottom: 16 }} />
    <div style={{ height: 8, background: '#1E3A5F', borderRadius: 999, marginBottom: 16 }} />
    <div style={{ height: 14, width: '40%', background: '#1E3A5F', borderRadius: 4, marginBottom: 10 }} />
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{ height: 50, background: '#1E3A5F', borderRadius: 8 }} />
      ))}
    </div>
  </div>
)

const ResultPanel = ({ result, formData }) => {
  if (!result) return (
    <div style={{ background: '#12243D', border: '1px solid #1E3A5F', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, color: '#64748B', fontSize: 14, gap: 10 }}>
      <span style={{ fontSize: 32 }}>🔍</span>
      <span>Enter transaction details and click analyze</span>
    </div>
  )

  const s = getStyle(result.probability)
  const pct = (result.probability * 100).toFixed(1)
  const fmt = (n) => n?.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

  return (
    <div style={{ background: '#12243D', border: '1px solid #1E3A5F', borderRadius: 12, padding: 20 }}>
      <p style={{ fontSize: 11, fontWeight: 500, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Analysis result</p>

      <div style={{ background: s.bg, borderRadius: 10, padding: '16px 20px', textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: s.color, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
        <div style={{ fontSize: 22, fontWeight: 500, color: s.color }}>{s.value}</div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
          <span style={{ color: '#94A3B8' }}>Fraud probability</span>
          <span style={{ fontWeight: 500, color: '#F1F5F9' }}>{pct}%</span>
        </div>
        <div style={{ height: 12, background: '#1E3A5F', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            background: `linear-gradient(45deg, ${s.bar} 25%, ${s.bar}DD 25%, ${s.bar}DD 50%, ${s.bar} 50%, ${s.bar} 75%, ${s.bar}DD 75%)`,
            backgroundSize: '20px 20px',
            borderRadius: 999,
            animation: 'stripes 0.5s linear infinite',
            boxShadow: `0 0 10px ${s.bar}80`,
            transition: 'width 0.6s ease'
          }} />
        </div>
      </div>

      <p style={{ fontSize: 11, fontWeight: 500, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Transaction summary</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          ['Amount', fmt(formData?.amount)],
          ['Type', typeNames[formData?.type]],
          ['Sender change', fmt(formData?.newbalanceOrig - formData?.oldbalanceOrg)],
          ['Recipient change', fmt(formData?.newbalanceDest - formData?.oldbalanceDest)],
        ].map(([label, value]) => (
          <div key={label} style={{ background: '#1E3A5F', borderRadius: 8, padding: '8px 10px', transition: 'transform 0.2s ease', cursor: 'default' }}>
            <div style={{ fontSize: 11, color: '#64748B', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#F1F5F9' }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ResultPanel