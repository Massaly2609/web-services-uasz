import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Le serveur XML-RPC (org.apache.xmlrpc.webserver.WebServer, port 8081)
 * n'envoie aucun en-tête CORS : un appel direct depuis le navigateur est bloqué.
 * Le proxy de Vite relaie donc /RPC2 vers le backend (même origine pour le navigateur).
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/RPC2': {
        target: process.env.XMLRPC_TARGET ?? 'http://localhost:8081',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4173,
    proxy: {
      '/RPC2': {
        target: process.env.XMLRPC_TARGET ?? 'http://localhost:8081',
        changeOrigin: true,
      },
    },
  },
})
