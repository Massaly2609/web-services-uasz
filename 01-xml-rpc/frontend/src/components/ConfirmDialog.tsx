import { useEffect } from 'react'
import { Trash } from 'lucide-react'
import { fullName } from '../lib/format'
import type { Personne } from '../types'
import { Spinner } from './ui'

interface Props {
  person: Personne | null
  busy: boolean
  onCancel: () => void
  onConfirm: () => void
}

export default function ConfirmDialog({ person, busy, onCancel, onConfirm }: Props) {
  useEffect(() => {
    if (!person) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onCancel()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [person, busy, onCancel])

  if (!person) return null
  return (
    <div className="modal-root">
      <div className="overlay is-visible" onClick={() => !busy && onCancel()} />
      <div className="modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
        <div className="modal-icon">
          <Trash size={20} />
        </div>
        <h2 id="confirm-title" className="modal-title">
          Supprimer {fullName(person)} ?
        </h2>
        <p className="modal-text">
          La fiche <strong>#{person.id}</strong> sera définitivement retirée de la base H2 via{' '}
          <code>Personne.supprimer({person.id})</code>.
        </p>
        <div className="modal-actions">
          <button className="btn ghost" onClick={onCancel} disabled={busy} autoFocus>
            Annuler
          </button>
          <button className="btn danger" onClick={onConfirm} disabled={busy}>
            {busy && <Spinner size={14} />}
            Supprimer
          </button>
        </div>
      </div>
    </div>
  )
}
