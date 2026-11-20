<script setup lang="ts">
import { computed } from 'vue'
import { Moon, PanelRight, RefreshCw, Sun } from '@lucide/vue'
import { calls, inspectorOpen } from '../stores/inspector'
import { loading, online, persons, refresh } from '../stores/personnes'
import { go, theme, view } from '../stores/ui'
import type { ViewId } from '../types'

const tabs: { id: ViewId; label: string }[] = [
  { id: 'apercu', label: 'Aperçu' },
  { id: 'personnes', label: 'Personnes' },
  { id: 'recherche', label: 'Recherche' },
  { id: 'playground', label: 'Playground' },
]

const status = computed(() => (online.value === null ? 'checking' : online.value ? 'online' : 'offline'))
const statusLabel = computed(
  () => ({ checking: 'Connexion…', online: 'En ligne', offline: 'Hors ligne' })[status.value],
)
</script>

<template>
  <header class="topbar">
    <div class="topbar-inner">
      <a class="brand" href="#/apercu" @click.prevent="go('apercu')">
        <span class="brand-mark" aria-hidden="true">{ }</span>
        <span class="brand-text">
          <span class="brand-name">Carnet</span>
          <span class="brand-sub">JSON-RPC 2.0</span>
        </span>
      </a>

      <nav class="tabs" aria-label="Navigation principale">
        <button
          v-for="t in tabs"
          :key="t.id"
          class="tab"
          :class="{ 'is-active': view === t.id }"
          :aria-current="view === t.id ? 'page' : undefined"
          @click="go(t.id)"
        >
          {{ t.label }}
          <span v-if="t.id === 'personnes' && persons.length" class="tab-count">{{ persons.length }}</span>
        </button>
      </nav>

      <div class="topbar-actions">
        <button class="status-pill" :class="`is-${status}`" title="Relancer Personne.lister" @click="refresh()">
          <span class="dot" />
          <span class="status-text">{{ statusLabel }}</span>
          <span class="status-port mono">:8082</span>
          <RefreshCw :size="13" :class="{ spin: loading }" />
        </button>
        <button
          class="icon-btn"
          :class="{ 'is-on': inspectorOpen }"
          title="Inspecteur des échanges"
          aria-label="Ouvrir l’inspecteur des échanges JSON-RPC"
          @click="inspectorOpen = !inspectorOpen"
        >
          <PanelRight :size="18" />
          <span v-if="calls.length" class="icon-badge">{{ calls.length > 99 ? '99+' : calls.length }}</span>
        </button>
        <button
          class="icon-btn"
          :title="theme === 'dark' ? 'Thème clair' : 'Thème sombre'"
          aria-label="Changer de thème"
          @click="theme = theme === 'dark' ? 'light' : 'dark'"
        >
          <Sun v-if="theme === 'dark'" :size="18" />
          <Moon v-else :size="18" />
        </button>
      </div>
    </div>
  </header>
</template>
