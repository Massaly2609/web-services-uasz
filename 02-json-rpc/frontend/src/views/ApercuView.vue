<script setup lang="ts">
import { computed } from 'vue'
import { Activity, ArrowRight, Cake, MapPin, Plus, Users } from '@lucide/vue'
import JsonBlock from '../components/JsonBlock.vue'
import { ERROR_CODES } from '../api/jsonrpc'
import { METHODS } from '../api/personneService'
import { ageOf } from '../lib/format'
import { calls, callStats } from '../stores/inspector'
import { loading, persons } from '../stores/personnes'
import { go, openCreate } from '../stores/ui'

const stats = computed(() => {
  const ages = persons.value.map((p) => ageOf(p.dateNaissance)).filter((a): a is number => a !== null)
  const avg = ages.length ? ages.reduce((s, a) => s + a, 0) / ages.length : null
  const byCity = new Map<string, number>()
  for (const p of persons.value) byCity.set(p.adresse, (byCity.get(p.adresse) ?? 0) + 1)
  const cities = [...byCity.entries()].sort((a, b) => b[1] - a[1])
  return { avg, cities, youngest: ages.length ? Math.min(...ages) : null, oldest: ages.length ? Math.max(...ages) : null }
})

const maxCity = computed(() => stats.value.cities[0]?.[1] ?? 1)
const lastCall = computed(() => calls.value[0])
const seenCodes = computed(() => new Set(calls.value.map((c) => c.errorCode).filter((c) => c !== undefined)))

const sample = JSON.stringify({ jsonrpc: '2.0', method: 'Personne.lister', params: {}, id: 1 })
</script>

<template>
  <div class="page">
    <section class="hero">
      <div class="hero-copy">
        <span class="eyebrow">Service web · JSON-RPC 2.0 · Spring Boot</span>
        <h1>
          Un carnet d’adresses qui parle
          <span class="gradient-text">JSON-RPC</span>
        </h1>
        <p>
          Client <strong>Vue 3</strong> pour le TP « Gestion des personnes ». Chaque action envoie une enveloppe
          <code>{ jsonrpc, method, params, id }</code> en POST sur <code>/jsonrpc</code> et lit le champ
          <code>result</code> — ou <code>error</code>.
        </p>
        <div class="hero-actions">
          <button class="btn primary lg" @click="openCreate"><Plus :size="17" /> Ajouter une personne</button>
          <button class="btn lg" @click="go('playground')">Ouvrir le playground <ArrowRight :size="16" /></button>
        </div>
      </div>
      <div class="hero-card glass">
        <div class="hero-card-head">
          <span class="eyebrow">Dernier échange</span>
          <span v-if="lastCall" class="mono muted small">{{ lastCall.durationMs }} ms · HTTP {{ lastCall.httpStatus ?? '—' }}</span>
        </div>
        <JsonBlock title="→ requête" :code="lastCall?.requestBody ?? sample" />
        <JsonBlock
          title="← réponse"
          :code="lastCall?.responseBody ?? null"
          empty="En attente du premier appel…"
          class="clamp"
        />
      </div>
    </section>

    <section class="tiles">
      <div class="tile">
        <span class="tile-icon"><Users :size="18" /></span>
        <span class="tile-label">Personnes</span>
        <span class="tile-value">{{ loading && !persons.length ? '—' : persons.length }}</span>
        <span class="tile-foot mono">Personne.lister</span>
      </div>
      <div class="tile">
        <span class="tile-icon"><Cake :size="18" /></span>
        <span class="tile-label">Âge moyen</span>
        <span class="tile-value">
          {{ stats.avg === null ? '—' : stats.avg.toFixed(1).replace('.', ',') }}<small v-if="stats.avg !== null"> ans</small>
        </span>
        <span class="tile-foot mono">
          {{ stats.youngest === null ? 'aucune donnée' : `de ${stats.youngest} à ${stats.oldest} ans` }}
        </span>
      </div>
      <div class="tile">
        <span class="tile-icon"><MapPin :size="18" /></span>
        <span class="tile-label">Villes</span>
        <span class="tile-value">{{ stats.cities.length || '—' }}</span>
        <span class="tile-foot mono">{{ stats.cities[0] ? `en tête : ${stats.cities[0][0]}` : 'aucune donnée' }}</span>
      </div>
      <div class="tile">
        <span class="tile-icon"><Activity :size="18" /></span>
        <span class="tile-label">Appels JSON-RPC</span>
        <span class="tile-value">{{ callStats.total }}</span>
        <span class="tile-foot mono">
          {{ callStats.total ? `${callStats.ok} ok · ${callStats.errors} erreur(s) · ${callStats.avg} ms` : 'cette session' }}
        </span>
      </div>
    </section>

    <section class="panels">
      <div class="panel glass span-2">
        <header class="panel-head">
          <h3>Méthodes exposées</h3>
          <span class="muted small">paramètres nommés (objet JSON)</span>
        </header>
        <ul class="method-list">
          <li v-for="m in METHODS" :key="m.name">
            <code class="m-name">{{ m.name }}</code>
            <code class="m-params">{{ m.params }}</code>
            <span class="m-desc">{{ m.description }}</span>
            <span class="m-returns mono">→ {{ m.returns }}</span>
          </li>
        </ul>
      </div>

      <div class="panel glass">
        <header class="panel-head">
          <h3>Codes d’erreur</h3>
          <span class="muted small">spécification 2.0</span>
        </header>
        <ul class="codes">
          <li v-for="e in ERROR_CODES" :key="e.code" :class="{ 'is-seen': seenCodes.has(e.code) }">
            <code class="code-num">{{ e.code }}</code>
            <div>
              <div class="code-name">{{ e.name }}</div>
              <div class="code-meaning">{{ e.meaning }}</div>
            </div>
          </li>
        </ul>
        <button class="link" @click="go('playground')">Provoquer ces erreurs <ArrowRight :size="14" /></button>
      </div>

      <div class="panel glass span-3">
        <header class="panel-head">
          <h3>Répartition par ville</h3>
          <button class="link" @click="go('personnes')">Voir les personnes <ArrowRight :size="14" /></button>
        </header>
        <p v-if="!stats.cities.length" class="muted small">Aucune donnée — ajoutez une personne pour commencer.</p>
        <div v-else class="city-bars">
          <div v-for="[city, n] in stats.cities.slice(0, 8)" :key="city" class="city">
            <span class="city-name">{{ city }}</span>
            <span class="city-track"><span class="city-fill" :style="{ width: `${(n / maxCity) * 100}%` }" /></span>
            <span class="city-n mono">{{ n }}</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
