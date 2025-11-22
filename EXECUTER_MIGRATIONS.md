# Guide d'exécution des migrations SQL

## Étape 1 : Se connecter à Supabase

1. Aller sur : https://supabase.com/dashboard/project/ujwxxsjboxlwkkgbuouy
2. Cliquer sur **"SQL Editor"** dans le menu de gauche
3. Cliquer sur **"New Query"**

---

## Étape 2 : Exécuter les migrations dans l'ordre

### Migration 1 : Support des automates

Copier-coller le contenu ci-dessous et cliquer sur **"Run"** :

```sql
-- Migration 030: Support des automates
ALTER TABLE public.centrales
ADD COLUMN IF NOT EXISTS type_equipement text DEFAULT 'centrale' CHECK (type_equipement IN ('centrale', 'automate'));

ALTER TABLE public.centrales
ADD COLUMN IF NOT EXISTS marque_personnalisee text;

CREATE INDEX IF NOT EXISTS idx_centrales_type_equipement ON public.centrales(type_equipement);

UPDATE public.centrales
SET type_equipement = 'centrale'
WHERE type_equipement IS NULL;

COMMENT ON COLUMN public.centrales.type_equipement IS 'Type d''équipement: centrale ou automate';
COMMENT ON COLUMN public.centrales.marque_personnalisee IS 'Marque personnalisée saisie manuellement si non présente dans la liste';
```

✅ **Vérifier** : Si "Success. No rows returned" s'affiche, c'est bon !

---

### Migration 2 : Table des commandes de cellules

Copier-coller et exécuter :

```sql
-- Migration 031: Table commandes_cellules
CREATE TABLE IF NOT EXISTS public.commandes_cellules (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  detecteur_gaz_id uuid,
  portable_gaz_id uuid,
  client_id uuid NOT NULL,
  site_id uuid NOT NULL,
  centrale_id uuid,
  modele_detecteur text,
  gaz text NOT NULL,
  gamme_mesure text,
  numero_serie_detecteur text,
  date_remplacement_theorique date NOT NULL,
  date_alerte timestamp with time zone DEFAULT now(),
  date_commande date,
  date_reception date,
  date_remplacement_effectif date,
  statut text NOT NULL DEFAULT 'attente_commande' CHECK (
    statut IN ('attente_commande', 'commandé', 'reçu', 'remplacé')
  ),
  rapport_intervention_id uuid,
  fournisseur text,
  reference_commande text,
  quantite integer DEFAULT 1,
  prix_unitaire numeric,
  notes text,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT commandes_cellules_pkey PRIMARY KEY (id),
  CONSTRAINT commandes_cellules_detecteur_gaz_fkey FOREIGN KEY (detecteur_gaz_id) REFERENCES public.detecteurs_gaz(id) ON DELETE CASCADE,
  CONSTRAINT commandes_cellules_portable_gaz_fkey FOREIGN KEY (portable_gaz_id) REFERENCES public.portables_gaz(id) ON DELETE CASCADE,
  CONSTRAINT commandes_cellules_client_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE,
  CONSTRAINT commandes_cellules_site_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE CASCADE,
  CONSTRAINT commandes_cellules_centrale_fkey FOREIGN KEY (centrale_id) REFERENCES public.centrales(id) ON DELETE SET NULL,
  CONSTRAINT commandes_cellules_intervention_fkey FOREIGN KEY (rapport_intervention_id) REFERENCES public.interventions(id) ON DELETE SET NULL,
  CONSTRAINT commandes_cellules_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT commandes_cellules_one_detecteur CHECK (
    (detecteur_gaz_id IS NOT NULL AND portable_gaz_id IS NULL) OR
    (detecteur_gaz_id IS NULL AND portable_gaz_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_commandes_cellules_statut ON public.commandes_cellules(statut);
CREATE INDEX IF NOT EXISTS idx_commandes_cellules_date_theorique ON public.commandes_cellules(date_remplacement_theorique);
CREATE INDEX IF NOT EXISTS idx_commandes_cellules_client ON public.commandes_cellules(client_id);
CREATE INDEX IF NOT EXISTS idx_commandes_cellules_site ON public.commandes_cellules(site_id);
CREATE INDEX IF NOT EXISTS idx_commandes_cellules_detecteur_gaz ON public.commandes_cellules(detecteur_gaz_id);
CREATE INDEX IF NOT EXISTS idx_commandes_cellules_portable_gaz ON public.commandes_cellules(portable_gaz_id);

CREATE OR REPLACE FUNCTION public.update_commandes_cellules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_commandes_cellules_updated_at
  BEFORE UPDATE ON public.commandes_cellules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_commandes_cellules_updated_at();

ALTER TABLE public.commandes_cellules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autoriser lecture pour tous les utilisateurs authentifiés"
ON public.commandes_cellules FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Autoriser insertion pour tous les utilisateurs authentifiés"
ON public.commandes_cellules FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Autoriser mise à jour pour tous les utilisateurs authentifiés"
ON public.commandes_cellules FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Autoriser suppression pour admins uniquement"
ON public.commandes_cellules FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

COMMENT ON TABLE public.commandes_cellules IS 'Suivi des commandes et remplacements de cellules de détecteurs';
```

✅ **Vérifier** : Table créée avec succès

---

### Migration 3 : Table de suivi des anomalies

Copier-coller et exécuter :

```sql
-- Migration 032: Table suivi_anomalies
CREATE TABLE IF NOT EXISTS public.suivi_anomalies (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  intervention_id uuid NOT NULL,
  client_id uuid NOT NULL,
  site_id uuid NOT NULL,
  centrale_id uuid,
  detecteur_gaz_id uuid,
  detecteur_flamme_id uuid,
  portable_id uuid,
  type_equipement text CHECK (
    type_equipement IN ('centrale', 'automate', 'detecteur_gaz', 'detecteur_flamme', 'portable', 'autre')
  ),
  description_anomalie text NOT NULL,
  priorite text DEFAULT 'moyenne' CHECK (
    priorite IN ('basse', 'moyenne', 'haute', 'critique')
  ),
  statut text NOT NULL DEFAULT 'devis_attente' CHECK (
    statut IN (
      'devis_attente',
      'devis_etabli',
      'devis_soumis',
      'attente_commande',
      'commandé',
      'travaux_planifies',
      'travaux_effectues'
    )
  ),
  montant_devis numeric,
  reference_devis text,
  date_constat date NOT NULL,
  date_devis date,
  date_soumission date,
  date_commande date,
  date_travaux_planifies date,
  date_travaux_effectues date,
  historique jsonb DEFAULT '[]'::jsonb,
  notes text,
  pieces_jointes jsonb DEFAULT '[]'::jsonb,
  created_by uuid NOT NULL,
  updated_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT suivi_anomalies_pkey PRIMARY KEY (id),
  CONSTRAINT suivi_anomalies_intervention_fkey FOREIGN KEY (intervention_id) REFERENCES public.interventions(id) ON DELETE CASCADE,
  CONSTRAINT suivi_anomalies_client_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE,
  CONSTRAINT suivi_anomalies_site_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE CASCADE,
  CONSTRAINT suivi_anomalies_centrale_fkey FOREIGN KEY (centrale_id) REFERENCES public.centrales(id) ON DELETE SET NULL,
  CONSTRAINT suivi_anomalies_detecteur_gaz_fkey FOREIGN KEY (detecteur_gaz_id) REFERENCES public.detecteurs_gaz(id) ON DELETE SET NULL,
  CONSTRAINT suivi_anomalies_detecteur_flamme_fkey FOREIGN KEY (detecteur_flamme_id) REFERENCES public.detecteurs_flamme(id) ON DELETE SET NULL,
  CONSTRAINT suivi_anomalies_portable_fkey FOREIGN KEY (portable_id) REFERENCES public.portables(id) ON DELETE SET NULL,
  CONSTRAINT suivi_anomalies_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT suivi_anomalies_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_suivi_anomalies_statut ON public.suivi_anomalies(statut);
CREATE INDEX IF NOT EXISTS idx_suivi_anomalies_priorite ON public.suivi_anomalies(priorite);
CREATE INDEX IF NOT EXISTS idx_suivi_anomalies_client ON public.suivi_anomalies(client_id);
CREATE INDEX IF NOT EXISTS idx_suivi_anomalies_site ON public.suivi_anomalies(site_id);
CREATE INDEX IF NOT EXISTS idx_suivi_anomalies_intervention ON public.suivi_anomalies(intervention_id);
CREATE INDEX IF NOT EXISTS idx_suivi_anomalies_centrale ON public.suivi_anomalies(centrale_id);
CREATE INDEX IF NOT EXISTS idx_suivi_anomalies_date_constat ON public.suivi_anomalies(date_constat);

CREATE OR REPLACE FUNCTION public.update_suivi_anomalies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_suivi_anomalies_updated_at
  BEFORE UPDATE ON public.suivi_anomalies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_suivi_anomalies_updated_at();

CREATE OR REPLACE FUNCTION public.add_anomalie_status_to_history()
RETURNS TRIGGER AS $$
DECLARE
  history_entry jsonb;
BEGIN
  IF OLD.statut IS DISTINCT FROM NEW.statut THEN
    history_entry := jsonb_build_object(
      'date', now(),
      'ancien_statut', OLD.statut,
      'nouveau_statut', NEW.statut,
      'user_id', auth.uid(),
      'notes', NEW.notes
    );
    NEW.historique := COALESCE(NEW.historique, '[]'::jsonb) || history_entry;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER add_anomalie_status_to_history
  BEFORE UPDATE ON public.suivi_anomalies
  FOR EACH ROW
  EXECUTE FUNCTION public.add_anomalie_status_to_history();

ALTER TABLE public.suivi_anomalies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autoriser lecture pour tous les utilisateurs authentifiés"
ON public.suivi_anomalies FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Autoriser insertion pour tous les utilisateurs authentifiés"
ON public.suivi_anomalies FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Autoriser mise à jour pour tous les utilisateurs authentifiés"
ON public.suivi_anomalies FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Autoriser suppression pour admins uniquement"
ON public.suivi_anomalies FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

COMMENT ON TABLE public.suivi_anomalies IS 'Suivi complet des anomalies détectées lors des interventions';
```

✅ **Vérifier** : Table créée avec succès

---

## Étape 3 : Vérifier les tables créées

Exécuter cette requête pour vérifier :

```sql
-- Vérifier que les tables existent
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('commandes_cellules', 'suivi_anomalies')
ORDER BY table_name;

-- Vérifier les colonnes de centrales
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'centrales'
AND column_name IN ('type_equipement', 'marque_personnalisee');
```

**Résultat attendu** :
- 2 tables : commandes_cellules, suivi_anomalies
- 2 colonnes : type_equipement, marque_personnalisee

---

## ✅ Migrations terminées !

Une fois les 3 migrations exécutées avec succès, vous pouvez :

1. **Tester les nouvelles pages** :
   - http://localhost:3000/suivi-cellules
   - http://localhost:3000/anomalies

2. **Configurer le cron job** :
   - Ajouter `CRON_SECRET=votre-secret` dans `.env.local`
   - Configurer un appel quotidien à `/api/cron/check-cellules`

3. **Intégrer les composants** selon `INTEGRATION_COMPOSANTS.md`

4. **Améliorer les PDFs** selon `AMELIORATION_PDF_GUIDE.md`

---

## ⚠️ En cas d'erreur

Si vous rencontrez une erreur du type "relation already exists" :

```sql
-- Supprimer les tables si besoin de recommencer
DROP TABLE IF EXISTS public.suivi_anomalies CASCADE;
DROP TABLE IF EXISTS public.commandes_cellules CASCADE;

-- Puis ré-exécuter les migrations
```

---

**C'est tout ! Les migrations sont prêtes à être exécutées.** 🚀
