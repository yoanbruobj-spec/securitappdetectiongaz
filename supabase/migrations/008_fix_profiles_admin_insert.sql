-- Permettre aux admins d'insérer dans la table profiles
-- Nécessaire pour la création d'utilisateurs via l'API admin

CREATE POLICY "Admins peuvent créer des profils"
    ON public.profiles FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );