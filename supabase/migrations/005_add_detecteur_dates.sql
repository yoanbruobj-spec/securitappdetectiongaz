-- Add date_remplacement and prochain_remplacement columns to detecteurs_gaz only

ALTER TABLE detecteurs_gaz 
ADD COLUMN IF NOT EXISTS date_remplacement DATE,
ADD COLUMN IF NOT EXISTS prochain_remplacement DATE;