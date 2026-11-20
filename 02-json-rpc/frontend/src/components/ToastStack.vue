<script setup lang="ts">
import { CircleCheck, CircleX, Info, X } from '@lucide/vue'
import { dismiss, toasts } from '../stores/toasts'

const icons = { success: CircleCheck, error: CircleX, info: Info }
</script>

<template>
  <TransitionGroup tag="div" name="toast" class="toasts" role="status" aria-live="polite">
    <div v-for="t in toasts" :key="t.id" class="toast" :class="`is-${t.kind}`">
      <component :is="icons[t.kind]" :size="18" class="toast-icon" />
      <div class="toast-body">
        <div class="toast-title">{{ t.title }}</div>
        <div v-if="t.detail" class="toast-detail">{{ t.detail }}</div>
      </div>
      <button class="toast-close" aria-label="Fermer" @click="dismiss(t.id)"><X :size="14" /></button>
    </div>
  </TransitionGroup>
</template>
