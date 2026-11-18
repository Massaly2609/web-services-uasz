import './Sidebar.css';

function Sidebar({ currentPage, onNavigate, serverConnected, onReconnect }) {
  const navItems = [
    { id: 'dashboard', icon: '📊', label: 'Tableau de bord' },
    { id: 'list', icon: '👤', label: 'Liste des personnes' },
    { id: 'add', icon: '➕', label: 'Ajouter une personne' },
    { id: 'search', icon: '🔍', label: 'Rechercher' },
  ];

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">🌐</span>
          <span className="logo-text">XML-RPC</span>
        </div>
        <p className="subtitle">Gestion des Personnes</p>
      </div>

      <div className="nav-links">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-btn ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="server-status">
          <span className={`status-dot ${serverConnected ? 'connected' : 'disconnected'}`} />
          <span>{serverConnected ? 'Connecté' : 'Déconnecté'}</span>
          {!serverConnected && (
            <button className="reconnect-btn" onClick={onReconnect}>
              Reconnecter
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Sidebar;
