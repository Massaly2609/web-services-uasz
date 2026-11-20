<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Braces, X } from '@lucide/vue'
import PersonAvatar from './PersonAvatar.vue'
import { emptyPersonne, fullName, highlightJson, normalizePersonne, validatePersonne, type FieldErrors } from '../lib/format'
import { add, update } from '../stores/personnes'
import { closeEditor, editor } from '../stores/ui'
import type { PersonneInput } from '../types'

const form = ref<PersonneInput>(emptyPersonne())
const errors = ref<FieldErrors>({})
const touched = ref(false)
const saving = ref(false)
const showJson = ref(true)

const person = computed(() => editor.value.person)
const editing = computed(() => person.value !== null)
const today = new Date().toISOString().slice(0, 10)

const fields: { key: keyof PersonneInput; label: string; type?: string; placeholder: string; wide?: boolean }[] = [
  { key: 'prenom', label: 'Prénom', placeholder: 'Amadou' },
  { key: 'nom', label: 'Nom', placeholder: 'DIOP' },
  { key: 'dateNaissance', label: 'Date de naissance', type: 'date', placeholder: '' },
  { key: 'telephone', label: 'Téléphone', type: 'tel', placeholder: '77 123 45 67' },
  { key: 'adresse', label: 'Adresse', placeholder: 'Ziguinchor', wide: true },
]

watch(
  () => editor.value.open,
  async (open) => {
    if (!open) return
    const p = person.value
    form.value = p
      ? { nom: p.nom, prenom: p.prenom, dateNaissance: p.dateNaissance, adresse: p.adresse, telephone: p.telephone }
      : emptyPersonne()
    errors.value = {}
    touched.value = false
    await nextTick()
    document.querySelector<HTMLInputElement>('.editor-form input')?.focus()
  },
)

watch(
  form,
  (f) => {
    if (touched.value) errors.value = validatePersonne(f)
  },
  { deep: true },
)

/** Enveloppe JSON-RPC qui sera envoyée — mise à jour en direct */
const preview = computed(() => {
  const p = normalizePersonne(form.value)
  const params = editing.value ? { id: person.value!.id, ...p } : p
  return JSON.stringify(
    { jsonrpc: '2.0', method: editing.value ? 'Personne.modifier' : 'Personne.ajouter', params, id: '…' },
    null,
    2,
  )
})

const title = computed(() =>
  form.value.prenom || form.value.nom
    ? fullName(form.value)
    : editing.value && person.value
      ? fullName(person.value)
      : 'Nouvelle personne',
)

async function submit() {
  touched.value = true
  errors.value = validatePersonne(form.value)
  if (Object.keys(errors.value).length) return
  saving.value = true
  try {
    const data = normalizePersonne(form.value)
    if (editing.value && person.value) await update(person.value.id, data)
    else await add(data)
    closeEditor()
  } catch {
    /* toast déjà affiché : la modale reste ouverte */
  } finally {
    saving.value = false
  }
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && editor.value.open && !saving.value) closeEditor()
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <Transition name="modal">
    <div v-if="editor.open" class="modal-root">
      <div class="scrim" @click="!saving && closeEditor()" />
      <div class="modal person-editor" role="dialog" aria-modal="true" :aria-label="editing ? 'Modifier la fiche' : 'Nouvelle personne'">
        <header class="modal-head">
          <PersonAvatar :nom="form.nom || '+'" :prenom="form.prenom" :size="46" />
          <div class="modal-heading">
            <span class="eyebrow">{{ editing ? `Personne.modifier · id ${person?.id}` : 'Personne.ajouter' }}</span>
            <h2>{{ title }}</h2>
          </div>
          <button class="icon-btn" aria-label="Fermer" :disabled="saving" @click="closeEditor">
            <X :size="18" />
          </button>
        </header>

        <form class="editor-grid" novalidate @submit.prevent="submit">
          <div class="editor-form">
            <label
              v-for="f in fields"
              :key="f.key"
              class="field"
              :class="{ 'is-wide': f.wide, 'has-error': errors[f.key] }"
            >
              <span class="field-label">{{ f.label }}</span>
              <input
                v-model="form[f.key]"
                :type="f.type ?? 'text'"
                :placeholder="f.placeholder"
                :max="f.type === 'date' ? today : undefined"
                autocomplete="off"
              />
              <span v-if="errors[f.key]" class="field-error">{{ errors[f.key] }}</span>
            </label>
          </div>

          <div class="editor-preview" :class="{ 'is-collapsed': !showJson }">
            <button type="button" class="preview-toggle" @click="showJson = !showJson">
              <Braces :size="15" />
              Requête JSON-RPC envoyée
              <span class="mono muted">{{ showJson ? 'masquer' : 'afficher' }}</span>
            </button>
            <pre v-if="showJson" class="json-body"><code v-html="highlightJson(preview)" /></pre>
          </div>

          <footer class="modal-foot">
            <button type="button" class="btn ghost" :disabled="saving" @click="closeEditor">Annuler</button>
            <button type="submit" class="btn primary" :disabled="saving">
              <span v-if="saving" class="spinner" />
              {{ editing ? 'Enregistrer les modifications' : 'Ajouter la personne' }}
            </button>
          </footer>
        </form>
      </div>
    </div>
  </Transition>
</template>
