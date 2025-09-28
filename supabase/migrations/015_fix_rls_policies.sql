-- Correction des politiques RLS manquantes

-- Ajouter les politiques UPDATE et DELETE pour intervention_photos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'intervention_photos'
        AND policyname = 'Techniciens peuvent modifier photos'
    ) THEN
        CREATE POLICY "Techniciens peuvent modifier photos"
            ON public.intervention_photos FOR UPDATE
            USING (
                EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE id = auth.uid() AND role IN ('admin', 'technicien')
                )
            );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'intervention_photos'
        AND policyname = 'Techniciens peuvent supprimer photos'
    ) THEN
        CREATE POLICY "Techniciens peuvent supprimer photos"
            ON public.intervention_photos FOR DELETE
            USING (
                EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE id = auth.uid() AND role IN ('admin', 'technicien')
                )
            );
    END IF;
END $$;

-- Ajouter les politiques UPDATE et DELETE pour portables_verifications
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'portables_verifications'
        AND policyname = 'Techniciens peuvent modifier vérifications portables'
    ) THEN
        CREATE POLICY "Techniciens peuvent modifier vérifications portables"
            ON public.portables_verifications FOR UPDATE
            USING (
                EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE id = auth.uid() AND role IN ('admin', 'technicien')
                )
            );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'portables_verifications'
        AND policyname = 'Techniciens peuvent supprimer vérifications portables'
    ) THEN
        CREATE POLICY "Techniciens peuvent supprimer vérifications portables"
            ON public.portables_verifications FOR DELETE
            USING (
                EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE id = auth.uid() AND role IN ('admin', 'technicien')
                )
            );
    END IF;
END $$;

-- Ajouter les politiques UPDATE et DELETE pour portables_gaz
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'portables_gaz'
        AND policyname = 'Techniciens peuvent modifier gaz portables'
    ) THEN
        CREATE POLICY "Techniciens peuvent modifier gaz portables"
            ON public.portables_gaz FOR UPDATE
            USING (
                EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE id = auth.uid() AND role IN ('admin', 'technicien')
                )
            );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'portables_gaz'
        AND policyname = 'Techniciens peuvent supprimer gaz portables'
    ) THEN
        CREATE POLICY "Techniciens peuvent supprimer gaz portables"
            ON public.portables_gaz FOR DELETE
            USING (
                EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE id = auth.uid() AND role IN ('admin', 'technicien')
                )
            );
    END IF;
END $$;

-- Ajouter politique DELETE pour storage.objects
DO $$
BEGIN
    DROP POLICY IF EXISTS "Techniciens peuvent supprimer photos intervention" ON storage.objects;
    CREATE POLICY "Techniciens peuvent supprimer photos intervention"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'intervention-photos' AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'technicien')
        )
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Ajouter politique UPDATE pour storage.objects
DO $$
BEGIN
    DROP POLICY IF EXISTS "Techniciens peuvent modifier photos intervention" ON storage.objects;
    CREATE POLICY "Techniciens peuvent modifier photos intervention"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'intervention-photos' AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'technicien')
        )
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;