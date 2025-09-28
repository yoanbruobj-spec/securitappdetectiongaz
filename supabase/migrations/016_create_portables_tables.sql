-- =====================================================
-- Migration 016 - Création tables pour détecteurs portables
-- Système complet pour la gestion des détecteurs portables
-- =====================================================

-- =====================================================
-- 1. AJOUT TYPE DE RAPPORT DANS INTERVENTIONS
-- =====================================================

ALTER TABLE public.interventions
ADD COLUMN IF NOT EXISTS type_rapport TEXT DEFAULT 'fixe' CHECK (type_rapport IN ('fixe', 'portable'));

COMMENT ON COLUMN public.interventions.type_rapport IS 'Type de rapport: fixe (centrales) ou portable (détecteurs portables)';

-- =====================================================
-- 2. TABLE PORTABLES (détecteurs portables rattachés aux sites)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.portables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  marque TEXT NOT NULL,
  modele TEXT NOT NULL,
  numero_serie TEXT NOT NULL,
  etat_general TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(site_id, numero_serie)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_portables_site ON public.portables(site_id);
CREATE INDEX IF NOT EXISTS idx_portables_numero_serie ON public.portables(numero_serie);

COMMENT ON TABLE public.portables IS 'Détecteurs portables rattachés aux sites (historique et identification)';
COMMENT ON COLUMN public.portables.numero_serie IS 'Numéro de série unique par site pour identification';

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_portables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_portables_updated_at
  BEFORE UPDATE ON public.portables
  FOR EACH ROW
  EXECUTE FUNCTION update_portables_updated_at();

-- =====================================================
-- 3. TABLE PORTABLES_GAZ (gaz détectés par chaque portable)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.portables_gaz (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portable_id UUID NOT NULL REFERENCES public.portables(id) ON DELETE CASCADE,
  intervention_id UUID NOT NULL REFERENCES public.interventions(id) ON DELETE CASCADE,
  gaz TEXT NOT NULL,
  gamme_mesure TEXT,
  date_remplacement DATE,
  date_prochain_remplacement DATE,

  -- Calibration zéro
  calibration_gaz_zero TEXT,
  calibration_valeur_avant DECIMAL(10,3),
  calibration_valeur_apres DECIMAL(10,3),
  calibration_statut TEXT CHECK (calibration_statut IN ('OK', 'Dérive', 'HS')),

  -- Étalonnage sensibilité
  etalonnage_gaz TEXT,
  etalonnage_valeur_avant_reglage DECIMAL(10,3),
  etalonnage_valeur_apres_reglage DECIMAL(10,3),
  etalonnage_unite TEXT,
  etalonnage_coefficient DECIMAL(10,3),
  etalonnage_statut TEXT CHECK (etalonnage_statut IN ('OK', 'Dérive acceptable', 'Dérive limite', 'HS')),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_portables_gaz_portable ON public.portables_gaz(portable_id);
CREATE INDEX IF NOT EXISTS idx_portables_gaz_intervention ON public.portables_gaz(intervention_id);
CREATE INDEX IF NOT EXISTS idx_portables_gaz_gaz ON public.portables_gaz(gaz);

COMMENT ON TABLE public.portables_gaz IS 'Gaz détectés et leurs calibrations pour chaque portable lors d''une intervention';
COMMENT ON COLUMN public.portables_gaz.gamme_mesure IS 'Gamme de mesure du gaz (texte libre, ex: "0-100 ppm")';

-- =====================================================
-- 4. TABLE PORTABLES_VERIFICATIONS (vérifications fonctionnelles)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.portables_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portable_id UUID NOT NULL REFERENCES public.portables(id) ON DELETE CASCADE,
  intervention_id UUID NOT NULL REFERENCES public.interventions(id) ON DELETE CASCADE,
  alarme_sonore BOOLEAN DEFAULT false,
  alarme_visuelle BOOLEAN DEFAULT false,
  alarme_vibrante BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(portable_id, intervention_id)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_portables_verif_portable ON public.portables_verifications(portable_id);
CREATE INDEX IF NOT EXISTS idx_portables_verif_intervention ON public.portables_verifications(intervention_id);

COMMENT ON TABLE public.portables_verifications IS 'Vérifications fonctionnelles des alarmes des détecteurs portables';

-- =====================================================
-- 5. POLICIES RLS (Row Level Security)
-- =====================================================

-- PORTABLES
ALTER TABLE public.portables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateurs authentifiés peuvent lire portables"
  ON public.portables FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Techniciens peuvent gérer portables"
  ON public.portables FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'technicien')
    )
  );

-- PORTABLES_GAZ
ALTER TABLE public.portables_gaz ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateurs authentifiés peuvent lire portables_gaz"
  ON public.portables_gaz FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Techniciens peuvent gérer portables_gaz"
  ON public.portables_gaz FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'technicien')
    )
  );

-- PORTABLES_VERIFICATIONS
ALTER TABLE public.portables_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateurs authentifiés peuvent lire portables_verifications"
  ON public.portables_verifications FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Techniciens peuvent gérer portables_verifications"
  ON public.portables_verifications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'technicien')
    )
  );