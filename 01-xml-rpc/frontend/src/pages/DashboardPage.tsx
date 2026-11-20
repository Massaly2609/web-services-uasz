import { useMemo } from 'react'
import { Activity, ArrowRight, Cake, MapPin, Plus, Users } from 'lucide-react'
import { useRpcCalls } from '../api/inspector'
import { METHODS } from '../api/personneService'
import { Avatar, EmptyState, PageHeader } from '../components/ui'
import { ageOf, formatDate, fullName } from '../lib/format'
import { useData, useUi } from '../state'
import type { PageId } from '../types'

const AGE_BANDS = [
  { label: '< 18', min: 0, max: 17 },
  { label: '18–25', min: 18, max: 25 },
  { label: '26–35', min: 26, max: 35 },
  { label: '36–50', min: 36, max: 50 },
  { label: '50 +', min: 51, max: 200 },
]

export default function DashboardPage({ onNavigate }: { onNavigate: (p: PageId) => void }) {
  const { persons, loading } = useData()
  const { openCreate } = useUi()
  const calls = useRpcCalls()

  const stats = useMemo(() => {
    const ages = persons.map((p) => ageOf(p.dateNaissance)).filter((a): a is number => a !== null)
    const avgAge = ages.length ? ages.reduce((s, a) => s + a, 0) / ages.length : null
    const byCity = new Map<string, number>()
    for (const p of persons) {
      const city = p.adresse.trim() || 'Non renseignée'
      byCity.set(city, (byCity.get(city) ?? 0) + 1)
    }
    const cities = [...byCity.entries()].sort((a, b) => b[1] - a[1])
    const bands = AGE_BANDS.map((b) => ({
      ...b,
      count: ages.filter((a) => a >= b.min && a <= b.max).length,
    }))
    const recent = [...persons].sort((a, b) => b.id - a.id).slice(0, 5)
    return { avgAge, cities, bands, recent }
  }, [persons])

  const okCalls = calls.filter((c) => c.outcome === 'ok').length
  const avgMs = calls.length ? Math.round(calls.reduce((s, c) => s + c.durationMs, 0) / calls.length) : null
  const maxCity = stats.cities[0]?.[1] ?? 1
  const maxBand = Math.max(1, ...stats.bands.map((b) => b.count))

  return (
    <div className="page">
      <PageHeader
        eyebrow="Tableau de bord"
        title="Registre des personnes"
        description={
          <>
            Client <strong>React</strong> qui dialogue avec le service <strong>XML-RPC</strong> du TP :
            chaque action ci-dessous devient un <code>&lt;methodCall&gt;</code> envoyé en HTTP POST.
          </>
        }
        actions={
          <button className="btn primary" onClick={openCreate}>
            <Plus size={16} /> Nouvelle personne
          </button>
        }
      />

      <section className="kpis">
        <div className="kpi">
          <div className="kpi-icon"><Users size={18} /></div>
          <div className="kpi-label">Personnes enregistrées</div>
          <div className="kpi-value">{loading && persons.length === 0 ? '—' : persons.length}</div>
          <div className="kpi-foot">via Personne.lister</div>
        </div>
        <div className="kpi">
          <div className="kpi-icon"><Cake size={18} /></div>
          <div className="kpi-label">Âge moyen</div>
          <div className="kpi-value">
            {stats.avgAge === null ? '—' : stats.avgAge.toFixed(1).replace('.', ',')}
            {stats.avgAge !== null && <small> ans</small>}
          </div>
          <div className="kpi-foot">calculé côté client</div>
        </div>
        <div className="kpi">
          <div className="kpi-icon"><MapPin size={18} /></div>
          <div className="kpi-label">Villes représentées</div>
          <div className="kpi-value">{stats.cities.length || '—'}</div>
          <div className="kpi-foot">{stats.cities[0] ? `en tête : ${stats.cities[0][0]}` : 'aucune donnée'}</div>
        </div>
        <div className="kpi">
          <div className="kpi-icon"><Activity size={18} /></div>
          <div className="kpi-label">Appels XML-RPC</div>
          <div className="kpi-value">{calls.length}</div>
          <div className="kpi-foot">
            {calls.length ? `${okCalls} réussis · ${avgMs} ms en moyenne` : 'pendant cette session'}
          </div>
        </div>
      </section>

      <section className="grid-12">
        <div className="card span-7">
          <div className="card-head">
            <h3>Répartition par ville</h3>
            <span className="card-sub">{persons.length} fiches</span>
          </div>
          {stats.cities.length === 0 ? (
            <EmptyState icon={<MapPin size={20} />} title="Aucune adresse pour l’instant" />
          ) : (
            <ul className="bars">
              {stats.cities.slice(0, 6).map(([city, n]) => (
                <li key={city}>
                  <span className="bar-label">{city}</span>
                  <span className="bar-track">
                    <span className="bar-fill" style={{ width: `${(n / maxCity) * 100}%` }} />
                  </span>
                  <span className="bar-value">{n}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card span-5">
          <div className="card-head">
            <h3>Tranches d’âge</h3>
            <span className="card-sub">années révolues</span>
          </div>
          <div className="columns">
            {stats.bands.map((b) => (
              <div key={b.label} className="column">
                <span className="column-value">{b.count}</span>
                <span className="column-track">
                  <span className="column-fill" style={{ height: `${(b.count / maxBand) * 100}%` }} />
                </span>
                <span className="column-label">{b.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card span-5">
          <div className="card-head">
            <h3>Derniers enregistrements</h3>
            <button className="link-btn" onClick={() => onNavigate('annuaire')}>
              Tout voir <ArrowRight size={14} />
            </button>
          </div>
          {stats.recent.length === 0 ? (
            <EmptyState
              icon={<Users size={20} />}
              title="L’annuaire est vide"
              action={
                <button className="btn sm" onClick={openCreate}>
                  <Plus size={14} /> Ajouter la première personne
                </button>
              }
            >
              La base H2 est en mémoire : elle repart à zéro à chaque redémarrage du serveur.
            </EmptyState>
          ) : (
            <ul className="recent">
              {stats.recent.map((p) => (
                <li key={p.id}>
                  <Avatar person={p} size={34} />
                  <div className="recent-main">
                    <span className="recent-name">{fullName(p)}</span>
                    <span className="recent-meta">
                      {p.adresse} · né(e) le {formatDate(p.dateNaissance)}
                    </span>
                  </div>
                  <span className="id-chip">#{p.id}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card span-7">
          <div className="card-head">
            <h3>Méthodes exposées</h3>
            <button className="link-btn" onClick={() => onNavigate('console')}>
              Ouvrir la console <ArrowRight size={14} />
            </button>
          </div>
          <ul className="methods">
            {METHODS.map((m) => (
              <li key={m.name}>
                <div className="method-sig">
                  <code className="method-name">{m.name}</code>
                  <code className="method-params">{m.signature}</code>
                </div>
                <div className="method-desc">
                  <span>{m.description}</span>
                  <span className="type-chip">→ {m.returns}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
