// Types pour la gestion de stock

export interface StockCategorie {
  id: string
  nom: string
  icone?: string | null
  ordre: number
  created_at: string
  updated_at: string
}

// Nouveaux types pour le système multi-stocks
export type EmplacementType = 'principal' | 'chantier' | 'vehicule'

export interface StockEmplacement {
  id: string
  type: EmplacementType
  nom: string
  description?: string | null
  chantier_info?: {
    client?: string
    adresse?: string
    contact?: string
    date_debut?: string
    date_fin?: string
    [key: string]: any
  } | null
  utilisateur_id?: string | null
  actif: boolean
  created_at: string
  updated_at: string
  // Relations
  profiles?: {
    id: string
    full_name: string
    email: string
    role: string
  }
}

export interface StockInventaire {
  id: string
  article_id: string
  emplacement_id: string
  quantite: number
  created_at: string
  updated_at: string
  // Relations
  stock_emplacements?: StockEmplacement
}

export interface StockArticle {
  id: string
  nom: string
  reference: string
  categorie_id?: string | null
  numeros_serie?: string | null
  emplacement?: string | null
  quantite: number // Stock total calculé (pour compatibilité)
  qr_code: string
  prix_unitaire?: number | null
  fournisseur?: string | null
  seuil_alerte: number
  description?: string | null
  photo_url?: string | null
  created_by?: string | null
  created_at: string
  updated_at: string
  // Relations
  stock_categories?: StockCategorie
  stock_inventaire?: StockInventaire[] // Détail par emplacement
}

export interface StockMouvement {
  id: string
  article_id: string
  type: 'entree' | 'sortie' | 'ajustement' | 'transfert'
  quantite: number
  quantite_avant: number
  quantite_apres: number
  utilisateur_id: string
  intervention_id?: string | null
  // Nouveaux champs pour les transferts
  emplacement_source_id?: string | null
  emplacement_destination_id?: string | null
  notes?: string | null
  date_mouvement: string
  created_at: string
  // Relations
  stock_articles?: StockArticle
  emplacement_source?: StockEmplacement
  emplacement_destination?: StockEmplacement
  profiles?: {
    id: string
    full_name: string
    email: string
    role: string
  }
}

export interface CreateStockArticleDto {
  nom: string
  reference: string
  categorie_id?: string
  numeros_serie?: string
  emplacement?: string
  quantite: number
  prix_unitaire?: number
  fournisseur?: string
  seuil_alerte?: number
  description?: string
  photo_url?: string
  emplacement_id?: string // Nouvel ajout : emplacement initial
}

export interface CreateStockMouvementDto {
  article_id: string
  type: 'entree' | 'sortie' | 'transfert'
  quantite: number
  notes?: string
  intervention_id?: string
  emplacement_source_id?: string
  emplacement_destination_id?: string
}

export interface CreateStockEmplacementDto {
  type: EmplacementType
  nom: string
  description?: string
  chantier_info?: Record<string, any>
  utilisateur_id?: string
}

export interface StockStats {
  total_articles: number
  total_quantite: number
  valeur_totale: number
  articles_alerte: number
}

// Détail du stock par emplacement pour un article
export interface StockDetailEmplacement {
  emplacement_id: string
  emplacement_nom: string
  emplacement_type: EmplacementType
  quantite: number
  // Pour les véhicules
  utilisateur?: {
    id: string
    full_name: string
  }
  // Pour les chantiers
  chantier_info?: Record<string, any>
}
