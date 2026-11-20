import { computed, ref, shallowRef } from 'vue'

export type Outcome = 'ok' | 'rpc-error' | 'transport'

export interface RpcCall {
  seq: number
  method: string
  startedAt: Date
  durationMs: number
  httpStatus: number | null
  requestBody: string
  responseBody: string | null
  outcome: Outcome
  errorCode?: number
  errorMessage?: string
}

const MAX = 100
let seq = 0

/** Journal des échanges, du plus récent au plus ancien. */
export const calls = shallowRef<RpcCall[]>([])
export const inspectorOpen = ref(false)

export function recordCall(entry: Omit<RpcCall, 'seq'>): void {
  calls.value = [{ ...entry, seq: ++seq }, ...calls.value].slice(0, MAX)
}

export function clearCalls(): void {
  calls.value = []
}

export const callStats = computed(() => {
  const list = calls.value
  const ok = list.filter((c) => c.outcome === 'ok').length
  const avg = list.length ? Math.round(list.reduce((s, c) => s + c.durationMs, 0) / list.length) : null
  return { total: list.length, ok, errors: list.length - ok, avg }
})
