-- Fix foreign key de stock_mouvements pour pointer vers profiles au lieu de auth.users
-- Cela permettra de faire des JOINs corrects avec les profils utilisateurs

-- Supprimer l'ancienne foreign key
ALTER TABLE public.stock_mouvements
DROP CONSTRAINT IF EXISTS stock_mouvements_utilisateur_id_fkey;

-- Ajouter la nouvelle foreign key vers profiles
ALTER TABLE public.stock_mouvements
ADD CONSTRAINT stock_mouvements_utilisateur_id_fkey
FOREIGN KEY (utilisateur_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- Ajouter un index pour améliorer les performances des JOINs
CREATE INDEX IF NOT EXISTS idx_stock_mouvements_utilisateur
ON public.stock_mouvements(utilisateur_id);
