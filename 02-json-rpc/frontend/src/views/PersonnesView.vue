<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { LayoutGrid, List, MapPin, Pencil, Phone, Plus, RefreshCw, Search, Trash, Users } from '@lucide/vue'
import PersonAvatar from '../components/PersonAvatar.vue'
import { ageOf, formatDate, formatPhone, formatTime, fullName } from '../lib/format'
import { lastSync, loading, persons, refresh } from '../stores/personnes'
import { askDelete, openCreate, openEdit } from '../stores/ui'

type SortKey = 'recent' | 'nom' | 'age'
type Layout = 'grid' | 'table'

const query = ref('')
const sort = ref<SortKey>('recent')
const layout = ref<Layout>('grid')
const searchInput = ref<HTMLInputElement | null>(null)

const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const rows = computed(() => {
  const q = normalize(query.value.trim())
  const list = q
    ? persons.value.filter((p) => normalize(`${p.nom} ${p.prenom} ${p.adresse} ${p.telephone} #${p.id}`).includes(q))
    : [...persons.value]
  if (sort.value === 'recent') list.sort((a, b) => b.id - a.id)
  if (sort.value === 'nom') list.sort((a, b) => a.nom.localeCompare(b.nom, 'fr') || a.prenom.localeCompare(b.prenom, 'fr'))
  if (sort.value === 'age') list.sort((a, b) => a.dateNaissance.localeCompare(b.dateNaissance))
  return list
})

function onKey(e: KeyboardEvent) {
  const tag = (e.target as HTMLElement).tagName
  if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
    e.preventDefault()
    searchInput.value?.focus()
  }
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="page">
    <header class="page-head">
      <div>
        <span class="eyebrow">Personne.lister</span>
        <h1>Personnes</h1>
        <p>Créez, modifiez et supprimez des fiches ; chaque action est un appel JSON-RPC visible dans l’inspecteur.</p>
      </div>
      <button class="btn primary" @click="openCreate"><Plus :size="17" /> Nouvelle personne</button>
    </header>

    <div class="toolbar">
      <label class="search">
        <Search :size="16" />
        <input ref="searchInput" v-model="query" placeholder="Filtrer par nom, ville, téléphone…" aria-label="Filtrer les personnes" />
        <kbd>/</kbd>
      </label>
      <div class="segmented" role="group" aria-label="Trier">
        <button :class="{ 'is-active': sort === 'recent' }" @click="sort = 'recent'">Récents</button>
        <button :class="{ 'is-active': sort === 'nom' }" @click="sort = 'nom'">Nom</button>
        <button :class="{ 'is-active': sort === 'age' }" @click="sort = 'age'">Âge</button>
      </div>
      <div class="segmented icons" role="group" aria-label="Affichage">
        <button :class="{ 'is-active': layout === 'grid' }" title="Cartes" aria-label="Affichage en cartes" @click="layout = 'grid'">
          <LayoutGrid :size="16" />
        </button>
        <button :class="{ 'is-active': layout === 'table' }" title="Tableau" aria-label="Affichage en tableau" @click="layout = 'table'">
          <List :size="16" />
        </button>
      </div>
      <button class="icon-btn bordered" title="Actualiser" aria-label="Actualiser" :disabled="loading" @click="refresh()">
        <RefreshCw :size="16" :class="{ spin: loading }" />
      </button>
    </div>

    <div v-if="loading && !persons.length" class="cards">
      <div v-for="i in 6" :key="i" class="card-skeleton" />
    </div>

    <div v-else-if="!rows.length" class="empty glass">
      <span class="empty-icon"><Users v-if="!query" :size="22" /><Search v-else :size="22" /></span>
      <h3>{{ query ? `Aucun résultat pour « ${query} »` : 'Aucune personne enregistrée' }}</h3>
      <p>
        {{ query ? 'Le filtre s’applique localement sur la liste reçue.' : 'La base H2 est en mémoire : elle est vide à chaque démarrage du serveur.' }}
      </p>
      <button v-if="!query" class="btn primary" @click="openCreate"><Plus :size="16" /> Ajouter une personne</button>
    </div>

    <TransitionGroup v-else-if="layout === 'grid'" tag="div" name="list" class="cards">
      <article v-for="p in rows" :key="p.id" class="person-card glass">
        <div class="person-top">
          <PersonAvatar :nom="p.nom" :prenom="p.prenom" :size="48" />
          <div class="person-ident">
            <h3>{{ fullName(p) }}</h3>
            <span class="mono muted small">id {{ p.id }}</span>
          </div>
          <span v-if="ageOf(p.dateNaissance) !== null" class="age-chip">{{ ageOf(p.dateNaissance) }} ans</span>
        </div>
        <dl class="person-facts">
          <div><dt>Né(e) le</dt><dd>{{ formatDate(p.dateNaissance) }}</dd></div>
          <div><dt><MapPin :size="13" /></dt><dd>{{ p.adresse }}</dd></div>
          <div><dt><Phone :size="13" /></dt><dd class="mono">{{ formatPhone(p.telephone) }}</dd></div>
        </dl>
        <div class="person-actions">
          <button class="btn sm" @click="openEdit(p)"><Pencil :size="14" /> Modifier</button>
          <button class="btn sm danger-ghost" :aria-label="`Supprimer ${fullName(p)}`" @click="askDelete(p)">
            <Trash :size="14" />
          </button>
        </div>
      </article>
    </TransitionGroup>

    <div v-else class="table-wrap glass">
      <table class="table">
        <thead>
          <tr>
            <th>Personne</th>
            <th>Naissance</th>
            <th>Adresse</th>
            <th>Téléphone</th>
            <th><span class="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in rows" :key="p.id">
            <td>
              <div class="cell-person">
                <PersonAvatar :nom="p.nom" :prenom="p.prenom" :size="34" />
                <div>
                  <div class="strong">{{ fullName(p) }}</div>
                  <div class="mono muted small">id {{ p.id }}</div>
                </div>
              </div>
            </td>
            <td>{{ formatDate(p.dateNaissance) }}<div class="muted small">{{ ageOf(p.dateNaissance) }} ans</div></td>
            <td>{{ p.adresse }}</td>
            <td class="mono">{{ formatPhone(p.telephone) }}</td>
            <td class="cell-actions">
              <button class="icon-btn" :aria-label="`Modifier ${fullName(p)}`" @click="openEdit(p)"><Pencil :size="16" /></button>
              <button class="icon-btn danger" :aria-label="`Supprimer ${fullName(p)}`" @click="askDelete(p)"><Trash :size="16" /></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="list-foot mono muted small">
      {{ rows.length }} / {{ persons.length }} personne(s)
      <template v-if="lastSync"> · synchronisé à {{ formatTime(lastSync) }}</template>
    </p>
  </div>
</template>
