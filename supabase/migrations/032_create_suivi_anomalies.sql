-- Migration: Création du système de suivi des anomalies
-- Description: Table pour gérer le workflow complet des anomalies détectées lors des interventions

-- Créer la table suivi_anomalies
CREATE TABLE IF NOT EXISTS public.suivi_anomalies (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),

  -- Références principales
  intervention_id uuid NOT NULL,
  client_id uuid NOT NULL,
  site_id uuid NOT NULL,

  -- Équipement concerné (un seul sera rempli selon le type)
  centrale_id uuid,
  detecteur_gaz_id uuid,
  detecteur_flamme_id uuid,
  portable_id uuid,

  -- Type d'équipement concerné
  type_equipement text CHECK (
    type_equipement IN ('centrale', 'automate', 'detecteur_gaz', 'detecteur_flamme', 'portable', 'autre')
  ),

  -- Description de l'anomalie
  description_anomalie text NOT NULL,
  priorite text DEFAULT 'moyenne' CHECK (
    priorite IN ('basse', 'moyenne', 'haute', 'critique')
  ),

  -- Workflow du devis et travaux
  statut text NOT NULL DEFAULT 'devis_attente' CHECK (
    statut IN (
      'devis_attente',
      'devis_etabli',
      'devis_soumis',
      'attente_commande',
      'commandé',
      'travaux_planifies',
      'travaux_effectues'
    )
  ),

  -- Informations financières
  montant_devis numeric,
  reference_devis text,

  -- Dates de suivi
  date_constat date NOT NULL,
  date_devis date,
  date_soumission date,
  date_commande date,
  date_travaux_planifies date,
  date_travaux_effectues date,

  -- Historique et traçabilité
  historique jsonb DEFAULT '[]'::jsonb,
  notes text,
  pieces_jointes jsonb DEFAULT '[]'::jsonb,

  -- Métadonnées
  created_by uuid,
  updated_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  -- Contraintes
  CONSTRAINT suivi_anomalies_pkey PRIMARY KEY (id),
  CONSTRAINT suivi_anomalies_intervention_fkey FOREIGN KEY (intervention_id) REFERENCES public.interventions(id) ON DELETE CASCADE,
  CONSTRAINT suivi_anomalies_client_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE,
  CONSTRAINT suivi_anomalies_site_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE CASCADE,
  CONSTRAINT suivi_anomalies_centrale_fkey FOREIGN KEY (centrale_id) REFERENCES public.centrales(id) ON DELETE SET NULL,
  CONSTRAINT suivi_anomalies_detecteur_gaz_fkey FOREIGN KEY (detecteur_gaz_id) REFERENCES public.detecteurs_gaz(id) ON DELETE SET NULL,
  CONSTRAINT suivi_anomalies_detecteur_flamme_fkey FOREIGN KEY (detecteur_flamme_id) REFERENCES public.detecteurs_flamme(id) ON DELETE SET NULL,
  CONSTRAINT suivi_anomalies_portable_fkey FOREIGN KEY (portable_id) REFERENCES public.portables(id) ON DELETE SET NULL,
  CONSTRAINT suivi_anomalies_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT suivi_anomalies_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_suivi_anomalies_statut ON public.suivi_anomalies(statut);
CREATE INDEX IF NOT EXISTS idx_suivi_anomalies_priorite ON public.suivi_anomalies(priorite);
CREATE INDEX IF NOT EXISTS idx_suivi_anomalies_client ON public.suivi_anomalies(client_id);
CREATE INDEX IF NOT EXISTS idx_suivi_anomalies_site ON public.suivi_anomalies(site_id);
CREATE INDEX IF NOT EXISTS idx_suivi_anomalies_intervention ON public.suivi_anomalies(intervention_id);
CREATE INDEX IF NOT EXISTS idx_suivi_anomalies_centrale ON public.suivi_anomalies(centrale_id);
CREATE INDEX IF NOT EXISTS idx_suivi_anomalies_date_constat ON public.suivi_anomalies(date_constat);

-- Trigger pour mettre à jour updated_at automatiquement
DROP TRIGGER IF EXISTS update_suivi_anomalies_updated_at ON public.suivi_anomalies;

CREATE OR REPLACE FUNCTION public.update_suivi_anomalies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_suivi_anomalies_updated_at
  BEFORE UPDATE ON public.suivi_anomalies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_suivi_anomalies_updated_at();

-- Trigger pour ajouter automatiquement une entrée dans l'historique lors d'un changement de statut
DROP TRIGGER IF EXISTS add_anomalie_status_to_history ON public.suivi_anomalies;

CREATE OR REPLACE FUNCTION public.add_anomalie_status_to_history()
RETURNS TRIGGER AS $$
DECLARE
  history_entry jsonb;
BEGIN
  -- Si le statut a changé, ajouter une entrée dans l'historique
  IF OLD.statut IS DISTINCT FROM NEW.statut THEN
    history_entry := jsonb_build_object(
      'date', now(),
      'ancien_statut', OLD.statut,
      'nouveau_statut', NEW.statut,
      'user_id', auth.uid(),
      'notes', NEW.notes
    );

    NEW.historique := COALESCE(NEW.historique, '[]'::jsonb) || history_entry;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER add_anomalie_status_to_history
  BEFORE UPDATE ON public.suivi_anomalies
  FOR EACH ROW
  EXECUTE FUNCTION public.add_anomalie_status_to_history();

-- RLS (Row Level Security)
ALTER TABLE public.suivi_anomalies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autoriser lecture pour tous les utilisateurs authentifiés"
ON public.suivi_anomalies FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Autoriser insertion pour tous les utilisateurs authentifiés"
ON public.suivi_anomalies FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Autoriser mise à jour pour tous les utilisateurs authentifiés"
ON public.suivi_anomalies FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Autoriser suppression pour admins uniquement"
ON public.suivi_anomalies FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Commentaires
COMMENT ON TABLE public.suivi_anomalies IS 'Suivi complet des anomalies détectées lors des interventions';
COMMENT ON COLUMN public.suivi_anomalies.statut IS 'Workflow: devis_attente → devis_etabli → devis_soumis → attente_commande → commandé → travaux_planifies → travaux_effectues';
COMMENT ON COLUMN public.suivi_anomalies.historique IS 'Historique JSON de tous les changements de statut';
COMMENT ON COLUMN public.suivi_anomalies.priorite IS 'Niveau de priorité de l''anomalie';
