const Header = ({ status }) => {
  return (
    <header style={{
      background: 'var(--color-background-primary, white)',
      borderBottom: '1px solid #E5E7EB',
      padding: '14px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 500 }}>Transaction Analyzer</div>
          <div style={{ fontSize: 12, color: '#6B7280' }}>Fraud Detection System</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: status === 'online' ? '#16A34A' : '#DC2626'
        }} />
        <span style={{ fontSize: 12, color: '#6B7280' }}>
          {status === 'online' ? 'System online' : 'Backend offline'}
        </span>
      </div>
    </header>
  )
}

export default Header