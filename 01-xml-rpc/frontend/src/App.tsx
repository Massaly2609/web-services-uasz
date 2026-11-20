import { useCallback, useEffect, useMemo, useState } from 'react'
import Sidebar from './components/Sidebar'
import PersonDrawer from './components/PersonDrawer'
import ConfirmDialog from './components/ConfirmDialog'
import Toaster from './components/Toaster'
import OfflineBanner from './components/OfflineBanner'
import DashboardPage from './pages/DashboardPage'
import AnnuairePage from './pages/AnnuairePage'
import RecherchePage from './pages/RecherchePage'
import ConsolePage from './pages/ConsolePage'
import { UiContext, useData } from './state'
import type { PageId, Personne } from './types'

const PAGES: PageId[] = ['dashboard', 'annuaire', 'recherche', 'console']
const pageFromHash = (): PageId => {
  const h = window.location.hash.replace('#/', '') as PageId
  return PAGES.includes(h) ? h : 'dashboard'
}

type Theme = 'light' | 'dark'
const readTheme = (): Theme => {
  try {
    const t = localStorage.getItem('xmlrpc-theme')
    if (t === 'light' || t === 'dark') return t
  } catch {
    /* stockage indisponible */
  }
  return 'light'
}

export default function App() {
  const { remove } = useData()
  const [page, setPage] = useState<PageId>(pageFromHash)
  const [theme, setTheme] = useState<Theme>(readTheme)
  const [drawer, setDrawer] = useState<{ open: boolean; person: Personne | null }>({
    open: false,
    person: null,
  })
  const [toDelete, setToDelete] = useState<Personne | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const onHash = () => setPage(pageFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem('xmlrpc-theme', theme)
    } catch {
      /* stockage indisponible */
    }
  }, [theme])

  const navigate = useCallback((p: PageId) => {
    window.location.hash = `#/${p}`
    setPage(p)
    window.scrollTo({ top: 0 })
  }, [])

  const ui = useMemo(
    () => ({
      openCreate: () => setDrawer({ open: true, person: null }),
      openEdit: (p: Personne) => setDrawer({ open: true, person: p }),
      askDelete: (p: Personne) => setToDelete(p),
    }),
    [],
  )

  const confirmDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await remove(toDelete)
      setToDelete(null)
    } catch {
      /* toast déjà affiché */
    } finally {
      setDeleting(false)
    }
  }

  return (
    <UiContext.Provider value={ui}>
      <div className="app">
        <Sidebar
          page={page}
          onNavigate={navigate}
          theme={theme}
          onToggleTheme={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
        />
        <main className="main">
          <OfflineBanner />
          {page === 'dashboard' && <DashboardPage onNavigate={navigate} />}
          {page === 'annuaire' && <AnnuairePage />}
          {page === 'recherche' && <RecherchePage />}
          {page === 'console' && <ConsolePage />}
        </main>
      </div>

      <PersonDrawer
        open={drawer.open}
        person={drawer.person}
        onClose={() => setDrawer((d) => ({ ...d, open: false }))}
      />
      <ConfirmDialog
        person={toDelete}
        busy={deleting}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
      <Toaster />
    </UiContext.Provider>
  )
}
