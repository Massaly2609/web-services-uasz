import type { Personne, PersonneInput } from '../types'

const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
const timeFmt = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

export function parseIsoDate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return null
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}

export function formatDate(iso: string): string {
  const d = parseIsoDate(iso)
  return d ? dateFmt.format(d) : iso || '—'
}

export function formatTime(d: Date): string {
  return timeFmt.format(d)
}

export function ageOf(iso: string, today = new Date()): number | null {
  const d = parseIsoDate(iso)
  if (!d) return null
  let age = today.getFullYear() - d.getFullYear()
  const m = today.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--
  return age
}

/** 771234567 → 77 123 45 67 (format sénégalais), sinon inchangé */
export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 9) {
    return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`
  }
  return raw
}

export function initials(p: Pick<Personne, 'nom' | 'prenom'>): string {
  return `${p.prenom.trim()[0] ?? ''}${p.nom.trim()[0] ?? ''}`.toUpperCase() || '?'
}

/** Teinte stable dérivée du nom (avatars). */
export function hueOf(text: string): number {
  let h = 0
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) % 360
  return h
}

export function fullName(p: Pick<Personne, 'nom' | 'prenom'>): string {
  return `${p.prenom} ${p.nom.toUpperCase()}`
}

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
  if (!p.nom.trim()) e.nom = 'Le nom est obligatoire'
  if (!p.prenom.trim()) e.prenom = 'Le prénom est obligatoire'
  const d = parseIsoDate(p.dateNaissance)
  if (!d) e.dateNaissance = 'Date invalide'
  else if (d > new Date()) e.dateNaissance = 'La date ne peut pas être dans le futur'
  if (!p.adresse.trim()) e.adresse = 'L’adresse est obligatoire'
  if (!/^\+?[\d\s]{7,15}$/.test(p.telephone.trim())) e.telephone = 'Numéro invalide (ex. 771234567)'
  return e
}

export function normalizePersonne(p: PersonneInput): PersonneInput {
  return {
    nom: p.nom.trim(),
    prenom: p.prenom.trim(),
    dateNaissance: p.dateNaissance,
    adresse: p.adresse.trim(),
    telephone: p.telephone.replace(/\s/g, ''),
  }
}
