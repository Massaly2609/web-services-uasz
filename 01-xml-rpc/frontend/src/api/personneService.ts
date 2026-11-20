/**
 * Façade typée des 5 méthodes exposées par PersonneXmlRpcHandler.
 * Le handler est enregistré sous le nom "Personne" : on appelle donc
 * Personne.ajouter, Personne.lister, … avec des paramètres POSITIONNELS.
 */
import { call, type XmlRpcValue } from './xmlrpc'
import type { Personne, PersonneInput } from '../types'

type Struct = Record<string, XmlRpcValue>

const toPersonne = (s: Struct): Personne => ({
  id: Number(s.id),
  nom: String(s.nom ?? ''),
  prenom: String(s.prenom ?? ''),
  dateNaissance: String(s.dateNaissance ?? ''),
  adresse: String(s.adresse ?? ''),
  telephone: String(s.telephone ?? ''),
})

const positional = (p: PersonneInput): XmlRpcValue[] => [
  p.nom,
  p.prenom,
  p.dateNaissance,
  p.adresse,
  p.telephone,
]

export const PersonneService = {
  /** Personne.ajouter(string nom, string prenom, string dateNaissance, string adresse, string telephone) → i8 id */
  async ajouter(p: PersonneInput): Promise<number> {
    return Number(await call('Personne.ajouter', positional(p)))
  },

  /** Personne.lister() → array<struct> */
  async lister(): Promise<Personne[]> {
    const list = await call<Struct[]>('Personne.lister')
    return (list ?? []).map(toPersonne)
  },

  /** Personne.rechercher(int id) → struct (vide si introuvable) */
  async rechercher(id: number): Promise<Personne | null> {
    const s = await call<Struct>('Personne.rechercher', [id])
    return s && Object.keys(s).length > 0 ? toPersonne(s) : null
  },

  /** Personne.modifier(int id, string nom, …, string telephone) → boolean */
  async modifier(id: number, p: PersonneInput): Promise<boolean> {
    return Boolean(await call('Personne.modifier', [id, ...positional(p)]))
  },

  /** Personne.supprimer(int id) → boolean */
  async supprimer(id: number): Promise<boolean> {
    return Boolean(await call('Personne.supprimer', [id]))
  },
}

/** Signatures affichées dans le tableau de bord et la console. */
export const METHODS = [
  {
    name: 'Personne.ajouter',
    signature: '(string nom, string prenom, string dateNaissance, string adresse, string telephone)',
    returns: 'i8',
    description: 'Crée une personne et renvoie son identifiant.',
  },
  {
    name: 'Personne.lister',
    signature: '()',
    returns: 'array<struct>',
    description: 'Renvoie toutes les personnes enregistrées.',
  },
  {
    name: 'Personne.rechercher',
    signature: '(int id)',
    returns: 'struct',
    description: 'Renvoie une personne, ou une struct vide si l’id est inconnu.',
  },
  {
    name: 'Personne.modifier',
    signature: '(int id, string nom, string prenom, string dateNaissance, string adresse, string telephone)',
    returns: 'boolean',
    description: 'Met à jour une personne existante.',
  },
  {
    name: 'Personne.supprimer',
    signature: '(int id)',
    returns: 'boolean',
    description: 'Supprime une personne ; false si l’id est inconnu.',
  },
] as const
