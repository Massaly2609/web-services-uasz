<script setup lang="ts">
import { computed, ref } from 'vue'
import { Calendar, Hash, MapPin, Pencil, Phone, Search, Trash, UserX } from '@lucide/vue'
import JsonBlock from '../components/JsonBlock.vue'
import PersonAvatar from '../components/PersonAvatar.vue'
import { PersonneService } from '../api/personneService'
import { ageOf, formatDate, formatPhone, fullName } from '../lib/format'
import { calls } from '../stores/inspector'
import { describeError, persons } from '../stores/personnes'
import { notify } from '../stores/toasts'
import { askDelete, openEdit } from '../stores/ui'
import type { Personne } from '../types'

type Result = { state: 'idle' } | { state: 'found'; person: Personne } | { state: 'missing'; id: number }

const value = ref('')
const busy = ref(false)
const searched = ref(false)
const result = ref<Result>({ state: 'idle' })

const shortcuts = computed(() => [...persons.value].sort((a, b) => a.id - b.id).slice(0, 10))
const lastCall = computed(() => (searched.value ? calls.value.find((c) => c.method === 'Personne.rechercher') : undefined))

async function run(id: number) {
  value.value = String(id)
  busy.value = true
  try {
    const p = await PersonneService.rechercher(id)
    result.value = p ? { state: 'found', person: p } : { state: 'missing', id }
  } catch (err) {
    notify('error', 'Recherche impossible', describeError(err))
    result.value = { state: 'idle' }
  } finally {
    busy.value = false
    searched.value = true
  }
}

function submit() {
  const id = Number.parseInt(value.value, 10)
  if (!Number.isInteger(id) || id <= 0) {
    notify('info', 'Identifiant invalide', 'Saisissez un entier positif, par exemple 1.')
    return
  }
  void run(id)
}
</script>

<template>
  <div class="page narrow">
    <header class="page-head">
      <div>
        <span class="eyebrow">Personne.rechercher</span>
        <h1>Recherche par identifiant</h1>
        <p>Si l’identifiant n’existe pas, le serveur répond avec une erreur <code>-32602</code> « Personne introuvable ».</p>
      </div>
    </header>

    <form class="lookup glass" @submit.prevent="submit">
      <div class="lookup-field">
        <Hash :size="22" />
        <input
          v-model="value"
          inputmode="numeric"
          placeholder="Identifiant…"
          aria-label="Identifiant de la personne"
          autofocus
          @input="value = value.replace(/\D/g, '')"
        />
        <button class="btn primary" :disabled="busy || !value">
          <span v-if="busy" class="spinner" /><Search v-else :size="16" /> Rechercher
        </button>
      </div>
      <div v-if="shortcuts.length" class="chips">
        <span class="muted small">Essayer :</span>
        <button v-for="p in shortcuts" :key="p.id" type="button" class="chip" @click="run(p.id)">
          {{ p.id }} · {{ p.prenom }}
        </button>
        <button type="button" class="chip is-warn" @click="run(9999)">9999 · inconnu</button>
      </div>
    </form>

    <Transition name="view" mode="out-in">
      <article v-if="result.state === 'found'" :key="result.person.id" class="profile glass">
        <div class="profile-glow" :style="{ '--h': (result.person.id * 53) % 360 }" />
        <div class="profile-row">
          <PersonAvatar :nom="result.person.nom" :prenom="result.person.prenom" :size="76" />
          <div class="profile-name">
            <span class="mono muted small">id {{ result.person.id }}</span>
            <h2>{{ fullName(result.person) }}</h2>
          </div>
          <div class="profile-actions">
            <button class="btn" @click="openEdit(result.person)"><Pencil :size="15" /> Modifier</button>
            <button class="btn danger-ghost" @click="askDelete(result.person)"><Trash :size="15" /> Supprimer</button>
          </div>
        </div>
        <dl class="profile-facts">
          <div>
            <dt><Calendar :size="14" /> Naissance</dt>
            <dd>{{ formatDate(result.person.dateNaissance) }} <span class="muted">· {{ ageOf(result.person.dateNaissance) }} ans</span></dd>
          </div>
          <div><dt><MapPin :size="14" /> Adresse</dt><dd>{{ result.person.adresse }}</dd></div>
          <div><dt><Phone :size="14" /> Téléphone</dt><dd class="mono">{{ formatPhone(result.person.telephone) }}</dd></div>
        </dl>
      </article>
      <div v-else-if="result.state === 'missing'" :key="`m${result.id}`" class="empty glass">
        <span class="empty-icon"><UserX :size="22" /></span>
        <h3>Aucune personne avec l’identifiant {{ result.id }}</h3>
        <p>Le serveur a répondu <code>{"error": {"code": -32602, "message": "Personne introuvable"}}</code>.</p>
      </div>
    </Transition>

    <section v-if="lastCall" class="exchange">
      <JsonBlock title="→ requête" :meta="`POST /jsonrpc`" :code="lastCall.requestBody" />
      <JsonBlock
        title="← réponse"
        :meta="`HTTP ${lastCall.httpStatus ?? '—'} · ${lastCall.durationMs} ms`"
        :code="lastCall.responseBody"
        :empty="lastCall.errorMessage"
      />
    </section>
  </div>
</template>
