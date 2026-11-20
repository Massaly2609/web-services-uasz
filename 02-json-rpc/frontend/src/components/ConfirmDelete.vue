<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Trash } from '@lucide/vue'
import { fullName } from '../lib/format'
import { remove } from '../stores/personnes'
import { pendingDelete } from '../stores/ui'

const busy = ref(false)
const envelope = computed(() =>
  pendingDelete.value
    ? JSON.stringify({ method: 'Personne.supprimer', params: { id: pendingDelete.value.id } })
    : '',
)

async function confirm() {
  if (!pendingDelete.value) return
  busy.value = true
  try {
    await remove(pendingDelete.value)
    pendingDelete.value = null
  } catch {
    /* toast déjà affiché */
  } finally {
    busy.value = false
  }
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && pendingDelete.value && !busy.value) pendingDelete.value = null
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <Transition name="modal">
    <div v-if="pendingDelete" class="modal-root">
      <div class="scrim" @click="!busy && (pendingDelete = null)" />
      <div class="modal confirm" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
        <div class="confirm-icon"><Trash :size="20" /></div>
        <h2 id="confirm-title">Supprimer {{ fullName(pendingDelete) }} ?</h2>
        <p>
          Cette action envoie
          <code>{{ envelope }}</code>
          et retire définitivement la fiche de la base H2.
        </p>
        <div class="confirm-actions">
          <button class="btn ghost" :disabled="busy" autofocus @click="pendingDelete = null">Annuler</button>
          <button class="btn danger" :disabled="busy" @click="confirm">
            <span v-if="busy" class="spinner" />
            Supprimer
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>
