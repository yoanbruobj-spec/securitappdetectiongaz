-- Ajouter la colonne operationnel à la table seuils_alarme

ALTER TABLE seuils_alarme
ADD COLUMN IF NOT EXISTS operationnel boolean DEFAULT true;