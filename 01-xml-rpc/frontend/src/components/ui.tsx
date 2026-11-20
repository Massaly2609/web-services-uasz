import { useState, type ReactNode } from 'react'
import { Check, Copy } from 'lucide-react'
import { highlightJson, highlightXml } from '../lib/highlight'
import { hueOf, initials } from '../lib/format'
import type { Personne } from '../types'

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string
  title: string
  description?: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="page-header">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1 className="page-title">{title}</h1>
        {description && <p className="page-desc">{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  )
}

export function Avatar({ person, size = 36 }: { person: Pick<Personne, 'nom' | 'prenom'>; size?: number }) {
  const hue = hueOf(person.nom + person.prenom)
  return (
    <span
      className="avatar"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        ['--h' as string]: hue,
      }}
      aria-hidden
    >
      {initials(person)}
    </span>
  )
}

export function CopyButton({ text, label = 'Copier' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      className="code-btn"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setDone(true)
          window.setTimeout(() => setDone(false), 1500)
        } catch {
          /* presse-papiers indisponible */
        }
      }}
    >
      {done ? <Check size={13} /> : <Copy size={13} />}
      {done ? 'Copié' : label}
    </button>
  )
}

export function CodeBlock({
  title,
  code,
  lang = 'xml',
  meta,
  empty = 'Aucun contenu',
}: {
  title: string
  code: string | null
  lang?: 'xml' | 'json'
  meta?: ReactNode
  empty?: string
}) {
  const html =
    code === null ? null : lang === 'xml' ? highlightXml(code) : highlightJson(JSON.parse(code))
  return (
    <div className="code-block">
      <div className="code-head">
        <span className="code-title">{title}</span>
        {meta && <span className="code-meta">{meta}</span>}
        {code !== null && <CopyButton text={code} />}
      </div>
      {html === null ? (
        <div className="code-empty">{empty}</div>
      ) : (
        <pre className="code-body">
          <code dangerouslySetInnerHTML={{ __html: html }} />
        </pre>
      )}
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon: ReactNode
  title: string
  children?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      {children && <p className="empty-text">{children}</p>}
      {action}
    </div>
  )
}

export function Spinner({ size = 16 }: { size?: number }) {
  return <span className="spinner" style={{ width: size, height: size }} aria-label="Chargement" />
}
