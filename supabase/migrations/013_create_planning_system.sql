-- =====================================================
-- Migration 013 - Système de Planning
-- Séparation Planning (interventions futures) et Rapports (interventions réalisées)
-- =====================================================

-- ============================================parfai
-- 1. TABLE PLANNING_INTERVENTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.planning_interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  date_intervention DATE NOT NULL,
  heure_debut TIME,
  heure_fin TIME,
  type TEXT NOT NULL CHECK (type IN (
    'verification_periodique',
    'maintenance_preventive',
    'reparation',
    'mise_en_service',
    'diagnostic',
    'formation'
  )),
  statut TEXT NOT NULL DEFAULT 'planifiee' CHECK (statut IN (
    'planifiee',
    'en_cours',
    'annulee'
  )),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_planning_interventions_site ON public.planning_interventions(site_id);
CREATE INDEX IF NOT EXISTS idx_planning_interventions_date ON public.planning_interventions(date_intervention);
CREATE INDEX IF NOT EXISTS idx_planning_interventions_statut ON public.planning_interventions(statut);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_planning_interventions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_planning_interventions_updated_at
  BEFORE UPDATE ON public.planning_interventions
  FOR EACH ROW
  EXECUTE FUNCTION update_planning_interventions_updated_at();

-- ============================================
-- 2. TABLE PLANNING_TECHNICIENS (Multi-assignation)
-- ============================================
CREATE TABLE IF NOT EXISTS public.planning_techniciens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  planning_intervention_id UUID NOT NULL REFERENCES public.planning_interventions(id) ON DELETE CASCADE,
  technicien_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_technicien TEXT DEFAULT 'principal' CHECK (role_technicien IN ('principal', 'support')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(planning_intervention_id, technicien_id)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_planning_techniciens_planning ON public.planning_techniciens(planning_intervention_id);
CREATE INDEX IF NOT EXISTS idx_planning_techniciens_technicien ON public.planning_techniciens(technicien_id);

-- ============================================
-- 3. LIEN OPTIONNEL PLANNING → RAPPORT
-- ============================================
-- Ajouter colonne dans interventions (rapports) pour lier à un planning
ALTER TABLE public.interventions
ADD COLUMN IF NOT EXISTS planning_intervention_id UUID REFERENCES public.planning_interventions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_interventions_planning ON public.interventions(planning_intervention_id);

-- ============================================
-- 4. POLICIES RLS (Row Level Security)
-- ============================================

-- Planning Interventions
ALTER TABLE public.planning_interventions ENABLE ROW LEVEL SECURITY;

-- Admin peut tout faire
CREATE POLICY "Admin full access planning"
  ON public.planning_interventions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Technicien peut voir ses interventions assignées
CREATE POLICY "Technicien read assigned planning"
  ON public.planning_interventions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.planning_techniciens
      WHERE planning_techniciens.planning_intervention_id = planning_interventions.id
      AND planning_techniciens.technicien_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Planning Techniciens
ALTER TABLE public.planning_techniciens ENABLE ROW LEVEL SECURITY;

-- Admin peut tout faire
CREATE POLICY "Admin full access planning_techniciens"
  ON public.planning_techniciens
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Technicien peut voir ses assignations
CREATE POLICY "Technicien read own assignments"
  ON public.planning_techniciens
  FOR SELECT
  TO authenticated
  USING (
    technicien_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- 5. COMMENTAIRES
-- ============================================
COMMENT ON TABLE public.planning_interventions IS 'Planning des interventions futures (séparé des rapports)';
COMMENT ON TABLE public.planning_techniciens IS 'Assignation multi-techniciens pour le planning';
COMMENT ON COLUMN public.interventions.planning_intervention_id IS 'Lien optionnel vers le planning d''origine';