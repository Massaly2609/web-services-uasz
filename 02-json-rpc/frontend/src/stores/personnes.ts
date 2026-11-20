/**
 * Store minimal (composition API, sans Pinia) : liste des personnes,
 * état du serveur et actions CRUD qui passent toutes par JSON-RPC.
 */
import { ref } from 'vue'
import { PersonneService } from '../api/personneService'
import { JsonRpcError, TransportError } from '../api/jsonrpc'
import { fullName } from '../lib/format'
import type { Personne, PersonneInput } from '../types'
import { notify } from './toasts'

export const persons = ref<Personne[]>([])
export const loading = ref(true)
/** null = vérification en cours */
export const online = ref<boolean | null>(null)
export const lastSync = ref<Date | null>(null)

export function describeError(err: unknown): string {
  if (err instanceof JsonRpcError) return `${err.code} · ${err.message}`
  if (err instanceof Error) return err.message
  return String(err)
}

function track(err: unknown) {
  if (err instanceof TransportError && (err.httpStatus === null || err.httpStatus >= 500)) online.value = false
}

export async function refresh(): Promise<void> {
  loading.value = true
  try {
    persons.value = await PersonneService.lister()
    online.value = true
    lastSync.value = new Date()
  } catch (err) {
    track(err)
    if (!(err instanceof TransportError)) notify('error', 'Chargement impossible', describeError(err))
  } finally {
    loading.value = false
  }
}

export async function add(p: PersonneInput): Promise<number> {
  try {
    const id = await PersonneService.ajouter(p)
    notify('success', `${fullName(p)} a été ajouté(e)`, `Personne.ajouter → result: ${id}`)
    await refresh()
    return id
  } catch (err) {
    track(err)
    notify('error', 'Ajout impossible', describeError(err))
    throw err
  }
}

export async function update(id: number, p: PersonneInput): Promise<void> {
  try {
    await PersonneService.modifier(id, p)
    notify('success', 'Fiche mise à jour', `Personne.modifier({ id: ${id}, … }) → true`)
    await refresh()
  } catch (err) {
    track(err)
    notify('error', 'Modification impossible', describeError(err))
    throw err
  }
}

export async function remove(p: Personne): Promise<void> {
  try {
    await PersonneService.supprimer(p.id)
    notify('success', `${fullName(p)} a été supprimé(e)`, `Personne.supprimer({ id: ${p.id} }) → true`)
    await refresh()
  } catch (err) {
    track(err)
    notify('error', 'Suppression impossible', describeError(err))
    throw err
  }
}

// Retour sur l'onglet (ex. après un test Postman) → resynchronisation
let lastFocus = 0
function onFocus() {
  if (document.visibilityState !== 'visible' || Date.now() - lastFocus < 2000) return
  lastFocus = Date.now()
  void refresh()
}
window.addEventListener('focus', onFocus)
document.addEventListener('visibilitychange', onFocus)
