-- =====================================================
-- Migration 002 - Complétion du schéma intervention
-- Ajout de tous les champs manquants
-- =====================================================

-- =====================================================
-- 1. MISE À JOUR TABLE INTERVENTIONS
-- =====================================================

ALTER TABLE public.interventions
ADD COLUMN IF NOT EXISTS heure_debut TIME,
ADD COLUMN IF NOT EXISTS heure_fin TIME,
ADD COLUMN IF NOT EXISTS duree_minutes INTEGER GENERATED ALWAYS AS (
    CASE 
        WHEN heure_fin IS NOT NULL AND heure_debut IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (heure_fin - heure_debut)) / 60
        ELSE NULL
    END
) STORED,
ADD COLUMN IF NOT EXISTS local TEXT,
ADD COLUMN IF NOT EXISTS contact_site TEXT,
ADD COLUMN IF NOT EXISTS tel_contact TEXT,
ADD COLUMN IF NOT EXISTS email_rapport TEXT;

-- =====================================================
-- 2. MISE À JOUR TABLE CENTRALES
-- =====================================================

ALTER TABLE public.centrales
ADD COLUMN IF NOT EXISTS firmware TEXT,
ADD COLUMN IF NOT EXISTS etat_general TEXT CHECK (etat_general IN ('Bon', 'Acceptable', 'À surveiller', 'Défaillant'));

-- =====================================================
-- 3. CRÉATION TABLE AES (ALIMENTATION DE SECOURS)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.aes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    centrale_id UUID REFERENCES public.centrales(id) ON DELETE CASCADE NOT NULL,
    presente BOOLEAN DEFAULT false,
    modele TEXT,
    statut TEXT CHECK (statut IN ('Bon', 'À surveiller', 'Vieillissantes', 'À remplacer', 'Défaillant')),
    ondulee BOOLEAN DEFAULT false,
    date_remplacement DATE,
    prochaine_echeance DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_aes_centrale ON public.aes(centrale_id);

-- RLS pour AES
ALTER TABLE public.aes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateurs authentifiés peuvent lire AES"
    ON public.aes FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Techniciens peuvent modifier AES"
    ON public.aes FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'technicien')
        )
    );

-- =====================================================
-- 4. MISE À JOUR TABLE DETECTEURS_GAZ
-- =====================================================

ALTER TABLE public.detecteurs_gaz
ADD COLUMN IF NOT EXISTS type_connexion TEXT,
ADD COLUMN IF NOT EXISTS connexion_autre TEXT,
ADD COLUMN IF NOT EXISTS gamme_mesure TEXT,
ADD COLUMN IF NOT EXISTS temps_reponse TEXT,
ADD COLUMN IF NOT EXISTS valeur_avant DECIMAL(10,3),
ADD COLUMN IF NOT EXISTS valeur_apres DECIMAL(10,3),
ADD COLUMN IF NOT EXISTS gaz_zero TEXT,
ADD COLUMN IF NOT EXISTS statut_zero TEXT CHECK (statut_zero IN ('OK', 'Dérive', 'HS')),
ADD COLUMN IF NOT EXISTS gaz_sensi TEXT,
ADD COLUMN IF NOT EXISTS valeur_theorique DECIMAL(10,3),
ADD COLUMN IF NOT EXISTS valeur_mesuree DECIMAL(10,3),
ADD COLUMN IF NOT EXISTS unite_etal TEXT,
ADD COLUMN IF NOT EXISTS coefficient DECIMAL(10,3),
ADD COLUMN IF NOT EXISTS statut_sensi TEXT CHECK (statut_sensi IN ('OK', 'Dérive acceptable', 'Dérive limite', 'HS')),
ADD COLUMN IF NOT EXISTS operationnel BOOLEAN,
ADD COLUMN IF NOT EXISTS non_teste BOOLEAN DEFAULT false;

-- =====================================================
-- 5. MISE À JOUR TABLE DETECTEURS_FLAMME
-- =====================================================

ALTER TABLE public.detecteurs_flamme
ADD COLUMN IF NOT EXISTS ligne TEXT,
ADD COLUMN IF NOT EXISTS type_connexion TEXT,
ADD COLUMN IF NOT EXISTS connexion_autre TEXT,
ADD COLUMN IF NOT EXISTS asservissements TEXT,
ADD COLUMN IF NOT EXISTS asserv_operationnel BOOLEAN,
ADD COLUMN IF NOT EXISTS non_teste BOOLEAN DEFAULT false;

-- =====================================================
-- 6. MISE À JOUR TABLE SEUILS_ALARME
-- =====================================================

ALTER TABLE public.seuils_alarme
ADD COLUMN IF NOT EXISTS asservissements TEXT,
ADD COLUMN IF NOT EXISTS asserv_operationnel BOOLEAN,
ADD COLUMN IF NOT EXISTS supervision BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS non_teste BOOLEAN DEFAULT false;

-- =====================================================
-- 7. CRÉATION TABLE SIGNATURES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.signatures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    intervention_id UUID REFERENCES public.interventions(id) ON DELETE CASCADE NOT NULL,
    type TEXT CHECK (type IN ('technicien', 'client')) NOT NULL,
    nom TEXT NOT NULL,
    signature_data TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_signatures_intervention ON public.signatures(intervention_id);

-- RLS pour signatures
ALTER TABLE public.signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateurs authentifiés peuvent lire signatures"
    ON public.signatures FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Techniciens peuvent créer signatures"
    ON public.signatures FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'technicien')
        )
    );

-- =====================================================
-- 8. MISE À JOUR TABLE OBSERVATIONS_CENTRALES
-- =====================================================

ALTER TABLE public.observations_centrales
ADD COLUMN IF NOT EXISTS travaux_effectues TEXT,
ADD COLUMN IF NOT EXISTS anomalies_constatees TEXT,
ADD COLUMN IF NOT EXISTS recommandations TEXT,
ADD COLUMN IF NOT EXISTS pieces_remplacees TEXT;

-- =====================================================
-- 9. CRÉATION TABLE EQUIPEMENTS (BASE DE DONNÉES)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.equipements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT CHECK (type IN ('centrale', 'detecteur_gaz', 'detecteur_flamme')) NOT NULL,
    marque TEXT NOT NULL,
    modele TEXT NOT NULL,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_equipements_type_marque ON public.equipements(type, marque);

-- RLS pour équipements
ALTER TABLE public.equipements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tout le monde peut lire équipements"
    ON public.equipements FOR SELECT
    USING (true);

CREATE POLICY "Admins peuvent gérer équipements"
    ON public.equipements FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- 10. CRÉATION TABLE TYPES_GAZ (BASE DE DONNÉES)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.types_gaz (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    nom TEXT NOT NULL,
    categorie TEXT CHECK (categorie IN ('toxique', 'explosif', 'asphyxiant', 'organique', 'refrigerant')) NOT NULL,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_types_gaz_categorie ON public.types_gaz(categorie);

-- RLS pour types_gaz
ALTER TABLE public.types_gaz ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tout le monde peut lire types gaz"
    ON public.types_gaz FOR SELECT
    USING (true);

CREATE POLICY "Admins peuvent gérer types gaz"
    ON public.types_gaz FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- 11. INSERTION DONNÉES TYPES DE GAZ
-- =====================================================

INSERT INTO public.types_gaz (code, nom, categorie) VALUES
-- Gaz Toxiques
('CO', 'Monoxyde de carbone', 'toxique'),
('H2S', 'Sulfure d''hydrogène', 'toxique'),
('NH3', 'Ammoniac', 'toxique'),
('SO2', 'Dioxyde de soufre', 'toxique'),
('NO2', 'Dioxyde d''azote', 'toxique'),
('NO', 'Monoxyde d''azote', 'toxique'),
('Cl2', 'Chlore', 'toxique'),
('HCl', 'Acide chlorhydrique', 'toxique'),
('HCN', 'Acide cyanhydrique', 'toxique'),
('PH3', 'Phosphine', 'toxique'),
('HF', 'Acide fluorhydrique', 'toxique'),
('COCl2', 'Phosgène', 'toxique'),
('SiH4', 'Silane', 'toxique'),
('AsH3', 'Arsine', 'toxique'),
('B2H6', 'Diborane', 'toxique'),

-- Gaz Explosifs
('CH4', 'Méthane', 'explosif'),
('C3H8', 'Propane', 'explosif'),
('C4H10', 'Butane', 'explosif'),
('H2', 'Hydrogène', 'explosif'),
('C2H4', 'Éthylène', 'explosif'),
('C2H6', 'Éthane', 'explosif'),
('C2H2', 'Acétylène', 'explosif'),
('Essence', 'Essence', 'explosif'),
('GPL', 'GPL', 'explosif'),
('Gaz_Naturel', 'Gaz Naturel', 'explosif'),
('Pentane', 'Pentane', 'explosif'),
('Hexane', 'Hexane', 'explosif'),
('Heptane', 'Heptane', 'explosif'),
('Octane', 'Octane', 'explosif'),
('LIE', 'Limite inférieure d''explosivité', 'explosif'),

-- Gaz Asphyxiants
('O2', 'Oxygène', 'asphyxiant'),
('CO2', 'Dioxyde de carbone', 'asphyxiant'),
('N2', 'Azote', 'asphyxiant'),
('Ar', 'Argon', 'asphyxiant'),
('He', 'Hélium', 'asphyxiant'),

-- Vapeurs Organiques
('COV', 'Composés Organiques Volatils', 'organique'),
('Benzene', 'Benzène', 'organique'),
('Toluene', 'Toluène', 'organique'),
('Xylene', 'Xylène', 'organique'),
('Acetone', 'Acétone', 'organique'),
('Methanol', 'Méthanol', 'organique'),
('Ethanol', 'Éthanol', 'organique'),
('Styrene', 'Styrène', 'organique'),

-- Gaz Réfrigérants
('R32', 'R32', 'refrigerant'),
('R410A', 'R410A', 'refrigerant'),
('R134a', 'R134a', 'refrigerant'),
('R404A', 'R404A', 'refrigerant'),
('R407C', 'R407C', 'refrigerant'),
('R717', 'R717 (Ammoniac)', 'refrigerant'),
('R744', 'R744 (CO2)', 'refrigerant'),
('R290', 'R290 (Propane)', 'refrigerant'),
('R600a', 'R600a (Isobutane)', 'refrigerant')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- 12. COMMENTAIRES SUR LES TABLES
-- =====================================================

COMMENT ON TABLE public.aes IS 'Alimentation de secours des centrales';
COMMENT ON TABLE public.signatures IS 'Signatures électroniques technicien et client';
COMMENT ON TABLE public.equipements IS 'Base de données des équipements (centrales, détecteurs)';
COMMENT ON TABLE public.types_gaz IS 'Base de données des types de gaz détectables';

COMMENT ON COLUMN public.interventions.duree_minutes IS 'Durée calculée automatiquement en minutes';
COMMENT ON COLUMN public.detecteurs_gaz.coefficient IS 'Coefficient de calibrage calculé';
COMMENT ON COLUMN public.signatures.signature_data IS 'Signature en format base64/dataURL';