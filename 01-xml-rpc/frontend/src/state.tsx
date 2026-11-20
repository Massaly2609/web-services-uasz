import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { PersonneService } from './api/personneService'
import { XmlRpcFault, XmlRpcTransportError } from './api/xmlrpc'
import { fullName } from './lib/format'
import type { Personne, PersonneInput } from './types'

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

export type ToastKind = 'success' | 'error' | 'info'
export interface Toast {
  id: number
  kind: ToastKind
  title: string
  detail?: string
}

interface ToastCtx {
  toasts: Toast[]
  notify: (kind: ToastKind, title: string, detail?: string) => void
  dismiss: (id: number) => void
}

const ToastContext = createContext<ToastCtx | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const seq = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const notify = useCallback(
    (kind: ToastKind, title: string, detail?: string) => {
      const id = ++seq.current
      setToasts((t) => [...t.slice(-3), { id, kind, title, detail }])
      window.setTimeout(() => dismiss(id), kind === 'error' ? 7000 : 4500)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ toasts, notify, dismiss }), [toasts, notify, dismiss])
  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export function useToasts(): ToastCtx {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToasts hors ToastProvider')
  return ctx
}

/** Message lisible pour une erreur XML-RPC */
export function describeError(err: unknown): string {
  if (err instanceof XmlRpcFault) {
    // "Failed to invoke method modifier in class …: Text 'x' could not be parsed"
    const detail = err.message.split(': ').slice(1).join(': ') || err.message
    return `Fault ${err.faultCode} — ${detail}`
  }
  if (err instanceof Error) return err.message
  return String(err)
}

/* ------------------------------------------------------------------ */
/* Données (personnes)                                                 */
/* ------------------------------------------------------------------ */

interface DataCtx {
  persons: Personne[]
  loading: boolean
  /** null = vérification en cours */
  online: boolean | null
  lastSync: Date | null
  refresh: () => Promise<void>
  add: (p: PersonneInput) => Promise<number>
  update: (id: number, p: PersonneInput) => Promise<void>
  remove: (p: Personne) => Promise<void>
}

const DataContext = createContext<DataCtx | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const { notify } = useToasts()
  const [persons, setPersons] = useState<Personne[]>([])
  const [loading, setLoading] = useState(true)
  const [online, setOnline] = useState<boolean | null>(null)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  const track = useCallback((err: unknown) => {
    if (err instanceof XmlRpcTransportError) setOnline(false)
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const list = await PersonneService.lister()
      setPersons(list)
      setOnline(true)
      setLastSync(new Date())
    } catch (err) {
      track(err)
      if (!(err instanceof XmlRpcTransportError)) notify('error', 'Chargement impossible', describeError(err))
    } finally {
      setLoading(false)
    }
  }, [notify, track])

  useEffect(() => {
    void refresh()
  }, [refresh])

  // Retour sur l'onglet (ex. après un test dans Postman) → on resynchronise
  const lastFocusSync = useRef(0)
  useEffect(() => {
    const onFocus = () => {
      if (document.visibilityState !== 'visible') return
      if (Date.now() - lastFocusSync.current < 2000) return
      lastFocusSync.current = Date.now()
      void refresh()
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [refresh])

  const add = useCallback(
    async (p: PersonneInput) => {
      try {
        const id = await PersonneService.ajouter(p)
        notify('success', `${fullName(p)} a été ajouté(e)`, `Personne.ajouter → id #${id}`)
        await refresh()
        return id
      } catch (err) {
        track(err)
        notify('error', 'Ajout impossible', describeError(err))
        throw err
      }
    },
    [notify, refresh, track],
  )

  const update = useCallback(
    async (id: number, p: PersonneInput) => {
      try {
        const ok = await PersonneService.modifier(id, p)
        if (!ok) throw new Error(`Aucune personne avec l’id #${id}`)
        notify('success', 'Fiche mise à jour', `Personne.modifier(#${id}) → true`)
        await refresh()
      } catch (err) {
        track(err)
        notify('error', 'Modification impossible', describeError(err))
        throw err
      }
    },
    [notify, refresh, track],
  )

  const remove = useCallback(
    async (p: Personne) => {
      try {
        const ok = await PersonneService.supprimer(p.id)
        if (!ok) throw new Error(`Aucune personne avec l’id #${p.id}`)
        notify('success', `${fullName(p)} a été supprimé(e)`, `Personne.supprimer(#${p.id}) → true`)
        await refresh()
      } catch (err) {
        track(err)
        notify('error', 'Suppression impossible', describeError(err))
        throw err
      }
    },
    [notify, refresh, track],
  )

  const value = useMemo(
    () => ({ persons, loading, online, lastSync, refresh, add, update, remove }),
    [persons, loading, online, lastSync, refresh, add, update, remove],
  )
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData(): DataCtx {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData hors DataProvider')
  return ctx
}

/* ------------------------------------------------------------------ */
/* UI globale : tiroir d'édition + confirmation de suppression         */
/* ------------------------------------------------------------------ */

interface UiCtx {
  openCreate: () => void
  openEdit: (p: Personne) => void
  askDelete: (p: Personne) => void
}

export const UiContext = createContext<UiCtx | null>(null)

export function useUi(): UiCtx {
  const ctx = useContext(UiContext)
  if (!ctx) throw new Error('useUi hors UiContext')
  return ctx
}
