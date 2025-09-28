-- Ajouter ou renommer les colonnes de dates pour detecteurs_gaz

-- Ajouter date_remplacement si elle n'existe pas
ALTER TABLE detecteurs_gaz
ADD COLUMN IF NOT EXISTS date_remplacement DATE;

-- Ajouter date_prochain_remplacement si elle n'existe pas
ALTER TABLE detecteurs_gaz
ADD COLUMN IF NOT EXISTS date_prochain_remplacement DATE;

-- Si prochain_remplacement existe, la renommer
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='detecteurs_gaz' AND column_name='prochain_remplacement'
    ) THEN
        ALTER TABLE detecteurs_gaz RENAME COLUMN prochain_remplacement TO date_prochain_remplacement;
    END IF;
END $$;