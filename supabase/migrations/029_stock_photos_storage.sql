-- Migration : Configuration du bucket stock-photos
-- Crée le bucket et les politiques RLS pour les photos d'articles

-- Créer le bucket stock-photos s'il n'existe pas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'stock-photos',
    'stock-photos',
    true, -- Public pour permettre l'accès direct aux URLs
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

-- Supprimer les anciennes politiques stock-photos si elles existent
DROP POLICY IF EXISTS "Utilisateurs authentifiés peuvent lire photos stock" ON storage.objects;
DROP POLICY IF EXISTS "Admins peuvent uploader photos stock" ON storage.objects;
DROP POLICY IF EXISTS "Admins peuvent modifier photos stock" ON storage.objects;
DROP POLICY IF EXISTS "Admins peuvent supprimer photos stock" ON storage.objects;

-- Politique pour lecture (tous les utilisateurs authentifiés)
CREATE POLICY "Utilisateurs authentifiés peuvent lire photos stock"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'stock-photos'
    AND auth.uid() IS NOT NULL
);

-- Politique pour upload (admins seulement)
CREATE POLICY "Admins peuvent uploader photos stock"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'stock-photos'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Politique pour modification (admins seulement)
CREATE POLICY "Admins peuvent modifier photos stock"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'stock-photos'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Politique pour suppression (admins seulement)
CREATE POLICY "Admins peuvent supprimer photos stock"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'stock-photos'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);
