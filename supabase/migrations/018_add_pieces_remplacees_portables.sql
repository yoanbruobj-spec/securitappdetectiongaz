-- Ajouter la colonne pieces_remplacees dans portables
ALTER TABLE public.portables
ADD COLUMN IF NOT EXISTS pieces_remplacees TEXT;

-- Commentaire
COMMENT ON COLUMN public.portables.pieces_remplacees IS 'Liste des pièces remplacées lors de l''intervention';