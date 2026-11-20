import type { Personne, PersonneInput } from '../types'

const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
const timeFmt = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

export function parseIsoDate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null
}

export const formatDate = (iso: string) => {
  const d = parseIsoDate(iso)
  return d ? dateFmt.format(d) : iso || '—'
}

export const formatTime = (d: Date) => timeFmt.format(d)

export function ageOf(iso: string, today = new Date()): number | null {
  const d = parseIsoDate(iso)
  if (!d) return null
  let age = today.getFullYear() - d.getFullYear()
  const m = today.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--
  return age
}

export function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, '')
  return d.length === 9 ? `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7)}` : raw
}

export const initials = (p: Pick<Personne, 'nom' | 'prenom'>) =>
  `${p.prenom.trim()[0] ?? ''}${p.nom.trim()[0] ?? ''}`.toUpperCase() || '?'

export function hueOf(text: string): number {
  let h = 0
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) % 360
  return h
}

export const fullName = (p: Pick<Personne, 'nom' | 'prenom'>) => `${p.prenom} ${p.nom.toUpperCase()}`

export const emptyPersonne = (): PersonneInput => ({
  nom: '',
  prenom: '',
  dateNaissance: '',
  adresse: '',
  telephone: '',
})

export type FieldErrors = Partial<Record<keyof PersonneInput, string>>

export function validatePersonne(p: PersonneInput): FieldErrors {
  const e: FieldErrors = {}
  if (!p.prenom.trim()) e.prenom = 'Le prénom est obligatoire'
  if (!p.nom.trim()) e.nom = 'Le nom est obligatoire'
  const d = parseIsoDate(p.dateNaissance)
  if (!d) e.dateNaissance = 'Date invalide'
  else if (d > new Date()) e.dateNaissance = 'La date ne peut pas être dans le futur'
  if (!p.adresse.trim()) e.adresse = 'L’adresse est obligatoire'
  if (!/^\+?[\d\s]{7,15}$/.test(p.telephone.trim())) e.telephone = 'Numéro invalide (ex. 771234567)'
  return e
}

export const normalizePersonne = (p: PersonneInput): PersonneInput => ({
  nom: p.nom.trim(),
  prenom: p.prenom.trim(),
  dateNaissance: p.dateNaissance,
  adresse: p.adresse.trim(),
  telephone: p.telephone.replace(/\s/g, ''),
})

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Coloration JSON — le texte est échappé avant l'ajout des <span> (sûr pour v-html). */
export function highlightJson(source: string): string {
  let text = source
  try {
    text = JSON.stringify(JSON.parse(source), null, 2)
  } catch {
    /* JSON invalide : on l'affiche tel quel */
  }
  return esc(text).replace(
    /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false)\b|\bnull\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g,
    (m, str?: string, colon?: string, bool?: string) => {
      if (str) return colon ? `<span class="j-key">${str}</span>${colon}` : `<span class="j-str">${str}</span>`
      if (bool) return `<span class="j-bool">${m}</span>`
      if (m === 'null') return `<span class="j-null">${m}</span>`
      return `<span class="j-num">${m}</span>`
    },
  )
}

export const prettyJson = (source: string) => {
  try {
    return JSON.stringify(JSON.parse(source), null, 2)
  } catch {
    return source
  }
}
