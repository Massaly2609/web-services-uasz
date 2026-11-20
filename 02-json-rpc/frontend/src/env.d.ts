/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL du point d'entrée JSON-RPC (par défaut /jsonrpc, relayé par le proxy Vite) */
  readonly VITE_JSONRPC_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
