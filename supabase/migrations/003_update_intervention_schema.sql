-- =====================================================
-- Migration 003 - Simplification schéma intervention
-- Ajouter site_id directement dans interventions
-- =====================================================

-- Ajouter site_id à la table interventions
ALTER TABLE public.interventions
ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES public.sites(id);

-- Rendre installation_id optionnel pour permettre interventions sans installation
ALTER TABLE public.interventions
ALTER COLUMN installation_id DROP NOT NULL;

-- Créer un index sur site_id
CREATE INDEX IF NOT EXISTS idx_interventions_site ON public.interventions(site_id);

-- Mise à jour de la centrale pour référencer directement l'intervention
ALTER TABLE public.centrales
ADD COLUMN IF NOT EXISTS intervention_id UUID REFERENCES public.interventions(id) ON DELETE CASCADE;

-- Créer un index
CREATE INDEX IF NOT EXISTS idx_centrales_intervention ON public.centrales(intervention_id);

-- Rendre installation_id optionnel dans centrales
ALTER TABLE public.centrales
ALTER COLUMN installation_id DROP NOT NULL;