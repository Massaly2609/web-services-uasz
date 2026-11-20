/**
 * Les 5 méthodes exposées par JsonRpcController, avec des paramètres NOMMÉS
 * (objet JSON) — contrairement à XML-RPC où ils sont positionnels.
 */
import { call, JsonRpcError, type JsonValue } from './jsonrpc'
import type { Personne, PersonneInput } from '../types'

const asParams = (p: PersonneInput): Record<string, JsonValue> => ({ ...p })

export const PersonneService = {
  /** Personne.ajouter → id (Long) */
  ajouter(p: PersonneInput): Promise<number> {
    return call<number>('Personne.ajouter', asParams(p))
  },

  /** Personne.lister → Personne[] */
  lister(): Promise<Personne[]> {
    return call<Personne[]>('Personne.lister')
  },

  /** Personne.rechercher → Personne, ou null si le serveur répond -32602 « Personne introuvable » */
  async rechercher(id: number): Promise<Personne | null> {
    try {
      return await call<Personne>('Personne.rechercher', { id })
    } catch (err) {
      if (err instanceof JsonRpcError && err.code === -32602 && /introuvable/i.test(err.message)) return null
      throw err
    }
  },

  /** Personne.modifier → true */
  modifier(id: number, p: PersonneInput): Promise<boolean> {
    return call<boolean>('Personne.modifier', { id, ...asParams(p) })
  },

  /** Personne.supprimer → true */
  supprimer(id: number): Promise<boolean> {
    return call<boolean>('Personne.supprimer', { id })
  },
}

export const METHODS = [
  {
    name: 'Personne.ajouter',
    params: '{ nom, prenom, dateNaissance, adresse, telephone }',
    returns: 'number',
    description: 'Crée une personne et renvoie son identifiant.',
  },
  { name: 'Personne.lister', params: '{}', returns: 'Personne[]', description: 'Renvoie toutes les personnes.' },
  {
    name: 'Personne.rechercher',
    params: '{ id }',
    returns: 'Personne',
    description: 'Renvoie une personne ; -32602 si l’id est inconnu.',
  },
  {
    name: 'Personne.modifier',
    params: '{ id, nom, prenom, dateNaissance, adresse, telephone }',
    returns: 'true',
    description: 'Met à jour tous les champs d’une personne.',
  },
  { name: 'Personne.supprimer', params: '{ id }', returns: 'true', description: 'Supprime une personne.' },
] as const
