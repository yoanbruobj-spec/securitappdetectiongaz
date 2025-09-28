-- Ajouter une colonne notes pour les informations complémentaires
ALTER TABLE public.interventions 
ADD COLUMN IF NOT EXISTS notes TEXT;