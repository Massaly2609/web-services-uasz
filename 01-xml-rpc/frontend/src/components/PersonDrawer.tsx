import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Code, X } from 'lucide-react'
import { buildMethodCall } from '../api/xmlrpc'
import { highlightXml } from '../lib/highlight'
import {
  emptyPersonne,
  fullName,
  normalizePersonne,
  validatePersonne,
  type FieldErrors,
} from '../lib/format'
import { useData } from '../state'
import type { Personne, PersonneInput } from '../types'
import { Avatar, Spinner } from './ui'

interface Props {
  open: boolean
  person: Personne | null
  onClose: () => void
}

const FIELDS: { key: keyof PersonneInput; label: string; type?: string; placeholder: string; wide?: boolean }[] = [
  { key: 'prenom', label: 'Prénom', placeholder: 'Amadou' },
  { key: 'nom', label: 'Nom', placeholder: 'DIOP' },
  { key: 'dateNaissance', label: 'Date de naissance', type: 'date', placeholder: '' },
  { key: 'telephone', label: 'Téléphone', type: 'tel', placeholder: '77 123 45 67' },
  { key: 'adresse', label: 'Adresse', placeholder: 'Ziguinchor', wide: true },
]

export default function PersonDrawer({ open, person, onClose }: Props) {
  const { add, update } = useData()
  const [form, setForm] = useState<PersonneInput>(emptyPersonne)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [touched, setTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const firstInput = useRef<HTMLInputElement>(null)
  const editing = person !== null

  // Réinitialise le formulaire à chaque ouverture
  useEffect(() => {
    if (!open) return
    setForm(person ? { ...person } : emptyPersonne())
    setErrors({})
    setTouched(false)
    const t = window.setTimeout(() => firstInput.current?.focus(), 180)
    return () => window.clearTimeout(t)
  }, [open, person])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !saving && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, saving])

  const set = (key: keyof PersonneInput, value: string) => {
    const next = { ...form, [key]: value }
    setForm(next)
    if (touched) setErrors(validatePersonne(next))
  }

  const preview = useMemo(() => {
    const p = normalizePersonne(form)
    const args = [p.nom, p.prenom, p.dateNaissance, p.adresse, p.telephone]
    return editing
      ? buildMethodCall('Personne.modifier', [person.id, ...args])
      : buildMethodCall('Personne.ajouter', args)
  }, [form, editing, person])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    const errs = validatePersonne(form)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    setSaving(true)
    try {
      const data = normalizePersonne(form)
      if (editing) await update(person.id, data)
      else await add(data)
      onClose()
    } catch {
      /* le toast d'erreur est déjà affiché, on garde le tiroir ouvert */
    } finally {
      setSaving(false)
    }
  }

  const displayName = form.prenom || form.nom ? fullName(form) : editing ? fullName(person) : 'Nouvelle personne'

  return (
    <div className={`drawer-root ${open ? 'is-open' : ''}`} aria-hidden={!open}>
      <div className="overlay" onClick={() => !saving && onClose()} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={editing ? 'Modifier la fiche' : 'Nouvelle personne'}>
        <header className="drawer-head">
          <div className="drawer-id">
            <Avatar person={form.nom || form.prenom ? form : { nom: '+', prenom: '' }} size={44} />
            <div>
              <div className="eyebrow">{editing ? `Personne.modifier · #${person.id}` : 'Personne.ajouter'}</div>
              <h2 className="drawer-title">{displayName}</h2>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Fermer" disabled={saving}>
            <X size={18} />
          </button>
        </header>

        <form className="drawer-body" onSubmit={submit} noValidate>
          <div className="form-grid">
            {FIELDS.map((f, i) => (
              <label key={f.key} className={`field ${f.wide ? 'is-wide' : ''} ${errors[f.key] ? 'has-error' : ''}`}>
                <span className="field-label">{f.label}</span>
                <input
                  ref={i === 0 ? firstInput : undefined}
                  type={f.type ?? 'text'}
                  value={form[f.key]}
                  placeholder={f.placeholder}
                  max={f.type === 'date' ? new Date().toISOString().slice(0, 10) : undefined}
                  onChange={(e) => set(f.key, e.target.value)}
                  autoComplete="off"
                />
                {errors[f.key] && <span className="field-error">{errors[f.key]}</span>}
              </label>
            ))}
          </div>

          <details className="xml-preview">
            <summary>
              <Code size={15} />
              Aperçu de la requête XML envoyée
            </summary>
            <pre className="code-body">
              <code dangerouslySetInnerHTML={{ __html: highlightXml(preview) }} />
            </pre>
          </details>

          <footer className="drawer-foot">
            <button type="button" className="btn ghost" onClick={onClose} disabled={saving}>
              Annuler
            </button>
            <button type="submit" className="btn primary" disabled={saving}>
              {saving && <Spinner size={14} />}
              {editing ? 'Enregistrer les modifications' : 'Ajouter la personne'}
            </button>
          </footer>
        </form>
      </aside>
    </div>
  )
}
