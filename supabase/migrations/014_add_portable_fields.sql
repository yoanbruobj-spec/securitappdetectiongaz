-- Ajout des champs pour les interventions portables
ALTER TABLE public.interventions
ADD COLUMN IF NOT EXISTS observations_generales TEXT,
ADD COLUMN IF NOT EXISTS conclusion_generale TEXT,
ADD COLUMN IF NOT EXISTS type_rapport TEXT CHECK (type_rapport IN ('fixe', 'portable')),
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS planning_intervention_id UUID REFERENCES public.planning_interventions(id);

-- Table pour stocker les photos des interventions
CREATE TABLE IF NOT EXISTS public.intervention_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    intervention_id UUID REFERENCES public.interventions(id) ON DELETE CASCADE NOT NULL,
    photo_url TEXT NOT NULL,
    type TEXT CHECK (type IN ('centrale', 'anomalie', 'detecteur', 'conclusion')) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_intervention_photos_intervention ON public.intervention_photos(intervention_id);

-- RLS pour intervention_photos
ALTER TABLE public.intervention_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateurs authentifiés peuvent lire photos"
    ON public.intervention_photos FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Techniciens peuvent créer photos"
    ON public.intervention_photos FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'technicien')
        )
    );

-- Tables pour les détecteurs portables
CREATE TABLE IF NOT EXISTS public.portables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE NOT NULL,
    marque TEXT NOT NULL,
    modele TEXT NOT NULL,
    numero_serie TEXT,
    etat_general TEXT CHECK (etat_general IN ('Bon', 'Moyen', 'Mauvais')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_portables_site ON public.portables(site_id);

-- RLS pour portables
ALTER TABLE public.portables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateurs authentifiés peuvent lire portables"
    ON public.portables FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Techniciens peuvent gérer portables"
    ON public.portables FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'technicien')
        )
    );

-- Table pour les vérifications des portables
CREATE TABLE IF NOT EXISTS public.portables_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portable_id UUID REFERENCES public.portables(id) ON DELETE CASCADE NOT NULL,
    intervention_id UUID REFERENCES public.interventions(id) ON DELETE CASCADE NOT NULL,
    alarme_sonore BOOLEAN DEFAULT false,
    alarme_visuelle BOOLEAN DEFAULT false,
    alarme_vibrante BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_portables_verifications_portable ON public.portables_verifications(portable_id);
CREATE INDEX IF NOT EXISTS idx_portables_verifications_intervention ON public.portables_verifications(intervention_id);

-- RLS pour portables_verifications
ALTER TABLE public.portables_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateurs authentifiés peuvent lire vérifications portables"
    ON public.portables_verifications FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Techniciens peuvent créer vérifications portables"
    ON public.portables_verifications FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'technicien')
        )
    );

-- Table pour les gaz des portables
CREATE TABLE IF NOT EXISTS public.portables_gaz (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portable_id UUID REFERENCES public.portables(id) ON DELETE CASCADE NOT NULL,
    intervention_id UUID REFERENCES public.interventions(id) ON DELETE CASCADE NOT NULL,
    gaz TEXT NOT NULL,
    gamme_mesure TEXT,
    date_remplacement DATE,
    date_prochain_remplacement DATE,
    calibration_gaz_zero TEXT,
    calibration_valeur_avant DECIMAL(10,3),
    calibration_valeur_apres DECIMAL(10,3),
    calibration_statut TEXT CHECK (calibration_statut IN ('OK', 'Dérive', 'HS')),
    etalonnage_gaz TEXT,
    etalonnage_valeur_avant_reglage DECIMAL(10,3),
    etalonnage_valeur_apres_reglage DECIMAL(10,3),
    etalonnage_unite TEXT,
    etalonnage_coefficient DECIMAL(10,3),
    etalonnage_statut TEXT CHECK (etalonnage_statut IN ('OK', 'Dérive acceptable', 'Dérive limite', 'HS')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_portables_gaz_portable ON public.portables_gaz(portable_id);
CREATE INDEX IF NOT EXISTS idx_portables_gaz_intervention ON public.portables_gaz(intervention_id);

-- RLS pour portables_gaz
ALTER TABLE public.portables_gaz ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateurs authentifiés peuvent lire gaz portables"
    ON public.portables_gaz FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Techniciens peuvent créer gaz portables"
    ON public.portables_gaz FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'technicien')
        )
    );

-- Créer le bucket storage pour les photos si non existant
INSERT INTO storage.buckets (id, name, public)
VALUES ('intervention-photos', 'intervention-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Politique d'accès au bucket (supprimer si existe déjà)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Utilisateurs authentifiés peuvent lire photos intervention" ON storage.objects;
    CREATE POLICY "Utilisateurs authentifiés peuvent lire photos intervention"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'intervention-photos' AND auth.uid() IS NOT NULL);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Techniciens peuvent uploader photos intervention" ON storage.objects;
    CREATE POLICY "Techniciens peuvent uploader photos intervention"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'intervention-photos' AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'technicien')
        )
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Commentaires
COMMENT ON TABLE public.portables IS 'Détecteurs portables';
COMMENT ON TABLE public.portables_verifications IS 'Vérifications fonctionnelles des portables';
COMMENT ON TABLE public.portables_gaz IS 'Gaz détectés par les portables avec leurs calibrations';
COMMENT ON TABLE public.intervention_photos IS 'Photos associées aux interventions';
COMMENT ON COLUMN public.interventions.type_rapport IS 'Type de rapport: fixe (centrales) ou portable (détecteurs portables)';