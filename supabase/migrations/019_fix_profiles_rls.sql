-- Désactiver RLS temporairement pour nettoyer
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leur propre profil" ON public.profiles;
DROP POLICY IF EXISTS "Les admins peuvent voir tous les profils" ON public.profiles;
DROP POLICY IF EXISTS "Les admins peuvent modifier tous les profils" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.profiles;

-- Réactiver RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Politique simple : Tous les utilisateurs authentifiés peuvent lire tous les profils
CREATE POLICY "Enable read access for all users"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Politique : Les utilisateurs peuvent modifier leur propre profil
CREATE POLICY "Enable update for users based on id"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Politique : Insertion pour les utilisateurs authentifiés (pour le trigger)
CREATE POLICY "Enable insert for authenticated users only"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (true);

-- Commentaire
COMMENT ON TABLE public.profiles IS 'Profils utilisateurs avec RLS simplifié - lecture pour tous les utilisateurs authentifiés';