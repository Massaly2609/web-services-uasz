/**
 * Client JSON-RPC 2.0 écrit à la main (fetch) pour rendre le protocole visible :
 *
 *   requête : { "jsonrpc": "2.0", "method": "Personne.lister", "params": {}, "id": 3 }
 *   succès  : { "jsonrpc": "2.0", "result": [...], "id": 3 }
 *   erreur  : { "jsonrpc": "2.0", "error": { "code": -32601, "message": "Method not found" }, "id": 3 }
 */
import { recordCall } from '../stores/inspector'

export const JSONRPC_ENDPOINT: string = import.meta.env.VITE_JSONRPC_URL ?? '/jsonrpc'

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

export interface JsonRpcRequest {
  jsonrpc: '2.0'
  method: string
  params?: Record<string, JsonValue> | JsonValue[]
  id: number | string | null
}

/** Erreur applicative renvoyée dans le champ "error" de la réponse. */
export class JsonRpcError extends Error {
  readonly code: number
  constructor(code: number, message: string) {
    super(message)
    this.name = 'JsonRpcError'
    this.code = code
  }
}

/** Erreur de transport : serveur arrêté, HTTP ≠ 200, corps non JSON… */
export class TransportError extends Error {
  readonly httpStatus: number | null
  constructor(message: string, httpStatus: number | null = null) {
    super(message)
    this.name = 'TransportError'
    this.httpStatus = httpStatus
  }
}

/** Codes définis par la spécification JSON-RPC 2.0 (section 5.1). */
export const ERROR_CODES: { code: number; name: string; meaning: string }[] = [
  { code: -32700, name: 'Parse error', meaning: 'JSON invalide reçu par le serveur' },
  { code: -32600, name: 'Invalid Request', meaning: 'Enveloppe incorrecte (jsonrpc, method, id…)' },
  { code: -32601, name: 'Method not found', meaning: 'La méthode n’existe pas' },
  { code: -32602, name: 'Invalid params', meaning: 'Paramètres invalides ou personne introuvable' },
  { code: -32603, name: 'Internal error', meaning: 'Erreur interne (ex. date mal formée)' },
]

let nextId = 1

export function buildRequest(method: string, params: Record<string, JsonValue> = {}): JsonRpcRequest {
  return { jsonrpc: '2.0', method, params, id: nextId++ }
}

/** Appel typé : construit l'enveloppe, l'envoie et renvoie "result" (ou lève JsonRpcError). */
export async function call<T>(method: string, params: Record<string, JsonValue> = {}): Promise<T> {
  const req = buildRequest(method, params)
  return (await execute(JSON.stringify(req, null, 2), method)) as T
}

/** Envoie un texte saisi à la main (playground), même s'il n'est pas du JSON valide. */
export async function callRaw(body: string): Promise<JsonValue> {
  let method = '(JSON brut)'
  try {
    const parsed = JSON.parse(body) as Partial<JsonRpcRequest>
    if (typeof parsed.method === 'string') method = parsed.method
  } catch {
    method = '(JSON invalide)'
  }
  return execute(body, method)
}

async function execute(body: string, method: string): Promise<JsonValue> {
  const startedAt = new Date()
  const t0 = performance.now()
  let httpStatus: number | null = null
  let responseText: string | null = null
  const done = () => Math.round(performance.now() - t0)

  try {
    let res: Response
    try {
      res = await fetch(JSONRPC_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body,
      })
    } catch {
      throw new TransportError('Serveur JSON-RPC injoignable')
    }
    httpStatus = res.status
    responseText = await res.text()

    if (res.status >= 500 && !responseText.trim().startsWith('{"jsonrpc"')) {
      throw new TransportError(`Serveur JSON-RPC injoignable (HTTP ${res.status})`, res.status)
    }
    let json: { result?: JsonValue; error?: { code: number; message: string } }
    try {
      json = JSON.parse(responseText)
    } catch {
      throw new TransportError(`HTTP ${res.status} — réponse non JSON`, res.status)
    }
    if (res.status !== 200) {
      // Spring renvoie 400 quand le corps n'est pas du JSON (au lieu de -32700)
      throw new TransportError(`HTTP ${res.status} — requête rejetée par Spring avant le contrôleur`, res.status)
    }
    if (json.error) throw new JsonRpcError(json.error.code, json.error.message)

    const result = json.result ?? null
    recordCall({ method, startedAt, durationMs: done(), httpStatus, requestBody: body, responseBody: responseText, outcome: 'ok' })
    return result
  } catch (err) {
    recordCall({
      method,
      startedAt,
      durationMs: done(),
      httpStatus,
      requestBody: body,
      responseBody: responseText,
      outcome: err instanceof JsonRpcError ? 'rpc-error' : 'transport',
      errorCode: err instanceof JsonRpcError ? err.code : undefined,
      errorMessage: err instanceof Error ? err.message : String(err),
    })
    throw err
  }
}
