/**
 * Journal des échanges XML-RPC (store externe lu via useSyncExternalStore).
 * Chaque appel garde le XML envoyé et reçu pour la console de l'application.
 */
import { useSyncExternalStore } from 'react'
import type { XmlRpcValue } from './xmlrpc'

export type CallOutcome = 'ok' | 'fault' | 'error'

export interface RpcCall {
  id: number
  method: string
  startedAt: Date
  durationMs: number
  httpStatus: number | null
  requestXml: string
  responseXml: string | null
  outcome: CallOutcome
  result?: XmlRpcValue
  error?: string
  faultCode?: number
}

const MAX_CALLS = 100
let calls: RpcCall[] = []
let seq = 0
const listeners = new Set<() => void>()

export function recordCall(entry: Omit<RpcCall, 'id'>): void {
  calls = [{ ...entry, id: ++seq }, ...calls].slice(0, MAX_CALLS)
  listeners.forEach((l) => l())
}

/** Identifiant du dernier appel journalisé (pour le sélectionner dans la console). */
export function lastCallId(): number | null {
  return calls[0]?.id ?? null
}

export function clearCalls(): void {
  calls = []
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useRpcCalls(): RpcCall[] {
  return useSyncExternalStore(subscribe, () => calls)
}
