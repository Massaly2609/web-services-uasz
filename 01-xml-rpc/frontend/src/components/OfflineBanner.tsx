import { RefreshCw, WifiOff } from 'lucide-react'
import { useData } from '../state'

export default function OfflineBanner() {
  const { online, refresh, loading } = useData()
  if (online !== false) return null
  return (
    <div className="offline-banner" role="alert">
      <WifiOff size={18} />
      <div>
        <strong>Le serveur XML-RPC ne répond pas.</strong>
        <span>
          Démarrez le backend Spring Boot (<code>XmlRpcApplication</code>) : il ouvre le port 8081.
        </span>
      </div>
      <button className="btn sm" onClick={() => void refresh()} disabled={loading}>
        <RefreshCw size={14} className={loading ? 'spin' : ''} />
        Réessayer
      </button>
    </div>
  )
}
