export interface Personne {
  id: number
  nom: string
  prenom: string
  /** Format ISO yyyy-MM-dd (LocalDate côté Java) */
  dateNaissance: string
  adresse: string
  telephone: string
}

export type PersonneInput = Omit<Personne, 'id'>

export type PageId = 'dashboard' | 'annuaire' | 'recherche' | 'console'
