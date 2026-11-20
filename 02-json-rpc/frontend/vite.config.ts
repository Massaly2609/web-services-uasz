import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

/**
 * Le backend Spring Boot (port 8082) n'a pas de configuration CORS :
 * le navigateur bloquerait la requête pré-vérifiée (OPTIONS) d'un POST application/json.
 * Le proxy de Vite relaie /jsonrpc vers le backend → même origine pour le navigateur.
 */
const target = process.env.JSONRPC_TARGET ?? 'http://localhost:8082'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5174,
    proxy: { '/jsonrpc': { target, changeOrigin: true } },
  },
  preview: {
    port: 4174,
    proxy: { '/jsonrpc': { target, changeOrigin: true } },
  },
})
