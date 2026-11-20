import { useEffect, useMemo, useRef, useState } from 'react'
import { MapPin, Pencil, Phone, Plus, RefreshCw, Search, Trash, Users } from 'lucide-react'
import { Avatar, EmptyState, PageHeader } from '../components/ui'
import { ageOf, formatDate, formatPhone, fullName, formatTime } from '../lib/format'
import { useData, useUi } from '../state'
import type { Personne } from '../types'

type SortKey = 'nom' | 'recent' | 'age'

const normalize = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export default function AnnuairePage() {
  const { persons, loading, refresh, lastSync } = useData()
  const { openCreate, openEdit, askDelete } = useUi()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('recent')
  const searchRef = useRef<HTMLInputElement>(null)

  // Raccourci clavier « / » pour la recherche
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(target.tagName)) {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const rows = useMemo(() => {
    const q = normalize(query.trim())
    const filtered = q
      ? persons.filter((p) =>
          normalize(`${p.nom} ${p.prenom} ${p.adresse} ${p.telephone} #${p.id}`).includes(q),
        )
      : persons
    const sorted = [...filtered]
    if (sort === 'nom') sorted.sort((a, b) => a.nom.localeCompare(b.nom, 'fr') || a.prenom.localeCompare(b.prenom, 'fr'))
    if (sort === 'recent') sorted.sort((a, b) => b.id - a.id)
    if (sort === 'age') sorted.sort((a, b) => a.dateNaissance.localeCompare(b.dateNaissance))
    return sorted
  }, [persons, query, sort])

  return (
    <div className="page">
      <PageHeader
        eyebrow="Annuaire"
        title="Toutes les personnes"
        description="Liste obtenue par Personne.lister — modifiez ou supprimez une fiche depuis chaque ligne."
        actions={
          <button className="btn primary" onClick={openCreate}>
            <Plus size={16} /> Nouvelle personne
          </button>
        }
      />

      <div className="toolbar">
        <label className="search">
          <Search size={16} />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un nom, une ville, un numéro…"
            aria-label="Filtrer l’annuaire"
          />
          <kbd>/</kbd>
        </label>
        <div className="segmented" role="group" aria-label="Trier">
          {(
            [
              ['recent', 'Récents'],
              ['nom', 'Nom A→Z'],
              ['age', 'Âge'],
            ] as [SortKey, string][]
          ).map(([k, label]) => (
            <button key={k} className={sort === k ? 'is-active' : ''} onClick={() => setSort(k)}>
              {label}
            </button>
          ))}
        </div>
        <button className="btn" onClick={() => void refresh()} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'spin' : ''} /> Actualiser
        </button>
      </div>

      <div className="card table-card">
        {loading && persons.length === 0 ? (
          <div className="skeleton-list">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton-row" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          query ? (
            <EmptyState icon={<Search size={20} />} title={`Aucun résultat pour « ${query} »`}>
              Le filtre s’applique localement sur la liste déjà reçue.
            </EmptyState>
          ) : (
            <EmptyState
              icon={<Users size={20} />}
              title="Aucune personne enregistrée"
              action={
                <button className="btn primary sm" onClick={openCreate}>
                  <Plus size={14} /> Ajouter une personne
                </button>
              }
            >
              Commencez par ajouter une fiche : elle sera envoyée via Personne.ajouter.
            </EmptyState>
          )
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Personne</th>
                <th>Naissance</th>
                <th>Adresse</th>
                <th>Téléphone</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <Row key={p.id} p={p} onEdit={() => openEdit(p)} onDelete={() => askDelete(p)} />
              ))}
            </tbody>
          </table>
        )}
        <div className="table-foot">
          <span>
            {rows.length} / {persons.length} personne{persons.length > 1 ? 's' : ''}
          </span>
          {lastSync && <span>Synchronisé à {formatTime(lastSync)}</span>}
        </div>
      </div>
    </div>
  )
}

function Row({ p, onEdit, onDelete }: { p: Personne; onEdit: () => void; onDelete: () => void }) {
  const age = ageOf(p.dateNaissance)
  return (
    <tr>
      <td data-label="Personne">
        <div className="person-cell">
          <Avatar person={p} />
          <div>
            <div className="person-name">{fullName(p)}</div>
            <div className="person-id">#{p.id}</div>
          </div>
        </div>
      </td>
      <td data-label="Naissance">
        <div>{formatDate(p.dateNaissance)}</div>
        {age !== null && <div className="muted small">{age} ans</div>}
      </td>
      <td data-label="Adresse">
        <span className="with-icon">
          <MapPin size={14} /> {p.adresse}
        </span>
      </td>
      <td data-label="Téléphone">
        <a className="with-icon phone" href={`tel:${p.telephone}`}>
          <Phone size={14} /> {formatPhone(p.telephone)}
        </a>
      </td>
      <td className="row-actions">
        <button className="icon-btn" onClick={onEdit} title="Modifier" aria-label={`Modifier ${fullName(p)}`}>
          <Pencil size={16} />
        </button>
        <button
          className="icon-btn danger"
          onClick={onDelete}
          title="Supprimer"
          aria-label={`Supprimer ${fullName(p)}`}
        >
          <Trash size={16} />
        </button>
      </td>
    </tr>
  )
}
