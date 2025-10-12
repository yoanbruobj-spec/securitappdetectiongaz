-- Fix: Ajouter WITH CHECK à la policy UPDATE pour permettre la modification complète des profils par les admins
-- Cela corrige le problème où le téléphone n'était pas sauvegardé lors de la modification

DROP POLICY IF EXISTS "Les admins peuvent modifier tous les profils" ON public.profiles;

-- Politique : Les admins peuvent modifier tous les profils (avec WITH CHECK)
CREATE POLICY "Les admins peuvent modifier tous les profils"
ON public.profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

COMMENT ON POLICY "Les admins peuvent modifier tous les profils" ON public.profiles
IS 'Permet aux admins de modifier tous les champs de tous les profils utilisateurs';
