-- =====================================================
-- Migration 015 - Renommage colonnes étalonnage sensibilité
-- Uniformisation de la nomenclature pour détecteurs fixes et portables
-- =====================================================

-- Renommer les colonnes dans la table detecteurs_gaz
ALTER TABLE public.detecteurs_gaz
  RENAME COLUMN valeur_theorique TO valeur_avant_reglage;

ALTER TABLE public.detecteurs_gaz
  RENAME COLUMN valeur_mesuree TO valeur_apres_reglage;

-- Commentaires sur les nouvelles colonnes
COMMENT ON COLUMN public.detecteurs_gaz.valeur_avant_reglage IS 'Valeur mesurée avant le réglage lors de l''étalonnage sensibilité';
COMMENT ON COLUMN public.detecteurs_gaz.valeur_apres_reglage IS 'Valeur mesurée après le réglage lors de l''étalonnage sensibilité';