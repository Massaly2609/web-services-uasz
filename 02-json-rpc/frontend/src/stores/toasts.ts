import { ref } from 'vue'

export type ToastKind = 'success' | 'error' | 'info'
export interface Toast {
  id: number
  kind: ToastKind
  title: string
  detail?: string
}

let seq = 0
export const toasts = ref<Toast[]>([])

export function dismiss(id: number): void {
  toasts.value = toasts.value.filter((t) => t.id !== id)
}

export function notify(kind: ToastKind, title: string, detail?: string): void {
  const id = ++seq
  toasts.value = [...toasts.value.slice(-3), { id, kind, title, detail }]
  window.setTimeout(() => dismiss(id), kind === 'error' ? 7000 : 4500)
}
