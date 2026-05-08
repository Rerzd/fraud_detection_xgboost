import { useState, useEffect } from 'react'
import Header from './components/Header'
import TransactionForm from './components/TransactionForm'
import ResultPanel from './components/ResultPanel'

const styles = `
  @keyframes stripes {
    0% { background-position: 0 0; }
    100% { background-position: 20px 0; }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  input[type="number"]::-webkit-inner-spin-button,
  input[type="number"]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  input[type="number"] {
    -moz-appearance: textfield;
  }
`

function App() {
  const [status, setStatus] = useState('checking')
  const [result, setResult] = useState(null)
  const [formData, setFormData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('http://127.0.0.1:8000/health')
      .then(r => r.json())
      .then(() => setStatus('online'))
      .catch(() => setStatus('offline'))
  }, [])

  const handleSubmit = async (data) => {
    setLoading(true)
    setFormData(data)
    try {
      const r = await fetch('http://127.0.0.1:8000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const json = await r.json()
      setResult(json)
    } catch {
      alert('Could not connect to backend. Make sure uvicorn is running.')
    }
    setLoading(false)
  }

  return (
    <>
      <style>{styles}</style>
      <div style={{ background: '#0A1628', minHeight: '100vh' }}>
        <Header status={status} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '20px 24px', maxWidth: 600, margin: '0 auto' }}>
          <TransactionForm onSubmit={handleSubmit} loading={loading} />
          <ResultPanel result={result} formData={formData} />
        </div>
      </div>
    </>
  )
}

export default App
