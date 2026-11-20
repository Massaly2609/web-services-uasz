<script setup lang="ts">
import { computed } from 'vue'
import { hueOf, initials } from '../lib/format'

const props = withDefaults(defineProps<{ nom: string; prenom: string; size?: number }>(), { size: 40 })
const hue = computed(() => hueOf(props.nom + props.prenom))
</script>

<template>
  <span
    class="avatar"
    :style="{ width: `${size}px`, height: `${size}px`, fontSize: `${size * 0.36}px`, '--h': hue }"
    aria-hidden="true"
  >
    {{ initials({ nom, prenom }) }}
  </span>
</template>
