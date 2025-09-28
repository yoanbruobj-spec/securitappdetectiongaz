-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Utilisateurs peuvent voir leur profil" ON public.profiles;
DROP POLICY IF EXISTS "Admins peuvent tout voir" ON public.profiles;
DROP POLICY IF EXISTS "Utilisateurs peuvent mettre à jour leur profil" ON public.profiles;
DROP POLICY IF EXISTS "Admins peuvent créer des profils" ON public.profiles;

-- Nouvelle politique : Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Utilisateurs voient leur profil"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Nouvelle politique : Les admins peuvent voir tous les profils
CREATE POLICY "Admins voient tous les profils"
    ON public.profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- Politique : Les utilisateurs peuvent mettre à jour leur propre profil
CREATE POLICY "Utilisateurs modifient leur profil"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Politique : Les admins peuvent modifier tous les profils
CREATE POLICY "Admins modifient tous les profils"
    ON public.profiles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- Politique : Les admins peuvent insérer des profils
CREATE POLICY "Admins créent des profils"
    ON public.profiles FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- Politique : Les admins peuvent supprimer des profils
CREATE POLICY "Admins suppriment des profils"
    ON public.profiles FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );