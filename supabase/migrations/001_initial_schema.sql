-- =====================================================
-- SÉCUR'IT - Schéma base de données PostgreSQL/Supabase
-- Gestion complète interventions détection gaz
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. UTILISATEURS (extend auth.users de Supabase)
-- =====================================================

CREATE TYPE user_role AS ENUM ('admin', 'technicien', 'client');

CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'technicien',
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies pour profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateurs peuvent voir leur profil"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Utilisateurs peuvent mettre à jour leur profil"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Admins peuvent tout voir"
    ON public.profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- 2. CLIENTS (Entreprises clientes)
-- =====================================================

CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom TEXT NOT NULL,
    siret TEXT,
    adresse_siege TEXT,
    code_postal TEXT,
    ville TEXT,
    telephone TEXT,
    email TEXT,
    contact_principal TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_clients_nom ON public.clients(nom);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tous les utilisateurs authentifiés peuvent voir les clients"
    ON public.clients FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admins peuvent gérer les clients"
    ON public.clients FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- 3. SITES (Adresses physiques des clients)
-- =====================================================

CREATE TABLE public.sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    nom TEXT NOT NULL,
    adresse TEXT NOT NULL,
    code_postal TEXT,
    ville TEXT NOT NULL,
    telephone TEXT,
    contact_nom TEXT,
    contact_fonction TEXT,
    contact_email TEXT,
    contact_telephone TEXT,
    horaires_acces TEXT,
    instructions_acces TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sites_client ON public.sites(client_id);

ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateurs authentifiés peuvent voir les sites"
    ON public.sites FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admins peuvent gérer les sites"
    ON public.sites FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- 4. INSTALLATIONS (Zones/systèmes par site)
-- =====================================================

CREATE TABLE public.installations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE NOT NULL,
    nom TEXT NOT NULL,
    zone TEXT,
    description TEXT,
    type_installation TEXT,
    date_mise_service DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_installations_site ON public.installations(site_id);

ALTER TABLE public.installations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateurs authentifiés peuvent voir les installations"
    ON public.installations FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admins et techniciens peuvent gérer les installations"
    ON public.installations FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'technicien')
        )
    );

-- =====================================================
-- 5. CENTRALES
-- =====================================================

CREATE TABLE public.centrales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    installation_id UUID REFERENCES public.installations(id) ON DELETE CASCADE NOT NULL,
    numero INTEGER,
    marque TEXT NOT NULL,
    modele TEXT NOT NULL,
    modele_autre TEXT,
    numero_serie TEXT,
    firmware TEXT,
    etat TEXT,
    aes_presente BOOLEAN DEFAULT FALSE,
    aes_modele TEXT,
    aes_statut TEXT,
    aes_alimentation_ondulee BOOLEAN DEFAULT FALSE,
    aes_date_remplacement DATE,
    aes_prochaine_echeance DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_centrales_installation ON public.centrales(installation_id);

ALTER TABLE public.centrales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateurs authentifiés peuvent voir les centrales"
    ON public.centrales FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admins et techniciens peuvent gérer les centrales"
    ON public.centrales FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'technicien')
        )
    );

-- =====================================================
-- 6. DÉTECTEURS GAZ
-- =====================================================

CREATE TABLE public.detecteurs_gaz (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    centrale_id UUID REFERENCES public.centrales(id) ON DELETE CASCADE NOT NULL,
    numero INTEGER,
    ligne TEXT,
    marque TEXT,
    modele TEXT,
    modele_autre TEXT,
    numero_serie TEXT,
    gaz TEXT NOT NULL,
    position TEXT,
    gamme TEXT,
    connexion TEXT DEFAULT '4-20mA',
    connexion_autre TEXT,
    
    -- Cellule
    cellule_etat TEXT,
    cellule_date_installation DATE,
    cellule_date_remplacement_theorique DATE,
    
    -- Étalonnage
    etalonnage_date_dernier DATE,
    etalonnage_prochaine_echeance DATE,
    etalonnage_operationnel TEXT,
    etalonnage_non_teste_demande_client BOOLEAN DEFAULT FALSE,
    etalonnage_temps_reponse TEXT,
    etalonnage_valeur_avant TEXT,
    etalonnage_valeur_apres TEXT,
    
    -- Calibrage zéro
    calibrage_zero_gaz_etalon TEXT,
    calibrage_zero_statut TEXT,
    
    -- Calibrage sensibilité
    calibrage_sensibilite_gaz_etalon TEXT,
    calibrage_sensibilite_valeur_mesuree TEXT,
    calibrage_sensibilite_concentration_theorique TEXT,
    calibrage_sensibilite_unite TEXT,
    calibrage_sensibilite_coefficient TEXT,
    calibrage_sensibilite_statut TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_detecteurs_gaz_centrale ON public.detecteurs_gaz(centrale_id);

ALTER TABLE public.detecteurs_gaz ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateurs authentifiés peuvent voir les détecteurs gaz"
    ON public.detecteurs_gaz FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admins et techniciens peuvent gérer les détecteurs gaz"
    ON public.detecteurs_gaz FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'technicien')
        )
    );

-- =====================================================
-- 7. SEUILS ALARME (par détecteur gaz)
-- =====================================================

CREATE TABLE public.seuils_alarme (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    detecteur_gaz_id UUID REFERENCES public.detecteurs_gaz(id) ON DELETE CASCADE NOT NULL,
    niveau INTEGER NOT NULL,
    valeur TEXT,
    unite TEXT DEFAULT 'ppm',
    asservissements TEXT,
    asservissement_operationnel TEXT,
    remontee_supervision BOOLEAN DEFAULT FALSE,
    non_teste_demande_client BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_seuils_detecteur ON public.seuils_alarme(detecteur_gaz_id);

ALTER TABLE public.seuils_alarme ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateurs authentifiés peuvent voir les seuils"
    ON public.seuils_alarme FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admins et techniciens peuvent gérer les seuils"
    ON public.seuils_alarme FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'technicien')
        )
    );

-- =====================================================
-- 8. DÉTECTEURS FLAMME
-- =====================================================

CREATE TABLE public.detecteurs_flamme (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    centrale_id UUID REFERENCES public.centrales(id) ON DELETE CASCADE NOT NULL,
    numero INTEGER,
    ligne TEXT,
    marque TEXT,
    modele TEXT,
    modele_autre TEXT,
    numero_serie TEXT,
    position TEXT,
    connexion TEXT DEFAULT '4-20mA',
    connexion_autre TEXT,
    
    -- Tests
    test_flamme_methode TEXT,
    test_flamme_resultat TEXT,
    
    -- Asservissements
    asservissements TEXT,
    asservissement_operationnel TEXT,
    non_teste_demande_client BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_detecteurs_flamme_centrale ON public.detecteurs_flamme(centrale_id);

ALTER TABLE public.detecteurs_flamme ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateurs authentifiés peuvent voir les détecteurs flamme"
    ON public.detecteurs_flamme FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admins et techniciens peuvent gérer les détecteurs flamme"
    ON public.detecteurs_flamme FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'technicien')
        )
    );

-- =====================================================
-- 9. INTERVENTIONS
-- =====================================================

CREATE TYPE intervention_type AS ENUM (
    'maintenance_preventive',
    'maintenance_corrective',
    'installation',
    'etalonnage',
    'depannage',
    'mise_en_service'
);

CREATE TYPE intervention_statut AS ENUM (
    'planifiee',
    'en_cours',
    'terminee',
    'annulee'
);

CREATE TABLE public.interventions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    installation_id UUID REFERENCES public.installations(id) ON DELETE CASCADE NOT NULL,
    technicien_id UUID REFERENCES auth.users(id) NOT NULL,
    
    date_intervention DATE NOT NULL,
    heure_debut TIME,
    heure_fin TIME,
    duree_heures DECIMAL(4,2),
    
    type intervention_type NOT NULL,
    statut intervention_statut DEFAULT 'planifiee',
    
    observations_generales TEXT,
    conditions_intervention TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_interventions_installation ON public.interventions(installation_id);
CREATE INDEX idx_interventions_technicien ON public.interventions(technicien_id);
CREATE INDEX idx_interventions_date ON public.interventions(date_intervention);

ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Techniciens peuvent voir leurs interventions"
    ON public.interventions FOR SELECT
    USING (
        auth.uid() = technicien_id OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins peuvent gérer toutes les interventions"
    ON public.interventions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Techniciens peuvent créer et modifier leurs interventions"
    ON public.interventions FOR INSERT
    WITH CHECK (auth.uid() = technicien_id);

CREATE POLICY "Techniciens peuvent mettre à jour leurs interventions"
    ON public.interventions FOR UPDATE
    USING (auth.uid() = technicien_id);

-- =====================================================
-- 10. OBSERVATIONS PAR CENTRALE (lors interventions)
-- =====================================================

CREATE TABLE public.observations_centrales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    intervention_id UUID REFERENCES public.interventions(id) ON DELETE CASCADE NOT NULL,
    centrale_id UUID REFERENCES public.centrales(id) ON DELETE CASCADE NOT NULL,
    
    travaux_effectues TEXT,
    anomalies TEXT,
    recommandations TEXT,
    pieces_remplacees TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_observations_intervention ON public.observations_centrales(intervention_id);
CREATE INDEX idx_observations_centrale ON public.observations_centrales(centrale_id);

ALTER TABLE public.observations_centrales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateurs peuvent voir observations liées à leurs interventions"
    ON public.observations_centrales FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.interventions
            WHERE id = intervention_id AND (
                technicien_id = auth.uid() OR
                EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
            )
        )
    );

-- =====================================================
-- 11. RAPPORTS PDF GÉNÉRÉS
-- =====================================================

CREATE TYPE rapport_statut AS ENUM ('brouillon', 'valide', 'envoye');

CREATE TABLE public.rapports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    intervention_id UUID REFERENCES public.interventions(id) ON DELETE CASCADE NOT NULL,
    
    numero_rapport TEXT UNIQUE NOT NULL,
    statut rapport_statut DEFAULT 'brouillon',
    
    -- JSON complet des données (backup)
    donnees_json JSONB NOT NULL,
    
    -- Signatures
    signature_technicien_nom TEXT,
    signature_technicien_data TEXT,
    signature_technicien_date TIMESTAMPTZ,
    
    signature_client_nom TEXT,
    signature_client_fonction TEXT,
    signature_client_data TEXT,
    signature_client_date TIMESTAMPTZ,
    
    -- PDF
    pdf_url TEXT,
    pdf_generated_at TIMESTAMPTZ,
    
    -- Email
    email_envoye BOOLEAN DEFAULT FALSE,
    email_destinataire TEXT,
    email_envoye_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rapports_intervention ON public.rapports(intervention_id);
CREATE INDEX idx_rapports_numero ON public.rapports(numero_rapport);

ALTER TABLE public.rapports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Techniciens voient leurs rapports"
    ON public.rapports FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.interventions i
            WHERE i.id = intervention_id AND (
                i.technicien_id = auth.uid() OR
                EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
            )
        )
    );

-- =====================================================
-- 12. TEMPLATES INSTALLATIONS (configurations sauvegardées)
-- =====================================================

CREATE TABLE public.templates_installations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    installation_id UUID REFERENCES public.installations(id) ON DELETE CASCADE NOT NULL,
    
    nom TEXT NOT NULL,
    description TEXT,
    version INTEGER DEFAULT 1,
    
    -- Snapshot complet configuration
    configuration_json JSONB NOT NULL,
    
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_templates_installation ON public.templates_installations(installation_id);

ALTER TABLE public.templates_installations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tous peuvent voir templates"
    ON public.templates_installations FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admins et techniciens peuvent créer templates"
    ON public.templates_installations FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'technicien')
        )
    );

-- =====================================================
-- 13. PHOTOS (liées aux interventions)
-- =====================================================

CREATE TABLE public.photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    intervention_id UUID REFERENCES public.interventions(id) ON DELETE CASCADE,
    centrale_id UUID REFERENCES public.centrales(id) ON DELETE CASCADE,
    detecteur_gaz_id UUID REFERENCES public.detecteurs_gaz(id) ON DELETE CASCADE,
    detecteur_flamme_id UUID REFERENCES public.detecteurs_flamme(id) ON DELETE CASCADE,
    
    url TEXT NOT NULL,
    legende TEXT,
    ordre INTEGER DEFAULT 0,
    
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_photos_intervention ON public.photos(intervention_id);

ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Photos visibles selon intervention"
    ON public.photos FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.interventions i
            WHERE i.id = intervention_id AND (
                i.technicien_id = auth.uid() OR
                EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
            )
        )
    );

-- =====================================================
-- 14. ALERTES MAINTENANCE (fin de vie cellules, etc.)
-- =====================================================

CREATE TYPE alerte_type AS ENUM ('cellule_fin_vie', 'batterie_aes', 'etalonnage_echu', 'anomalie');
CREATE TYPE alerte_priorite AS ENUM ('basse', 'moyenne', 'haute', 'critique');

CREATE TABLE public.alertes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type alerte_type NOT NULL,
    priorite alerte_priorite DEFAULT 'moyenne',
    
    detecteur_gaz_id UUID REFERENCES public.detecteurs_gaz(id) ON DELETE CASCADE,
    centrale_id UUID REFERENCES public.centrales(id) ON DELETE CASCADE,
    
    titre TEXT NOT NULL,
    message TEXT NOT NULL,
    date_echeance DATE,
    
    traitee BOOLEAN DEFAULT FALSE,
    traitee_par UUID REFERENCES auth.users(id),
    traitee_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alertes_traitee ON public.alertes(traitee);
CREATE INDEX idx_alertes_priorite ON public.alertes(priorite);

ALTER TABLE public.alertes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tous les utilisateurs authentifiés voient les alertes"
    ON public.alertes FOR SELECT
    USING (auth.role() = 'authenticated');

-- =====================================================
-- 15. FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction : Générer numéro de rapport unique
CREATE OR REPLACE FUNCTION generate_rapport_numero()
RETURNS TEXT AS $$
DECLARE
    year_code TEXT;
    counter INTEGER;
    new_numero TEXT;
BEGIN
    year_code := TO_CHAR(NOW(), 'YY');
    
    SELECT COALESCE(MAX(SUBSTRING(numero_rapport FROM 10)::INTEGER), 0) + 1
    INTO counter
    FROM public.rapports
    WHERE numero_rapport LIKE 'SECURIT-' || year_code || '-%';
    
    new_numero := 'SECURIT-' || year_code || '-' || LPAD(counter::TEXT, 4, '0');
    
    RETURN new_numero;
END;
$$ LANGUAGE plpgsql;

-- Fonction : Calculer durée intervention
CREATE OR REPLACE FUNCTION calculate_intervention_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.heure_debut IS NOT NULL AND NEW.heure_fin IS NOT NULL THEN
        NEW.duree_heures := EXTRACT(EPOCH FROM (NEW.heure_fin - NEW.heure_debut)) / 3600;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_duration
BEFORE INSERT OR UPDATE ON public.interventions
FOR EACH ROW
EXECUTE FUNCTION calculate_intervention_duration();

-- Fonction : Auto update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer trigger updated_at sur toutes les tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON public.sites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_installations_updated_at BEFORE UPDATE ON public.installations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_centrales_updated_at BEFORE UPDATE ON public.centrales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_detecteurs_gaz_updated_at BEFORE UPDATE ON public.detecteurs_gaz FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_detecteurs_flamme_updated_at BEFORE UPDATE ON public.detecteurs_flamme FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FIN DU SCHÉMA
-- =====================================================