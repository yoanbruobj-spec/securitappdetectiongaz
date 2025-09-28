-- Migration complète pour corriger toutes les politiques RLS

-- ============================================
-- CLIENTS
-- ============================================
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can create clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON public.clients;

CREATE POLICY "Authenticated users can view clients"
ON public.clients FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create clients"
ON public.clients FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update clients"
ON public.clients FOR UPDATE
TO authenticated
USING (true);

-- ============================================
-- SITES
-- ============================================
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view sites" ON public.sites;
DROP POLICY IF EXISTS "Authenticated users can create sites" ON public.sites;
DROP POLICY IF EXISTS "Authenticated users can update sites" ON public.sites;

CREATE POLICY "Authenticated users can view sites"
ON public.sites FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create sites"
ON public.sites FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update sites"
ON public.sites FOR UPDATE
TO authenticated
USING (true);

-- ============================================
-- INTERVENTIONS
-- ============================================
ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view interventions" ON public.interventions;
DROP POLICY IF EXISTS "Authenticated users can create interventions" ON public.interventions;
DROP POLICY IF EXISTS "Authenticated users can update interventions" ON public.interventions;

CREATE POLICY "Authenticated users can view interventions"
ON public.interventions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create interventions"
ON public.interventions FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update interventions"
ON public.interventions FOR UPDATE
TO authenticated
USING (true);

-- ============================================
-- INSTALLATIONS
-- ============================================
ALTER TABLE public.installations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view installations" ON public.installations;
DROP POLICY IF EXISTS "Authenticated users can create installations" ON public.installations;
DROP POLICY IF EXISTS "Authenticated users can update installations" ON public.installations;

CREATE POLICY "Authenticated users can view installations"
ON public.installations FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create installations"
ON public.installations FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update installations"
ON public.installations FOR UPDATE
TO authenticated
USING (true);

-- ============================================
-- CENTRALES
-- ============================================
ALTER TABLE public.centrales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view centrales" ON public.centrales;
DROP POLICY IF EXISTS "Authenticated users can manage centrales" ON public.centrales;

CREATE POLICY "Authenticated users can view centrales"
ON public.centrales FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage centrales"
ON public.centrales FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- DETECTEURS GAZ
-- ============================================
ALTER TABLE public.detecteurs_gaz ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage detecteurs_gaz" ON public.detecteurs_gaz;

CREATE POLICY "Authenticated users can manage detecteurs_gaz"
ON public.detecteurs_gaz FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- DETECTEURS FLAMME
-- ============================================
ALTER TABLE public.detecteurs_flamme ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage detecteurs_flamme" ON public.detecteurs_flamme;

CREATE POLICY "Authenticated users can manage detecteurs_flamme"
ON public.detecteurs_flamme FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- SEUILS ALARME
-- ============================================
ALTER TABLE public.seuils_alarme ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage seuils_alarme" ON public.seuils_alarme;

CREATE POLICY "Authenticated users can manage seuils_alarme"
ON public.seuils_alarme FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- AES
-- ============================================
ALTER TABLE public.aes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage aes" ON public.aes;

CREATE POLICY "Authenticated users can manage aes"
ON public.aes FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- PORTABLES
-- ============================================
ALTER TABLE public.portables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage portables" ON public.portables;

CREATE POLICY "Authenticated users can manage portables"
ON public.portables FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- PORTABLES VERIFICATIONS
-- ============================================
ALTER TABLE public.portables_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage portables_verifications" ON public.portables_verifications;

CREATE POLICY "Authenticated users can manage portables_verifications"
ON public.portables_verifications FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- PORTABLES GAZ
-- ============================================
ALTER TABLE public.portables_gaz ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage portables_gaz" ON public.portables_gaz;

CREATE POLICY "Authenticated users can manage portables_gaz"
ON public.portables_gaz FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- PLANNING INTERVENTIONS
-- ============================================
ALTER TABLE public.planning_interventions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage planning" ON public.planning_interventions;

CREATE POLICY "Authenticated users can manage planning"
ON public.planning_interventions FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- PLANNING TECHNICIENS
-- ============================================
ALTER TABLE public.planning_techniciens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage planning_techniciens" ON public.planning_techniciens;

CREATE POLICY "Authenticated users can manage planning_techniciens"
ON public.planning_techniciens FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Commentaire final
COMMENT ON SCHEMA public IS 'Politiques RLS configurées pour permettre à tous les utilisateurs authentifiés d''accéder aux données';