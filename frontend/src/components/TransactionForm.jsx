const typeOptions = [
  { value: 0, label: 'Transfer' },
  { value: 1, label: 'Cash out' },
  { value: 2, label: 'Cash in' },
  { value: 3, label: 'Debit' },
  { value: 4, label: 'Payment' },
]

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

  return (
    <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20 }}>
      <p style={{ fontSize: 11, fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Transaction details</p>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 4 }}>Type</label>
            <select name="type" style={inputStyle}>
              {typeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 4 }}>Step</label>
            <input name="step" type="number" defaultValue={459} style={inputStyle} />
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 4 }}>Amount ($)</label>
          <input name="amount" type="number" defaultValue={1153156} style={inputStyle} />
        </div>

        {[
          ['oldbalanceOrg', 'Origin old balance', 1153156],
          ['newbalanceOrig', 'Origin new balance', 0],
          ['oldbalanceDest', 'Dest. old balance', -1],
          ['newbalanceDest', 'Dest. new balance', -1],
          ['errorbalanceDest', 'Error balance dest.', 1153156],
          ['errorbalanceOrig', 'Error balance orig.', 0],
        ].reduce((rows, item, i) => {
          if (i % 2 === 0) rows.push([item])
          else rows[rows.length - 1].push(item)
          return rows
        }, []).map((row, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            {row.map(([name, label, def]) => (
              <div key={name}>
                <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 4 }}>{label}</label>
                <input name={name} type="number" defaultValue={def} style={inputStyle} />
              </div>
            ))}
          </div>
        ))}

        <button type="submit" disabled={loading} style={{
          width: '100%', padding: '10px', fontSize: 14, fontWeight: 500,
          background: loading ? '#9CA3AF' : '#1A3C6E',
          color: 'white', border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4
        }}>
          {loading ? 'Analyzing...' : 'Analyze transaction'}
        </button>
      </form>
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '8px 10px', fontSize: 14,
  border: '1px solid #D1D5DB', borderRadius: 8,
  background: '#F9FAFB', color: '#111827'
}

export default TransactionForm