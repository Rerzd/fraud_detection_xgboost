const Header = ({ status }) => {
  return (
    <header style={{
      background: '#12243D',
      borderBottom: '1px solid #1E3A5F',
      padding: '14px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 500, color: '#F1F5F9' }}>Transaction Analyzer</div>
          <div style={{ fontSize: 12, color: '#94A3B8' }}>Fraud Detection System</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: status === 'online' ? '#16A34A' : '#DC2626',
          boxShadow: status === 'online' ? '0 0 8px #16A34A' : '0 0 8px #DC2626'
        }} />
        <span style={{ fontSize: 12, color: '#94A3B8' }}>
          {status === 'online' ? 'System online' : 'Backend offline'}
        </span>
      </div>
    </header>
  )
}

export default Header