-- Migration: Création du système de suivi des commandes de cellules
-- Description: Table pour gérer le workflow de commande et remplacement des cellules de détecteurs

-- Créer la table commandes_cellules
CREATE TABLE IF NOT EXISTS public.commandes_cellules (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),

  -- Références aux équipements (un seul des deux sera rempli)
  detecteur_gaz_id uuid,
  portable_gaz_id uuid,

  -- Références pour le contexte
  client_id uuid NOT NULL,
  site_id uuid NOT NULL,
  centrale_id uuid, -- Peut être null pour les portables

  -- Informations sur le détecteur et la cellule
  modele_detecteur text,
  gaz text NOT NULL,
  gamme_mesure text,
  numero_serie_detecteur text,

  -- Dates importantes
  date_remplacement_theorique date NOT NULL,
  date_alerte timestamp with time zone DEFAULT now(),
  date_commande date,
  date_reception date,
  date_remplacement_effectif date,

  -- Workflow
  statut text NOT NULL DEFAULT 'attente_commande' CHECK (
    statut IN ('attente_commande', 'commandé', 'reçu', 'remplacé')
  ),

  -- Liens et informations complémentaires
  rapport_intervention_id uuid,
  fournisseur text,
  reference_commande text,
  quantite integer DEFAULT 1,
  prix_unitaire numeric,
  notes text,

  -- Métadonnées
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  -- Contraintes
  CONSTRAINT commandes_cellules_pkey PRIMARY KEY (id),
  CONSTRAINT commandes_cellules_detecteur_gaz_fkey FOREIGN KEY (detecteur_gaz_id) REFERENCES public.detecteurs_gaz(id) ON DELETE CASCADE,
  CONSTRAINT commandes_cellules_portable_gaz_fkey FOREIGN KEY (portable_gaz_id) REFERENCES public.portables_gaz(id) ON DELETE CASCADE,
  CONSTRAINT commandes_cellules_client_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE,
  CONSTRAINT commandes_cellules_site_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE CASCADE,
  CONSTRAINT commandes_cellules_centrale_fkey FOREIGN KEY (centrale_id) REFERENCES public.centrales(id) ON DELETE SET NULL,
  CONSTRAINT commandes_cellules_intervention_fkey FOREIGN KEY (rapport_intervention_id) REFERENCES public.interventions(id) ON DELETE SET NULL,
  CONSTRAINT commandes_cellules_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT commandes_cellules_one_detecteur CHECK (
    (detecteur_gaz_id IS NOT NULL AND portable_gaz_id IS NULL) OR
    (detecteur_gaz_id IS NULL AND portable_gaz_id IS NOT NULL)
  )
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_commandes_cellules_statut ON public.commandes_cellules(statut);
CREATE INDEX IF NOT EXISTS idx_commandes_cellules_date_theorique ON public.commandes_cellules(date_remplacement_theorique);
CREATE INDEX IF NOT EXISTS idx_commandes_cellules_client ON public.commandes_cellules(client_id);
CREATE INDEX IF NOT EXISTS idx_commandes_cellules_site ON public.commandes_cellules(site_id);
CREATE INDEX IF NOT EXISTS idx_commandes_cellules_detecteur_gaz ON public.commandes_cellules(detecteur_gaz_id);
CREATE INDEX IF NOT EXISTS idx_commandes_cellules_portable_gaz ON public.commandes_cellules(portable_gaz_id);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION public.update_commandes_cellules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_commandes_cellules_updated_at
  BEFORE UPDATE ON public.commandes_cellules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_commandes_cellules_updated_at();

-- RLS (Row Level Security) - Tout le monde peut voir et modifier
ALTER TABLE public.commandes_cellules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autoriser lecture pour tous les utilisateurs authentifiés"
ON public.commandes_cellules FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Autoriser insertion pour tous les utilisateurs authentifiés"
ON public.commandes_cellules FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Autoriser mise à jour pour tous les utilisateurs authentifiés"
ON public.commandes_cellules FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Autoriser suppression pour admins uniquement"
ON public.commandes_cellules FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Commentaires
COMMENT ON TABLE public.commandes_cellules IS 'Suivi des commandes et remplacements de cellules de détecteurs';
COMMENT ON COLUMN public.commandes_cellules.statut IS 'Workflow: attente_commande → commandé → reçu → remplacé';
COMMENT ON COLUMN public.commandes_cellules.date_remplacement_theorique IS 'Date théorique de remplacement de la cellule';
