-- Supprimer toutes les anciennes politiques storage
DROP POLICY IF EXISTS "Utilisateurs authentifiés peuvent lire photos intervention" ON storage.objects;
DROP POLICY IF EXISTS "Techniciens peuvent uploader photos intervention" ON storage.objects;
DROP POLICY IF EXISTS "Techniciens peuvent supprimer photos intervention" ON storage.objects;
DROP POLICY IF EXISTS "Techniciens peuvent modifier photos intervention" ON storage.objects;

-- Recréer les politiques storage avec les bonnes permissions
CREATE POLICY "Utilisateurs authentifiés peuvent lire photos intervention"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'intervention-photos'
    AND auth.uid() IS NOT NULL
);

CREATE POLICY "Techniciens peuvent uploader photos intervention"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'intervention-photos'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'technicien')
    )
);

CREATE POLICY "Techniciens peuvent modifier photos intervention"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'intervention-photos'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'technicien')
    )
);

CREATE POLICY "Techniciens peuvent supprimer photos intervention"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'intervention-photos'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'technicien')
    )
);

-- Supprimer toutes les anciennes politiques pour intervention_photos
DROP POLICY IF EXISTS "Utilisateurs authentifiés peuvent lire photos" ON public.intervention_photos;
DROP POLICY IF EXISTS "Techniciens peuvent créer photos" ON public.intervention_photos;
DROP POLICY IF EXISTS "Techniciens peuvent modifier photos" ON public.intervention_photos;
DROP POLICY IF EXISTS "Techniciens peuvent supprimer photos" ON public.intervention_photos;

-- Recréer les politiques pour intervention_photos
CREATE POLICY "Utilisateurs authentifiés peuvent lire photos"
ON public.intervention_photos FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Techniciens peuvent créer photos"
ON public.intervention_photos FOR INSERT
WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'technicien')
    )
);

CREATE POLICY "Techniciens peuvent modifier photos"
ON public.intervention_photos FOR UPDATE
USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'technicien')
    )
);

CREATE POLICY "Techniciens peuvent supprimer photos"
ON public.intervention_photos FOR DELETE
USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'technicien')
    )
);

-- Supprimer toutes les anciennes politiques pour portables_verifications
DROP POLICY IF EXISTS "Utilisateurs authentifiés peuvent lire vérifications portables" ON public.portables_verifications;
DROP POLICY IF EXISTS "Techniciens peuvent créer vérifications portables" ON public.portables_verifications;
DROP POLICY IF EXISTS "Techniciens peuvent modifier vérifications portables" ON public.portables_verifications;
DROP POLICY IF EXISTS "Techniciens peuvent supprimer vérifications portables" ON public.portables_verifications;

-- Recréer les politiques pour portables_verifications
CREATE POLICY "Utilisateurs authentifiés peuvent lire vérifications portables"
ON public.portables_verifications FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Techniciens peuvent créer vérifications portables"
ON public.portables_verifications FOR INSERT
WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'technicien')
    )
);

CREATE POLICY "Techniciens peuvent modifier vérifications portables"
ON public.portables_verifications FOR UPDATE
USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'technicien')
    )
);

CREATE POLICY "Techniciens peuvent supprimer vérifications portables"
ON public.portables_verifications FOR DELETE
USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'technicien')
    )
);

-- Supprimer toutes les anciennes politiques pour portables_gaz
DROP POLICY IF EXISTS "Utilisateurs authentifiés peuvent lire gaz portables" ON public.portables_gaz;
DROP POLICY IF EXISTS "Techniciens peuvent créer gaz portables" ON public.portables_gaz;
DROP POLICY IF EXISTS "Techniciens peuvent modifier gaz portables" ON public.portables_gaz;
DROP POLICY IF EXISTS "Techniciens peuvent supprimer gaz portables" ON public.portables_gaz;

-- Recréer les politiques pour portables_gaz
CREATE POLICY "Utilisateurs authentifiés peuvent lire gaz portables"
ON public.portables_gaz FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Techniciens peuvent créer gaz portables"
ON public.portables_gaz FOR INSERT
WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'technicien')
    )
);

CREATE POLICY "Techniciens peuvent modifier gaz portables"
ON public.portables_gaz FOR UPDATE
USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'technicien')
    )
);

CREATE POLICY "Techniciens peuvent supprimer gaz portables"
ON public.portables_gaz FOR DELETE
USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'technicien')
    )
);