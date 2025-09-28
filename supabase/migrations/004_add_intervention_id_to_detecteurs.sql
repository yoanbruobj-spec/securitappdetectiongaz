-- Ajouter intervention_id aux détecteurs pour simplifier les requêtes
ALTER TABLE public.detecteurs_gaz
ADD COLUMN IF NOT EXISTS intervention_id UUID REFERENCES public.interventions(id) ON DELETE CASCADE;

ALTER TABLE public.detecteurs_flamme
ADD COLUMN IF NOT EXISTS intervention_id UUID REFERENCES public.interventions(id) ON DELETE CASCADE;

-- Créer des index
CREATE INDEX IF NOT EXISTS idx_detecteurs_gaz_intervention ON public.detecteurs_gaz(intervention_id);
CREATE INDEX IF NOT EXISTS idx_detecteurs_flamme_intervention ON public.detecteurs_flamme(intervention_id);

-- Rendre centrale_id optionnel
ALTER TABLE public.detecteurs_gaz
ALTER COLUMN centrale_id DROP NOT NULL;

ALTER TABLE public.detecteurs_flamme
ALTER COLUMN centrale_id DROP NOT NULL;