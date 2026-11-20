<script setup lang="ts">
import { computed, ref } from 'vue'
import { Check, Copy } from '@lucide/vue'
import { highlightJson, prettyJson } from '../lib/format'

const props = defineProps<{ title: string; code: string | null; meta?: string; empty?: string }>()
const html = computed(() => (props.code === null ? null : highlightJson(props.code)))
const copied = ref(false)

async function copy() {
  if (props.code === null) return
  try {
    await navigator.clipboard.writeText(prettyJson(props.code))
    copied.value = true
    window.setTimeout(() => (copied.value = false), 1500)
  } catch {
    /* presse-papiers indisponible */
  }
}
</script>

<template>
  <div class="json-block">
    <div class="json-head">
      <span class="json-title">{{ title }}</span>
      <span v-if="meta" class="json-meta">{{ meta }}</span>
      <button v-if="code !== null" class="json-copy" @click="copy">
        <Check v-if="copied" :size="13" />
        <Copy v-else :size="13" />
        {{ copied ? 'Copié' : 'Copier' }}
      </button>
    </div>
    <pre v-if="html !== null" class="json-body"><code v-html="html" /></pre>
    <div v-else class="json-empty">{{ empty ?? 'Aucun contenu' }}</div>
  </div>
</template>
