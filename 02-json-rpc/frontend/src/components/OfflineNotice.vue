<script setup lang="ts">
import { RefreshCw, WifiOff } from '@lucide/vue'
import { loading, online, refresh } from '../stores/personnes'
</script>

<template>
  <div v-if="online === false" class="offline" role="alert">
    <WifiOff :size="18" />
    <div>
      <strong>Le serveur JSON-RPC ne répond pas.</strong>
      <span>Démarrez <code>JsonRpcApplication</code> (Spring Boot, port 8082) puis réessayez.</span>
    </div>
    <button class="btn sm" :disabled="loading" @click="refresh()">
      <RefreshCw :size="14" :class="{ spin: loading }" /> Réessayer
    </button>
  </div>
</template>
