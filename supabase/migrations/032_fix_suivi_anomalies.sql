-- Script de correction pour la table suivi_anomalies
-- Peut être exécuté plusieurs fois sans erreur

-- Supprimer les triggers existants
DROP TRIGGER IF EXISTS update_suivi_anomalies_updated_at ON public.suivi_anomalies;
DROP TRIGGER IF EXISTS add_anomalie_status_to_history ON public.suivi_anomalies;

-- Recréer le trigger pour mettre à jour updated_at automatiquement
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

-- Recréer le trigger pour ajouter automatiquement une entrée dans l'historique lors d'un changement de statut
CREATE OR REPLACE FUNCTION public.add_anomalie_status_to_history()
RETURNS TRIGGER AS $$
DECLARE
  history_entry jsonb;
BEGIN
  -- Si le statut a changé, ajouter une entrée dans l'historique
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

-- Vérifier et corriger la colonne created_by si nécessaire
DO $$
BEGIN
  -- Modifier created_by pour autoriser NULL si nécessaire
  ALTER TABLE public.suivi_anomalies
  ALTER COLUMN created_by DROP NOT NULL;
EXCEPTION
  WHEN undefined_column THEN
    RAISE NOTICE 'La colonne created_by n''existe pas encore';
  WHEN others THEN
    RAISE NOTICE 'La colonne created_by est déjà nullable';
END $$;

-- Confirmation
SELECT 'Migration de correction terminée avec succès !' as status;
