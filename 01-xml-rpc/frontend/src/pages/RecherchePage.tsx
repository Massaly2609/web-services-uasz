import { useState, type FormEvent } from 'react'
import { Calendar, Hash, MapPin, Pencil, Phone, Search, Trash, UserX } from 'lucide-react'
import { useRpcCalls } from '../api/inspector'
import { PersonneService } from '../api/personneService'
import { formatXml } from '../api/xmlrpc'
import { Avatar, CodeBlock, EmptyState, PageHeader, Spinner } from '../components/ui'
import { ageOf, formatDate, formatPhone, fullName } from '../lib/format'
import { describeError, useData, useToasts, useUi } from '../state'
import type { Personne } from '../types'

type Result = { state: 'idle' } | { state: 'found'; person: Personne } | { state: 'missing'; id: number }

export default function RecherchePage() {
  const { persons } = useData()
  const { openEdit, askDelete } = useUi()
  const { notify } = useToasts()
  const calls = useRpcCalls()
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<Result>({ state: 'idle' })
  const [searched, setSearched] = useState(false)

  const run = async (id: number) => {
    setValue(String(id))
    setBusy(true)
    try {
      const p = await PersonneService.rechercher(id)
      setResult(p ? { state: 'found', person: p } : { state: 'missing', id })
    } catch (err) {
      notify('error', 'Recherche impossible', describeError(err))
      setResult({ state: 'idle' })
    } finally {
      setBusy(false)
      setSearched(true)
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const id = Number.parseInt(value, 10)
    if (!Number.isInteger(id) || id <= 0) {
      notify('info', 'Identifiant invalide', 'Saisissez un entier positif, par exemple 1.')
      return
    }
    void run(id)
  }

  // Dernier appel Personne.rechercher (le journal est trié du plus récent au plus ancien)
  const lastCall = searched ? calls.find((c) => c.method === 'Personne.rechercher') : undefined
  const shortcuts = [...persons].sort((a, b) => a.id - b.id).slice(0, 8)

  return (
    <div className="page">
      <PageHeader
        eyebrow="Recherche"
        title="Trouver une fiche par identifiant"
        description="Appelle Personne.rechercher(int id). Le serveur renvoie une struct vide si l’identifiant est inconnu."
      />

      <form className="lookup card" onSubmit={submit}>
        <div className="lookup-field">
          <Hash size={20} />
          <input
            inputMode="numeric"
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/\D/g, ''))}
            placeholder="Identifiant, ex. 1"
            aria-label="Identifiant de la personne"
            autoFocus
          />
          <button className="btn primary" disabled={busy || !value}>
            {busy ? <Spinner size={14} /> : <Search size={16} />} Rechercher
          </button>
        </div>
        {shortcuts.length > 0 && (
          <div className="chips">
            <span className="muted small">Identifiants existants :</span>
            {shortcuts.map((p) => (
              <button
                type="button"
                key={p.id}
                className="chip"
                onClick={() => void run(p.id)}
              >
                #{p.id} · {p.prenom}
              </button>
            ))}
          </div>
        )}
      </form>

      {result.state === 'found' && (
        <ProfileCard
          p={result.person}
          onEdit={() => openEdit(result.person)}
          onDelete={() => askDelete(result.person)}
        />
      )}
      {result.state === 'missing' && (
        <div className="card">
          <EmptyState icon={<UserX size={22} />} title={`Aucune personne avec l’identifiant #${result.id}`}>
            Réponse reçue : <code>&lt;struct/&gt;</code> — le handler Java renvoie une Map vide.
          </EmptyState>
        </div>
      )}

      {lastCall && (
        <section className="exchange">
          <CodeBlock
            title="Requête envoyée"
            meta={`POST /RPC2`}
            code={formatXml(lastCall.requestXml)}
          />
          <CodeBlock
            title="Réponse reçue"
            meta={`${lastCall.httpStatus ?? '—'} · ${lastCall.durationMs} ms`}
            code={lastCall.responseXml ? formatXml(lastCall.responseXml) : null}
            empty={lastCall.error}
          />
        </section>
      )}
    </div>
  )
}

function ProfileCard({ p, onEdit, onDelete }: { p: Personne; onEdit: () => void; onDelete: () => void }) {
  const age = ageOf(p.dateNaissance)
  return (
    <article className="card profile">
      <div className="profile-banner" style={{ ['--h' as string]: (p.id * 47) % 360 }} />
      <div className="profile-main">
        <Avatar person={p} size={72} />
        <div className="profile-id">
          <span className="id-chip">#{p.id}</span>
          <h2>{fullName(p)}</h2>
        </div>
        <div className="profile-actions">
          <button className="btn" onClick={onEdit}>
            <Pencil size={15} /> Modifier
          </button>
          <button className="btn danger-ghost" onClick={onDelete}>
            <Trash size={15} /> Supprimer
          </button>
        </div>
      </div>
      <dl className="profile-facts">
        <div>
          <dt><Calendar size={14} /> Naissance</dt>
          <dd>
            {formatDate(p.dateNaissance)}
            {age !== null && <span className="muted"> · {age} ans</span>}
          </dd>
        </div>
        <div>
          <dt><MapPin size={14} /> Adresse</dt>
          <dd>{p.adresse}</dd>
        </div>
        <div>
          <dt><Phone size={14} /> Téléphone</dt>
          <dd>{formatPhone(p.telephone)}</dd>
        </div>
      </dl>
    </article>
  )
}
