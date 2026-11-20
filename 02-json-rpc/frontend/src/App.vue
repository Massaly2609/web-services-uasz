<script setup lang="ts">
import AppHeader from './components/AppHeader.vue'
import OfflineNotice from './components/OfflineNotice.vue'
import PersonEditor from './components/PersonEditor.vue'
import ConfirmDelete from './components/ConfirmDelete.vue'
import InspectorDrawer from './components/InspectorDrawer.vue'
import ToastStack from './components/ToastStack.vue'
import ApercuView from './views/ApercuView.vue'
import PersonnesView from './views/PersonnesView.vue'
import RechercheView from './views/RechercheView.vue'
import PlaygroundView from './views/PlaygroundView.vue'
import { view } from './stores/ui'
</script>

<template>
  <div class="backdrop" aria-hidden="true" />
  <AppHeader />
  <main class="main">
    <OfflineNotice />
    <Transition name="view" mode="out-in">
      <ApercuView v-if="view === 'apercu'" />
      <PersonnesView v-else-if="view === 'personnes'" />
      <RechercheView v-else-if="view === 'recherche'" />
      <PlaygroundView v-else />
    </Transition>
  </main>
  <footer class="footer">
    <span>Master 1 · Web Services · UASZ</span>
    <span class="mono">Vue 3 · TypeScript · JSON-RPC 2.0 · Spring Boot</span>
  </footer>

  <PersonEditor />
  <ConfirmDelete />
  <InspectorDrawer />
  <ToastStack />
</template>
