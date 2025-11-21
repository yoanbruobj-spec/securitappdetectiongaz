-- Migration : Système multi-stocks (principal, chantiers, véhicules)
-- Permet de gérer plusieurs emplacements de stock avec traçabilité complète

-- ============================================
-- 1. CRÉATION DE LA TABLE stock_emplacements
-- ============================================

CREATE TABLE IF NOT EXISTS public.stock_emplacements (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  type text NOT NULL CHECK (type = ANY (ARRAY['principal'::text, 'chantier'::text, 'vehicule'::text])),
  nom text NOT NULL,
  description text,
  -- Pour les chantiers : infos client, adresse, etc.
  chantier_info jsonb,
  -- Pour les véhicules : lien vers le technicien/admin propriétaire
  utilisateur_id uuid,
  actif boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT stock_emplacements_pkey PRIMARY KEY (id),
  CONSTRAINT stock_emplacements_utilisateur_id_fkey FOREIGN KEY (utilisateur_id) REFERENCES public.profiles(id)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_stock_emplacements_type ON public.stock_emplacements(type);
CREATE INDEX IF NOT EXISTS idx_stock_emplacements_utilisateur_id ON public.stock_emplacements(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_stock_emplacements_actif ON public.stock_emplacements(actif);

-- ============================================
-- 2. CRÉATION DE LA TABLE stock_inventaire
-- ============================================

CREATE TABLE IF NOT EXISTS public.stock_inventaire (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  article_id uuid NOT NULL,
  emplacement_id uuid NOT NULL,
  quantite integer NOT NULL DEFAULT 0 CHECK (quantite >= 0),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT stock_inventaire_pkey PRIMARY KEY (id),
  CONSTRAINT stock_inventaire_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.stock_articles(id) ON DELETE CASCADE,
  CONSTRAINT stock_inventaire_emplacement_id_fkey FOREIGN KEY (emplacement_id) REFERENCES public.stock_emplacements(id) ON DELETE CASCADE,
  -- Contrainte unique : un article ne peut avoir qu'une seule ligne par emplacement
  CONSTRAINT stock_inventaire_article_emplacement_unique UNIQUE (article_id, emplacement_id)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_stock_inventaire_article_id ON public.stock_inventaire(article_id);
CREATE INDEX IF NOT EXISTS idx_stock_inventaire_emplacement_id ON public.stock_inventaire(emplacement_id);

-- ============================================
-- 3. MODIFICATION DE LA TABLE stock_mouvements
-- ============================================

-- Ajouter le type 'transfert' aux mouvements existants
ALTER TABLE public.stock_mouvements DROP CONSTRAINT IF EXISTS stock_mouvements_type_check;
ALTER TABLE public.stock_mouvements ADD CONSTRAINT stock_mouvements_type_check
  CHECK (type = ANY (ARRAY['entree'::text, 'sortie'::text, 'ajustement'::text, 'transfert'::text]));

-- Ajouter les colonnes pour les emplacements (source et destination pour transferts)
ALTER TABLE public.stock_mouvements ADD COLUMN IF NOT EXISTS emplacement_source_id uuid;
ALTER TABLE public.stock_mouvements ADD COLUMN IF NOT EXISTS emplacement_destination_id uuid;

-- Ajouter les contraintes de clés étrangères
ALTER TABLE public.stock_mouvements
  ADD CONSTRAINT stock_mouvements_emplacement_source_id_fkey
  FOREIGN KEY (emplacement_source_id) REFERENCES public.stock_emplacements(id);

ALTER TABLE public.stock_mouvements
  ADD CONSTRAINT stock_mouvements_emplacement_destination_id_fkey
  FOREIGN KEY (emplacement_destination_id) REFERENCES public.stock_emplacements(id);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_stock_mouvements_emplacement_source ON public.stock_mouvements(emplacement_source_id);
CREATE INDEX IF NOT EXISTS idx_stock_mouvements_emplacement_destination ON public.stock_mouvements(emplacement_destination_id);

-- ============================================
-- 4. CRÉATION DE L'EMPLACEMENT "STOCK PRINCIPAL" PAR DÉFAUT
-- ============================================

INSERT INTO public.stock_emplacements (type, nom, description, actif)
VALUES (
  'principal',
  'Stock Principal',
  'Stock central - Dépôt principal',
  true
)
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. MIGRATION DES DONNÉES EXISTANTES
-- ============================================

-- Migrer toutes les quantités actuelles vers le Stock Principal
DO $$
DECLARE
  stock_principal_id uuid;
  article_record RECORD;
BEGIN
  -- Récupérer l'ID du stock principal
  SELECT id INTO stock_principal_id
  FROM public.stock_emplacements
  WHERE type = 'principal' AND nom = 'Stock Principal'
  LIMIT 1;

  -- Si le stock principal existe, migrer les données
  IF stock_principal_id IS NOT NULL THEN
    -- Pour chaque article avec une quantité > 0
    FOR article_record IN
      SELECT id, quantite
      FROM public.stock_articles
      WHERE quantite > 0
    LOOP
      -- Insérer dans stock_inventaire
      INSERT INTO public.stock_inventaire (article_id, emplacement_id, quantite)
      VALUES (article_record.id, stock_principal_id, article_record.quantite)
      ON CONFLICT (article_id, emplacement_id) DO NOTHING;
    END LOOP;

    RAISE NOTICE 'Migration des données terminée : % articles migrés vers Stock Principal',
      (SELECT COUNT(*) FROM public.stock_articles WHERE quantite > 0);
  ELSE
    RAISE WARNING 'Stock Principal non trouvé, migration annulée';
  END IF;
END $$;

-- ============================================
-- 6. POLICIES RLS POUR LES NOUVELLES TABLES
-- ============================================

-- Activer RLS
ALTER TABLE public.stock_emplacements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_inventaire ENABLE ROW LEVEL SECURITY;

-- stock_emplacements : tous peuvent voir, admins peuvent gérer
CREATE POLICY "Users can view stock emplacements"
ON public.stock_emplacements
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage stock emplacements"
ON public.stock_emplacements
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- stock_inventaire : tous peuvent voir et mettre à jour
CREATE POLICY "Users can view stock inventaire"
ON public.stock_inventaire
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update stock inventaire"
ON public.stock_inventaire
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can insert stock inventaire"
ON public.stock_inventaire
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Admins peuvent supprimer
CREATE POLICY "Admins can delete stock inventaire"
ON public.stock_inventaire
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ============================================
-- 7. FONCTION HELPER POUR CALCULER LE STOCK TOTAL
-- ============================================

CREATE OR REPLACE FUNCTION get_article_stock_total(p_article_id uuid)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  total integer;
BEGIN
  SELECT COALESCE(SUM(quantite), 0) INTO total
  FROM public.stock_inventaire
  WHERE article_id = p_article_id;

  RETURN total;
END;
$$;

-- ============================================
-- 8. VUE POUR AFFICHAGE SIMPLIFIÉ DU STOCK PAR ARTICLE
-- ============================================

CREATE OR REPLACE VIEW stock_par_article AS
SELECT
  sa.id as article_id,
  sa.nom,
  sa.reference,
  sa.qr_code,
  COALESCE(SUM(si.quantite), 0) as stock_total,
  json_agg(
    json_build_object(
      'emplacement_id', se.id,
      'emplacement_nom', se.nom,
      'emplacement_type', se.type,
      'quantite', si.quantite
    )
  ) FILTER (WHERE si.quantite > 0) as detail_emplacements
FROM public.stock_articles sa
LEFT JOIN public.stock_inventaire si ON sa.id = si.article_id
LEFT JOIN public.stock_emplacements se ON si.emplacement_id = se.id
GROUP BY sa.id, sa.nom, sa.reference, sa.qr_code;

-- Permission sur la vue
GRANT SELECT ON stock_par_article TO authenticated;

-- ============================================
-- COMMENTAIRES POUR DOCUMENTATION
-- ============================================

COMMENT ON TABLE public.stock_emplacements IS
  'Emplacements de stockage : principal (dépôt), chantiers (préparation client), véhicules (techniciens)';

COMMENT ON TABLE public.stock_inventaire IS
  'Quantités d''articles par emplacement. Permet de tracer où se trouve chaque article.';

COMMENT ON COLUMN public.stock_mouvements.emplacement_source_id IS
  'Pour les transferts : emplacement d''origine';

COMMENT ON COLUMN public.stock_mouvements.emplacement_destination_id IS
  'Pour les transferts : emplacement de destination';

COMMENT ON FUNCTION get_article_stock_total IS
  'Calcule le stock total d''un article en additionnant toutes ses quantités dans tous les emplacements';
