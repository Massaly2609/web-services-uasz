import { CircleCheck, CircleX, Info, X } from 'lucide-react'
import { useToasts } from '../state'

const ICONS = { success: CircleCheck, error: CircleX, info: Info }

export default function Toaster() {
  const { toasts, dismiss } = useToasts()
  return (
    <div className="toaster" role="status" aria-live="polite">
      {toasts.map((t) => {
        const Icon = ICONS[t.kind]
        return (
          <div key={t.id} className={`toast is-${t.kind}`}>
            <Icon size={18} className="toast-icon" />
            <div className="toast-body">
              <div className="toast-title">{t.title}</div>
              {t.detail && <div className="toast-detail">{t.detail}</div>}
            </div>
            <button className="toast-close" onClick={() => dismiss(t.id)} aria-label="Fermer">
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
