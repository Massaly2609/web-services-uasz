export interface Personne {
  id: number
  nom: string
  prenom: string
  /** yyyy-MM-dd (LocalDate sérialisée par Jackson) */
  dateNaissance: string
  adresse: string
  telephone: string
}

export type PersonneInput = Omit<Personne, 'id'>

export type ViewId = 'apercu' | 'personnes' | 'recherche' | 'playground'
