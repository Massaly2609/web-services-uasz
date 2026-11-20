import { ref, watch } from 'vue'
import type { Personne, ViewId } from '../types'

/* ---------- Navigation par hash (#/personnes…) ---------- */

const VIEWS: ViewId[] = ['apercu', 'personnes', 'recherche', 'playground']
const fromHash = (): ViewId => {
  const v = window.location.hash.replace('#/', '') as ViewId
  return VIEWS.includes(v) ? v : 'apercu'
}

export const view = ref<ViewId>(fromHash())
window.addEventListener('hashchange', () => (view.value = fromHash()))

export function go(v: ViewId): void {
  window.location.hash = `#/${v}`
  view.value = v
  window.scrollTo({ top: 0 })
}

/* ---------- Thème ---------- */

type Theme = 'dark' | 'light'
const readTheme = (): Theme => {
  try {
    const t = localStorage.getItem('jsonrpc-theme')
    if (t === 'dark' || t === 'light') return t
  } catch {
    /* stockage indisponible */
  }
  return 'dark'
}

export const theme = ref<Theme>(readTheme())
watch(
  theme,
  (t) => {
    document.documentElement.dataset.theme = t
    try {
      localStorage.setItem('jsonrpc-theme', t)
    } catch {
      /* stockage indisponible */
    }
  },
  { immediate: true },
)

/* ---------- Modale d'édition & confirmation ---------- */

export const editor = ref<{ open: boolean; person: Personne | null }>({ open: false, person: null })
export const pendingDelete = ref<Personne | null>(null)

export const openCreate = () => (editor.value = { open: true, person: null })
export const openEdit = (p: Personne) => (editor.value = { open: true, person: p })
export const closeEditor = () => (editor.value = { ...editor.value, open: false })
export const askDelete = (p: Personne) => (pendingDelete.value = p)
