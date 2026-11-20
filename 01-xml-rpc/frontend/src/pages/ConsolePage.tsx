import { useEffect, useMemo, useState } from 'react'
import { Eraser, Send, Sparkles, Terminal } from 'lucide-react'
import { clearCalls, lastCallId, useRpcCalls, type RpcCall } from '../api/inspector'
import { buildMethodCall, callRaw, formatXml, XMLRPC_ENDPOINT, type XmlRpcValue } from '../api/xmlrpc'
import { CodeBlock, EmptyState, PageHeader, Spinner } from '../components/ui'
import { formatTime } from '../lib/format'
import { useData } from '../state'

type Tab = 'response' | 'request' | 'decoded'

const OUTCOME_LABEL = { ok: 'Succès', fault: 'Fault', error: 'Erreur' } as const

export default function ConsolePage() {
  const { persons, refresh } = useData()
  const calls = useRpcCalls()
  const firstId = persons[0]?.id ?? 1

  const presets = useMemo<{ label: string; method: string; params: XmlRpcValue[] }[]>(
    () => [
      { label: 'ajouter', method: 'Personne.ajouter', params: ['DIOP', 'Amadou', '2000-05-15', 'Ziguinchor', '771234567'] },
      { label: 'lister', method: 'Personne.lister', params: [] },
      { label: 'rechercher', method: 'Personne.rechercher', params: [firstId] },
      { label: 'modifier', method: 'Personne.modifier', params: [firstId, 'DIOP', 'Amadou', '2000-05-15', 'Dakar', '779876543'] },
      { label: 'supprimer', method: 'Personne.supprimer', params: [firstId] },
      { label: 'fault : méthode inconnue', method: 'Personne.inconnue', params: [] },
      { label: 'fault : date invalide', method: 'Personne.ajouter', params: ['FALL', 'Awa', '15/05/2000', 'Thiès', '781112233'] },
    ],
    [firstId],
  )

  const [xml, setXml] = useState(() => buildMethodCall('Personne.lister', []))
  const [sending, setSending] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [tab, setTab] = useState<Tab>('response')

  const selected: RpcCall | undefined =
    calls.find((c) => c.id === selectedId) ?? (selectedId === null ? calls[0] : undefined)

  const send = async () => {
    setSending(true)
    try {
      await callRaw(xml)
    } catch {
      /* l'échec est visible dans le journal */
    } finally {
      setSending(false)
      // On fige la sélection sur CET appel (la resynchronisation qui suit en ajoute un autre)
      setSelectedId(lastCallId())
      setTab('response')
      // Une écriture a pu modifier la base : on resynchronise l'annuaire
      if (/Personne\.(ajouter|modifier|supprimer)/.test(xml)) void refresh()
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        if (!sending) void send()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="page">
      <PageHeader
        eyebrow="Console"
        title="Console XML-RPC"
        description="Composez un <methodCall> à la main — comme dans Postman — et inspectez la réponse brute du serveur. Tous les appels de l’application sont journalisés ici."
        actions={
          <button className="btn" onClick={clearCalls} disabled={calls.length === 0}>
            <Eraser size={15} /> Vider le journal
          </button>
        }
      />

      <section className="console-grid">
        <div className="card composer">
          <div className="card-head">
            <h3>Requête</h3>
            <code className="endpoint">POST {XMLRPC_ENDPOINT} · text/xml</code>
          </div>
          <div className="chips">
            {presets.map((p) => (
              <button
                key={p.label}
                className={`chip ${p.label.startsWith('fault') ? 'is-warn' : ''}`}
                onClick={() => setXml(buildMethodCall(p.method, p.params))}
              >
                {p.label}
              </button>
            ))}
          </div>
          <textarea
            className="editor"
            value={xml}
            onChange={(e) => setXml(e.target.value)}
            spellCheck={false}
            wrap="off"
            aria-label="Document XML à envoyer"
          />
          <div className="composer-foot">
            <button className="btn ghost sm" onClick={() => setXml(formatXml(xml))}>
              <Sparkles size={14} /> Reformater
            </button>
            <span className="muted small">Ctrl + Entrée pour envoyer</span>
            <button className="btn primary" onClick={() => void send()} disabled={sending}>
              {sending ? <Spinner size={14} /> : <Send size={15} />} Envoyer
            </button>
          </div>
        </div>

        <div className="card inspector">
          {!selected ? (
            <EmptyState icon={<Terminal size={20} />} title="Aucun échange pour l’instant">
              Envoyez une requête ou utilisez l’application : chaque appel apparaîtra ici.
            </EmptyState>
          ) : (
            <>
              <div className="inspector-head">
                <span className={`outcome is-${selected.outcome}`}>{OUTCOME_LABEL[selected.outcome]}</span>
                <code className="inspector-method">{selected.method}</code>
                <span className="muted small">
                  HTTP {selected.httpStatus ?? '—'} · {selected.durationMs} ms · {formatTime(selected.startedAt)}
                </span>
              </div>
              {selected.error && <div className={`inspector-error is-${selected.outcome}`}>{selected.error}</div>}
              <div className="tabs" role="tablist">
                {(
                  [
                    ['response', 'Réponse XML'],
                    ['request', 'Requête XML'],
                    ['decoded', 'Valeur décodée'],
                  ] as [Tab, string][]
                ).map(([k, label]) => (
                  <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'is-active' : ''} onClick={() => setTab(k)}>
                    {label}
                  </button>
                ))}
              </div>
              {tab === 'response' && (
                <CodeBlock
                  title="methodResponse"
                  code={selected.responseXml ? formatXml(selected.responseXml) : null}
                  empty="Pas de réponse XML (erreur réseau)"
                />
              )}
              {tab === 'request' && <CodeBlock title="methodCall" code={formatXml(selected.requestXml)} />}
              {tab === 'decoded' && (
                <CodeBlock
                  title="Objet JavaScript"
                  lang="json"
                  code={selected.outcome === 'ok' ? JSON.stringify(selected.result ?? null) : null}
                  empty="Aucune valeur : l’appel a échoué"
                />
              )}
            </>
          )}
        </div>
      </section>

      <div className="card history">
        <div className="card-head">
          <h3>Journal des appels</h3>
          <span className="card-sub">{calls.length} échange{calls.length > 1 ? 's' : ''}</span>
        </div>
        {calls.length === 0 ? (
          <p className="muted small history-empty">Le journal est vide.</p>
        ) : (
          <table className="table compact">
            <thead>
              <tr>
                <th>Heure</th>
                <th>Méthode</th>
                <th>Résultat</th>
                <th>HTTP</th>
                <th className="num">Durée</th>
              </tr>
            </thead>
            <tbody>
              {calls.map((c) => (
                <tr
                  key={c.id}
                  className={`clickable ${selected?.id === c.id ? 'is-selected' : ''}`}
                  onClick={() => setSelectedId(c.id)}
                >
                  <td className="mono muted">{formatTime(c.startedAt)}</td>
                  <td><code>{c.method}</code></td>
                  <td><span className={`outcome is-${c.outcome}`}>{OUTCOME_LABEL[c.outcome]}</span></td>
                  <td className="mono">{c.httpStatus ?? '—'}</td>
                  <td className="num mono">{c.durationMs} ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
