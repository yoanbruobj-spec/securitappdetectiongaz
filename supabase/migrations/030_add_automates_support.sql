-- Migration: Ajout du support pour les automates
-- Description: Modifie la table centrales pour supporter les automates comme type d'équipement

-- Ajouter le champ type_equipement à la table centrales
ALTER TABLE public.centrales
ADD COLUMN IF NOT EXISTS type_equipement text DEFAULT 'centrale' CHECK (type_equipement IN ('centrale', 'automate'));

-- Ajouter le champ marque_personnalisee pour permettre la saisie libre
ALTER TABLE public.centrales
ADD COLUMN IF NOT EXISTS marque_personnalisee text;

-- Créer un index pour améliorer les performances des requêtes filtrées par type
CREATE INDEX IF NOT EXISTS idx_centrales_type_equipement ON public.centrales(type_equipement);

-- Mettre à jour les centrales existantes pour avoir le type 'centrale'
UPDATE public.centrales
SET type_equipement = 'centrale'
WHERE type_equipement IS NULL;

-- Commentaires pour la documentation
COMMENT ON COLUMN public.centrales.type_equipement IS 'Type d''équipement: centrale ou automate';
COMMENT ON COLUMN public.centrales.marque_personnalisee IS 'Marque personnalisée saisie manuellement si non présente dans la liste';
