const typeOptions = [
  { value: 0, label: '💸 Transfer' },
  { value: 1, label: '💵 Cash out' },
  { value: 2, label: '📥 Cash in' },
  { value: 3, label: '💳 Debit' },
  { value: 4, label: '✅ Payment' },
]

const fieldLabels = {
  step: 'Transaction step (time unit)',
  type: 'Transaction type',
  amount: 'Amount ($)',
  oldbalanceOrg: "Sender's current balance",
  newbalanceOrig: "Sender's balance after transaction",
  oldbalanceDest: "Recipient's current balance",
  newbalanceDest: "Recipient's balance after transaction",
  errorbalanceOrig: "Sender's account discrepancy",
  errorbalanceDest: "Recipient's account discrepancy",
}

const inputDefaults = {
  step: 0,
  type: 0,
  amount: 0,
  oldbalanceOrg: 0,
  newbalanceOrig: 0,
  oldbalanceDest: 0,
  newbalanceDest: 0,
  errorbalanceDest: 0,
  errorbalanceOrig: 0,
}

const SkeletonInput = () => (
  <div style={{ height: 44, background: 'rgba(30, 58, 95, 0.3)', borderRadius: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />
)

const SkeletonForm = () => (
  <div style={{ background: '#12243D', border: '1px solid #1E3A5F', borderRadius: 12, padding: 24 }}>
    <div style={{ marginBottom: 24 }}>
      <div style={{ height: 28, width: '70%', background: '#1E3A5F', borderRadius: 6, marginBottom: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ height: 14, width: '100%', background: '#1E3A5F', borderRadius: 6, marginBottom: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ height: 14, width: '85%', background: '#1E3A5F', borderRadius: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />
    </div>
    <SkeletonInput />
    <div style={{ height: 12 }} />
    <SkeletonInput />
    <div style={{ height: 12 }} />
    <SkeletonInput />
    <div style={{ height: 16 }} />
    <div style={{ height: 14, width: '30%', background: '#1E3A5F', borderRadius: 6, marginBottom: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />
    <SkeletonInput />
    <div style={{ height: 12 }} />
    <SkeletonInput />
    <div style={{ height: 12 }} />
    <SkeletonInput />
    <div style={{ height: 16 }} />
    <div style={{ height: 14, width: '30%', background: '#1E3A5F', borderRadius: 6, marginBottom: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />
    <SkeletonInput />
    <div style={{ height: 12 }} />
    <SkeletonInput />
    <div style={{ height: 12 }} />
    <SkeletonInput />
    <div style={{ height: 20 }} />
    <div style={{ height: 48, background: '#1E3A5F', borderRadius: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />
  </div>
)

const TransactionForm = ({ onSubmit, loading }) => {
  const handleSubmit = (e) => {
    e.preventDefault()
    const f = e.target
    onSubmit({
      step: parseInt(f.step.value),
      type: parseInt(f.type.value),
      amount: parseFloat(f.amount.value),
      oldbalanceOrg: parseFloat(f.oldbalanceOrg.value),
      newbalanceOrig: parseFloat(f.newbalanceOrig.value),
      oldbalanceDest: parseFloat(f.oldbalanceDest.value),
      newbalanceDest: parseFloat(f.newbalanceDest.value),
      errorbalanceDest: parseFloat(f.errorbalanceDest.value),
      errorbalanceOrig: parseFloat(f.errorbalanceOrig.value),
    })
  }

  if (loading) {
    return <SkeletonForm />
  }

  return (
    <div style={{ background: '#12243D', border: '1px solid #1E3A5F', borderRadius: 12, padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontSize: 26,
          fontWeight: 600,
          color: '#F1F5F9',
          marginBottom: 10,
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          letterSpacing: '-0.02em',
          lineHeight: 1.3
        }}>
          Welcome to the fraud detection system
        </h1>
        <p style={{
          fontSize: 14,
          color: '#94A3B8',
          lineHeight: 1.6,
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
        }}>
          This page was made in order to help you analyze if an operation is fraudulent or not given certain details. Please submit the result of each option and click analyze transaction
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ fontSize: 13, color: '#94A3B8', display: 'block', marginBottom: 6, fontFamily: 'Inter, system-ui, sans-serif' }}>{fieldLabels.type}</label>
          <select name="type" defaultValue={0} style={selectStyle}>
            {typeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 13, color: '#94A3B8', display: 'block', marginBottom: 6, fontFamily: 'Inter, system-ui, sans-serif' }}>{fieldLabels.step}</label>
          <input name="step" type="number" defaultValue={inputDefaults.step} style={inputStyle} />
        </div>

        <div>
          <label style={{ fontSize: 13, color: '#94A3B8', display: 'block', marginBottom: 6, fontFamily: 'Inter, system-ui, sans-serif' }}>{fieldLabels.amount}</label>
          <input name="amount" type="number" defaultValue={inputDefaults.amount} style={inputStyle} />
        </div>

        <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 8, marginBottom: 4, fontFamily: 'Inter, system-ui, sans-serif' }}>
          Sender Details
        </div>

        <div>
          <label style={{ fontSize: 13, color: '#94A3B8', display: 'block', marginBottom: 6, fontFamily: 'Inter, system-ui, sans-serif' }}>{fieldLabels.oldbalanceOrg}</label>
          <input name="oldbalanceOrg" type="number" defaultValue={inputDefaults.oldbalanceOrg} style={inputStyle} />
        </div>

        <div>
          <label style={{ fontSize: 13, color: '#94A3B8', display: 'block', marginBottom: 6, fontFamily: 'Inter, system-ui, sans-serif' }}>{fieldLabels.newbalanceOrig}</label>
          <input name="newbalanceOrig" type="number" defaultValue={inputDefaults.newbalanceOrig} style={inputStyle} />
        </div>

        <div>
          <label style={{ fontSize: 13, color: '#94A3B8', display: 'block', marginBottom: 6, fontFamily: 'Inter, system-ui, sans-serif' }}>{fieldLabels.errorbalanceOrig}</label>
          <input name="errorbalanceOrig" type="number" defaultValue={inputDefaults.errorbalanceOrig} style={inputStyle} />
        </div>

        <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 8, marginBottom: 4, fontFamily: 'Inter, system-ui, sans-serif' }}>
          Recipient Details
        </div>

        <div>
          <label style={{ fontSize: 13, color: '#94A3B8', display: 'block', marginBottom: 6, fontFamily: 'Inter, system-ui, sans-serif' }}>{fieldLabels.oldbalanceDest}</label>
          <input name="oldbalanceDest" type="number" defaultValue={inputDefaults.oldbalanceDest} style={inputStyle} />
        </div>

        <div>
          <label style={{ fontSize: 13, color: '#94A3B8', display: 'block', marginBottom: 6, fontFamily: 'Inter, system-ui, sans-serif' }}>{fieldLabels.newbalanceDest}</label>
          <input name="newbalanceDest" type="number" defaultValue={inputDefaults.newbalanceDest} style={inputStyle} />
        </div>

        <div>
          <label style={{ fontSize: 13, color: '#94A3B8', display: 'block', marginBottom: 6, fontFamily: 'Inter, system-ui, sans-serif' }}>{fieldLabels.errorbalanceDest}</label>
          <input name="errorbalanceDest" type="number" defaultValue={inputDefaults.errorbalanceDest} style={inputStyle} />
        </div>

        <button type="submit" disabled={loading} style={{
          width: '100%',
          padding: '14px',
          fontSize: 15,
          fontWeight: 600,
          background: loading ? '#1E3A5F' : '#2563EB',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          cursor: loading ? 'not-allowed' : 'pointer',
          marginTop: 12,
          transition: 'all 0.2s ease',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          letterSpacing: '0.02em'
        }}>
          {loading ? 'Analyzing...' : 'Analyze transaction'}
        </button>
      </form>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  fontSize: 14,
  border: 'none',
  borderRadius: 6,
  background: 'rgba(30, 58, 95, 0.3)',
  color: '#F1F5F9',
  outline: 'none',
  transition: 'all 0.2s ease',
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
}

const selectStyle = {
  width: '100%',
  padding: '12px 14px',
  fontSize: 14,
  border: 'none',
  borderRadius: 6,
  background: 'rgba(30, 58, 95, 0.5)',
  color: '#F1F5F9',
  outline: 'none',
  transition: 'all 0.2s ease',
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  cursor: 'pointer',
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394A3B8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  backgroundSize: '12px',
}

export default TransactionForm