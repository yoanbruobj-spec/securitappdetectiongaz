# 🚨 FIX RAPIDE : Erreur "Bucket not found"

## Solution en 2 minutes

1. **Ouvrez votre tableau de bord Supabase**
2. **Allez dans SQL Editor**
3. **Copiez-collez ce script et exécutez-le** :

```sql
-- Créer le bucket 'documents'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  true,
  52428800,
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']
)
ON CONFLICT (id) DO NOTHING;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Allow authenticated users to upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete" ON storage.objects;

-- Politiques de sécurité
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'documents');

CREATE POLICY "Allow authenticated users to update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

SELECT 'Bucket "documents" créé avec succès!' as status;
```

4. **Vérifiez** que vous voyez le message : `"Bucket 'documents' créé avec succès!"`
5. **Rechargez** votre page d'anomalies

✅ **C'est réglé !** Vous pouvez maintenant uploader des documents.

---

**Fichier source** : `supabase/migrations/033_create_storage_bucket.sql`
