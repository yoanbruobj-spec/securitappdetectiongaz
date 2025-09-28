-- Ajouter les colonnes pour les seuils d'alarme dans portables_gaz
ALTER TABLE public.portables_gaz
ADD COLUMN IF NOT EXISTS seuil_1 TEXT,
ADD COLUMN IF NOT EXISTS seuil_2 TEXT,
ADD COLUMN IF NOT EXISTS seuil_3 TEXT,
ADD COLUMN IF NOT EXISTS vme TEXT,
ADD COLUMN IF NOT EXISTS vle TEXT;

-- Commentaires
COMMENT ON COLUMN public.portables_gaz.seuil_1 IS 'Seuil d''alarme 1 (valeur libre)';
COMMENT ON COLUMN public.portables_gaz.seuil_2 IS 'Seuil d''alarme 2 (valeur libre)';
COMMENT ON COLUMN public.portables_gaz.seuil_3 IS 'Seuil d''alarme 3 (valeur libre)';
COMMENT ON COLUMN public.portables_gaz.vme IS 'Valeur Moyenne d''Exposition (valeur libre)';
COMMENT ON COLUMN public.portables_gaz.vle IS 'Valeur Limite d''Exposition (valeur libre)';