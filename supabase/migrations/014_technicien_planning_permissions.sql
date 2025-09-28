-- =====================================================
-- Migration 014 - Permissions complètes pour techniciens sur leurs plannings
-- =====================================================

-- DROP des anciennes policies pour techniciens
DROP POLICY IF EXISTS "Technicien read assigned planning" ON public.planning_interventions;

-- Technicien peut LIRE ses interventions assignées
CREATE POLICY "Technicien read assigned planning"
  ON public.planning_interventions
  FOR SELECT
  TO authenticated
  USING (
    -- Soit c'est un admin
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    -- Soit c'est un technicien assigné à cette intervention
    EXISTS (
      SELECT 1 FROM public.planning_techniciens
      WHERE planning_techniciens.planning_intervention_id = planning_interventions.id
      AND planning_techniciens.technicien_id = auth.uid()
    )
  );

-- Technicien peut CRÉER des interventions (il sera auto-assigné via l'app)
CREATE POLICY "Technicien insert planning"
  ON public.planning_interventions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('technicien', 'admin')
    )
  );

-- Technicien peut MODIFIER ses interventions assignées
CREATE POLICY "Technicien update assigned planning"
  ON public.planning_interventions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.planning_techniciens
      WHERE planning_techniciens.planning_intervention_id = planning_interventions.id
      AND planning_techniciens.technicien_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.planning_techniciens
      WHERE planning_techniciens.planning_intervention_id = planning_interventions.id
      AND planning_techniciens.technicien_id = auth.uid()
    )
  );

-- Technicien peut SUPPRIMER ses interventions assignées
CREATE POLICY "Technicien delete assigned planning"
  ON public.planning_interventions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.planning_techniciens
      WHERE planning_techniciens.planning_intervention_id = planning_interventions.id
      AND planning_techniciens.technicien_id = auth.uid()
    )
  );

-- Technicien peut CRÉER ses propres assignations
CREATE POLICY "Technicien insert own assignments"
  ON public.planning_techniciens
  FOR INSERT
  TO authenticated
  WITH CHECK (
    technicien_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Technicien peut SUPPRIMER ses propres assignations (pour se désassigner)
CREATE POLICY "Technicien delete own assignments"
  ON public.planning_techniciens
  FOR DELETE
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