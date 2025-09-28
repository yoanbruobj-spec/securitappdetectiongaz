-- Vérifier si le bucket existe
SELECT * FROM storage.buckets WHERE id = 'intervention-photos';

-- Créer le bucket s'il n'existe pas (avec public = true pour simplifier)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'intervention-photos',
    'intervention-photos',
    true,
    52428800, -- 50MB
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Vérifier les politiques existantes
SELECT * FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects';