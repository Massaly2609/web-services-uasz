<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { PanelRight, Send, Sparkles } from '@lucide/vue'
import JsonBlock from '../components/JsonBlock.vue'
import { callRaw, JSONRPC_ENDPOINT, ERROR_CODES } from '../api/jsonrpc'
import { prettyJson } from '../lib/format'
import { calls, inspectorOpen, type RpcCall } from '../stores/inspector'
import { persons, refresh } from '../stores/personnes'

interface Preset {
  label: string
  kind: 'ok' | 'err'
  body: () => unknown | string
}

const firstId = computed(() => persons.value[0]?.id ?? 1)
const env = (method: string, params: Record<string, unknown>, id: number) => ({ jsonrpc: '2.0', method, params, id })
const personne = { nom: 'DIOP', prenom: 'Amadou', dateNaissance: '2000-05-15', adresse: 'Ziguinchor', telephone: '771234567' }

const presets: Preset[] = [
  { label: 'ajouter', kind: 'ok', body: () => env('Personne.ajouter', personne, 1) },
  { label: 'lister', kind: 'ok', body: () => env('Personne.lister', {}, 3) },
  { label: 'rechercher', kind: 'ok', body: () => env('Personne.rechercher', { id: firstId.value }, 2) },
  { label: 'modifier', kind: 'ok', body: () => env('Personne.modifier', { id: firstId.value, ...personne, adresse: 'Dakar', telephone: '779876543' }, 4) },
  { label: 'supprimer', kind: 'ok', body: () => env('Personne.supprimer', { id: firstId.value }, 5) },
  { label: '-32600 · version 1.0', kind: 'err', body: () => ({ jsonrpc: '1.0', method: 'Personne.lister', id: 6 }) },
  { label: '-32601 · méthode inconnue', kind: 'err', body: () => env('Personne.inconnue', {}, 7) },
  {
    label: '-32602 · « dateNaissancee »',
    kind: 'err',
    body: () => env('Personne.modifier', { id: firstId.value, nom: 'DIOP', prenom: 'Amadou', dateNaissancee: '2000-05-15', adresse: 'Dakar', telephone: '779876543' }, 8),
  },
  { label: '-32603 · date 15/05/2000', kind: 'err', body: () => env('Personne.ajouter', { ...personne, dateNaissance: '15/05/2000' }, 9) },
  { label: 'HTTP 400 · JSON invalide', kind: 'err', body: () => '{ "jsonrpc": "2.0", "method": "Personne.lister", ' },
]

const source = ref(JSON.stringify(env('Personne.lister', {}, 3), null, 2))
const sending = ref(false)
const current = ref<RpcCall | null>(null)

function load(p: Preset) {
  const b = p.body()
  source.value = typeof b === 'string' ? b : JSON.stringify(b, null, 2)
}

async function send() {
  if (sending.value) return
  sending.value = true
  try {
    await callRaw(source.value)
  } catch {
    /* l'erreur est affichée dans la réponse */
  } finally {
    sending.value = false
    current.value = calls.value[0] ?? null
    if (/Personne\.(ajouter|modifier|supprimer)/.test(source.value)) void refresh()
  }
}

const explanation = computed(() => {
  const c = current.value
  if (!c) return null
  if (c.outcome === 'ok') return { tone: 'ok', text: 'Succès : la réponse contient un champ « result » et reprend le même « id ».' }
  if (c.outcome === 'transport') {
    return c.httpStatus === 400
      ? { tone: 'warn', text: 'Le corps n’est pas du JSON : Spring rejette la requête (HTTP 400) avant le contrôleur. La spécification prévoit -32700 « Parse error ».' }
      : { tone: 'err', text: c.errorMessage ?? 'Erreur de transport' }
  }
  const spec = ERROR_CODES.find((e) => e.code === c.errorCode)
  return { tone: 'err', text: `Erreur ${c.errorCode} (${spec?.name ?? 'code applicatif'}) : ${c.errorMessage}. ${spec ? spec.meaning + '.' : ''}` }
})

function onKey(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault()
    void send()
  }
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="page">
    <header class="page-head">
      <div>
        <span class="eyebrow">Playground</span>
        <h1>Écrire une requête à la main</h1>
        <p>Comme dans Postman : choisissez un exemple, modifiez le JSON et envoyez-le. Les exemples rouges déclenchent volontairement chaque code d’erreur du contrôleur.</p>
      </div>
      <button class="btn" @click="inspectorOpen = true"><PanelRight :size="16" /> Historique</button>
    </header>

    <div class="presets">
      <button v-for="p in presets" :key="p.label" class="chip" :class="{ 'is-warn': p.kind === 'err' }" @click="load(p)">
        {{ p.label }}
      </button>
    </div>

    <section class="playground">
      <div class="pane glass">
        <div class="pane-head">
          <span class="method-badge">POST</span>
          <code class="mono">{{ JSONRPC_ENDPOINT }}</code>
          <span class="muted small mono">application/json</span>
        </div>
        <textarea v-model="source" class="editor" spellcheck="false" wrap="off" aria-label="Corps de la requête JSON" />
        <div class="pane-foot">
          <button class="btn ghost sm" @click="source = prettyJson(source)"><Sparkles :size="14" /> Formater</button>
          <span class="muted small hide-sm">Ctrl + Entrée</span>
          <button class="btn primary" :disabled="sending" @click="send">
            <span v-if="sending" class="spinner" /><Send v-else :size="15" /> Envoyer
          </button>
        </div>
      </div>

      <div class="pane glass">
        <div class="pane-head">
          <span class="outcome" :class="current ? `is-${current.outcome}` : ''">
            {{ current ? (current.outcome === 'ok' ? 'result' : current.outcome === 'rpc-error' ? 'error' : 'HTTP') : 'en attente' }}
          </span>
          <code v-if="current" class="mono">{{ current.method }}</code>
          <span v-if="current" class="muted small mono push">HTTP {{ current.httpStatus ?? '—' }} · {{ current.durationMs }} ms</span>
        </div>
        <p v-if="explanation" class="explain" :class="`is-${explanation.tone}`">{{ explanation.text }}</p>
        <JsonBlock
          title="Réponse"
          :code="current?.responseBody ?? null"
          :empty="current ? 'Pas de corps de réponse' : 'Envoyez une requête pour voir la réponse du serveur.'"
        />
      </div>
    </section>
  </div>
</template>
