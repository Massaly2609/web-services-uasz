<script setup lang="ts">
import { ref } from 'vue'
import { Eraser, Radio, X } from '@lucide/vue'
import JsonBlock from './JsonBlock.vue'
import { formatTime } from '../lib/format'
import { calls, callStats, clearCalls, inspectorOpen } from '../stores/inspector'

const expanded = ref<number | null>(null)
const toggle = (seq: number) => (expanded.value = expanded.value === seq ? null : seq)
const label = { ok: 'result', 'rpc-error': 'error', transport: 'HTTP' } as const
</script>

<template>
  <Transition name="slide">
    <aside v-if="inspectorOpen" class="inspector" aria-label="Inspecteur des échanges JSON-RPC">
      <header class="inspector-head">
        <div>
          <span class="eyebrow"><Radio :size="12" /> Trafic en direct</span>
          <h2>Inspecteur</h2>
        </div>
        <button class="icon-btn" title="Vider" aria-label="Vider le journal" :disabled="!calls.length" @click="clearCalls">
          <Eraser :size="17" />
        </button>
        <button class="icon-btn" aria-label="Fermer l’inspecteur" @click="inspectorOpen = false">
          <X :size="18" />
        </button>
      </header>

      <div class="inspector-stats">
        <div><strong>{{ callStats.total }}</strong><span>appels</span></div>
        <div><strong class="ok">{{ callStats.ok }}</strong><span>succès</span></div>
        <div><strong class="err">{{ callStats.errors }}</strong><span>erreurs</span></div>
        <div><strong>{{ callStats.avg ?? '—' }}</strong><span>ms moy.</span></div>
      </div>

      <p v-if="!calls.length" class="inspector-empty">
        Aucun échange. Chaque appel de l’application apparaîtra ici avec son enveloppe JSON complète.
      </p>

      <ol class="stream">
        <li v-for="c in calls" :key="c.seq" class="stream-item" :class="[`is-${c.outcome}`, { 'is-open': expanded === c.seq }]">
          <button class="stream-row" @click="toggle(c.seq)">
            <span class="stream-dot" />
            <span class="stream-method mono">{{ c.method }}</span>
            <span class="stream-tag">{{ c.errorCode ?? label[c.outcome] }}</span>
            <span class="stream-time mono">{{ c.durationMs }} ms</span>
          </button>
          <div class="stream-sub mono">
            {{ formatTime(c.startedAt) }} · HTTP {{ c.httpStatus ?? '—' }}
            <template v-if="c.errorMessage"> · {{ c.errorMessage }}</template>
          </div>
          <div v-if="expanded === c.seq" class="stream-detail">
            <JsonBlock title="→ requête" :code="c.requestBody" />
            <JsonBlock title="← réponse" :code="c.responseBody" empty="Pas de réponse (serveur injoignable)" />
          </div>
        </li>
      </ol>
    </aside>
  </Transition>
</template>
