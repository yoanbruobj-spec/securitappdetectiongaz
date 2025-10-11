// Types pour la gestion de stock

export interface StockCategorie {
  id: string
  nom: string
  icone?: string | null
  ordre: number
  created_at: string
  updated_at: string
}

export interface StockArticle {
  id: string
  nom: string
  reference: string
  categorie_id?: string | null
  numeros_serie?: string | null
  emplacement?: string | null
  quantite: number
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
}

export interface StockMouvement {
  id: string
  article_id: string
  type: 'entree' | 'sortie' | 'ajustement'
  quantite: number
  quantite_avant: number
  quantite_apres: number
  utilisateur_id: string
  intervention_id?: string | null
  notes?: string | null
  date_mouvement: string
  created_at: string
  // Relations
  stock_articles?: StockArticle
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
}

export interface CreateStockMouvementDto {
  article_id: string
  type: 'entree' | 'sortie'
  quantite: number
  notes?: string
  intervention_id?: string
}

export interface StockStats {
  total_articles: number
  total_quantite: number
  valeur_totale: number
  articles_alerte: number
}
