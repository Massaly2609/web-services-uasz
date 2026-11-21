import type { Personne } from '../gen/personne_pb';

export interface PersonneForm {
  nom: string;
  prenom: string;
  dateNaissance: string;
  adresse: string;
  telephone: string;
}

export type FormErrors = Partial<Record<keyof PersonneForm, string>>;

const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

export function parseIso(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
}

export const formatDate = (iso: string) => {
  const d = parseIso(iso);
  return d ? dateFmt.format(d) : iso || '—';
};

export const formatTime = (d: Date | string) => timeFmt.format(typeof d === 'string' ? new Date(d) : d);

export function ageOf(iso: string): number | null {
  const d = parseIso(iso);
  if (!d) return null;
  const t = new Date();
  let a = t.getFullYear() - d.getFullYear();
  if (t.getMonth() < d.getMonth() || (t.getMonth() === d.getMonth() && t.getDate() < d.getDate())) a--;
  return a;
}

export function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, '');
  return d.length === 9 ? `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7)}` : raw;
}

export const fullName = (p: { nom: string; prenom: string }) => `${p.prenom} ${p.nom.toUpperCase()}`;

export const initials = (p: { nom: string; prenom: string }) =>
  `${p.prenom.trim()[0] ?? ''}${p.nom.trim()[0] ?? ''}`.toUpperCase() || '?';

export function hueOf(text: string): number {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}

export const emptyForm = (): PersonneForm => ({ nom: '', prenom: '', dateNaissance: '', adresse: '', telephone: '' });

export const formFrom = (p: Personne): PersonneForm => ({
  nom: p.nom,
  prenom: p.prenom,
  dateNaissance: p.dateNaissance,
  adresse: p.adresse,
  telephone: p.telephone,
});

export function validate(f: PersonneForm): FormErrors {
  const e: FormErrors = {};
  if (!f.prenom.trim()) e.prenom = 'Le prénom est obligatoire';
  if (!f.nom.trim()) e.nom = 'Le nom est obligatoire';
  const d = parseIso(f.dateNaissance);
  if (!d) e.dateNaissance = 'Date invalide';
  else if (d > new Date()) e.dateNaissance = 'La date ne peut pas être dans le futur';
  if (!f.adresse.trim()) e.adresse = 'L’adresse est obligatoire';
  if (!/^\+?[\d\s]{7,15}$/.test(f.telephone.trim())) e.telephone = 'Numéro invalide (ex. 771234567)';
  return e;
}

export const normalize = (f: PersonneForm): PersonneForm => ({
  nom: f.nom.trim(),
  prenom: f.prenom.trim(),
  dateNaissance: f.dateNaissance,
  adresse: f.adresse.trim(),
  telephone: f.telephone.replace(/\s/g, ''),
});

export const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`;
