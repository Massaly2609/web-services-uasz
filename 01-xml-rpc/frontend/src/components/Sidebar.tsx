import { LayoutDashboard, Moon, RefreshCw, Search, Sun, Terminal, Users } from 'lucide-react'
import { useRpcCalls } from '../api/inspector'
import { useData } from '../state'
import type { PageId } from '../types'

interface Props {
  page: PageId
  onNavigate: (p: PageId) => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

export default function Sidebar({ page, onNavigate, theme, onToggleTheme }: Props) {
  const { persons, online, refresh, loading } = useData()
  const calls = useRpcCalls()

  const items: { id: PageId; label: string; icon: typeof Users; badge?: number }[] = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'annuaire', label: 'Annuaire', icon: Users, badge: persons.length },
    { id: 'recherche', label: 'Recherche par ID', icon: Search },
    { id: 'console', label: 'Console XML', icon: Terminal, badge: calls.length },
  ]

  const status = online === null ? 'checking' : online ? 'online' : 'offline'
  const statusLabel = { checking: 'Connexion…', online: 'Serveur connecté', offline: 'Serveur hors ligne' }[status]

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark" aria-hidden>
          <span>&lt;/&gt;</span>
        </div>
        <div>
          <div className="brand-name">Registre</div>
          <div className="brand-sub">XML-RPC · Personnes</div>
        </div>
      </div>

      <nav className="nav" aria-label="Navigation principale">
        <div className="nav-label">Espace de travail</div>
        {items.map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            className={`nav-item ${page === id ? 'is-active' : ''}`}
            onClick={() => onNavigate(id)}
            aria-current={page === id ? 'page' : undefined}
          >
            <Icon size={18} strokeWidth={1.8} />
            <span>{label}</span>
            {badge !== undefined && badge > 0 && <span className="nav-badge">{badge}</span>}
          </button>
        ))}
      </nav>

      <div className="sidebar-foot">
        <div className={`server-card is-${status}`}>
          <div className="server-row">
            <span className="status-dot" />
            <span className="server-status">{statusLabel}</span>
            <button
              className="icon-btn sm"
              onClick={() => void refresh()}
              title="Relancer Personne.lister"
              aria-label="Reconnecter"
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
            </button>
          </div>
          <div className="server-meta">
            <code>POST /RPC2 → localhost:8081</code>
            <span>Apache XML-RPC 3.1.3 · Spring Boot</span>
          </div>
        </div>
        <button className="theme-toggle" onClick={onToggleTheme}>
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          <span>{theme === 'light' ? 'Thème sombre' : 'Thème clair'}</span>
        </button>
      </div>
    </aside>
  )
}
