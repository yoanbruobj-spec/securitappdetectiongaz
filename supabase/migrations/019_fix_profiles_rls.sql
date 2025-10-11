-- Activer RLS sur la table profiles si ce n'est pas déjà fait
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leur propre profil" ON public.profiles;
DROP POLICY IF EXISTS "Les admins peuvent voir tous les profils" ON public.profiles;
DROP POLICY IF EXISTS "Les admins peuvent modifier tous les profils" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Politique : Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Les utilisateurs peuvent voir leur propre profil"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Politique : Les admins peuvent voir tous les profils
CREATE POLICY "Les admins peuvent voir tous les profils"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Politique : Les admins peuvent modifier tous les profils
CREATE POLICY "Les admins peuvent modifier tous les profils"
ON public.profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Politique : Insertion automatique via trigger (system)
CREATE POLICY "System can insert profiles"
ON public.profiles FOR INSERT
WITH CHECK (true);

-- Commentaire
COMMENT ON TABLE public.profiles IS 'Profils utilisateurs avec politiques RLS permettant aux utilisateurs de voir leur propre profil et aux admins de gérer tous les profils';