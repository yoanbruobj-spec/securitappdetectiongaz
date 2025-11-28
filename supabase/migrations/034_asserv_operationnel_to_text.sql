-- Migration 034: Convertir asserv_operationnel de BOOLEAN vers TEXT
-- Pour supporter 4 états: operationnel, partiel, non_operationnel, non_teste

-- 1. Modifier la colonne asserv_operationnel dans seuils_alarme
ALTER TABLE public.seuils_alarme
ALTER COLUMN asserv_operationnel TYPE TEXT
USING CASE
  WHEN non_teste = true THEN 'non_teste'
  WHEN asserv_operationnel = true THEN 'operationnel'
  WHEN asserv_operationnel = false THEN 'non_operationnel'
  ELSE 'operationnel'
END;

-- 2. Modifier la colonne asserv_operationnel dans detecteurs_flamme
ALTER TABLE public.detecteurs_flamme
ALTER COLUMN asserv_operationnel TYPE TEXT
USING CASE
  WHEN non_teste = true THEN 'non_teste'
  WHEN asserv_operationnel = true THEN 'operationnel'
  WHEN asserv_operationnel = false THEN 'non_operationnel'
  ELSE 'operationnel'
END;

-- 3. Ajouter une contrainte CHECK pour valider les valeurs
ALTER TABLE public.seuils_alarme
ADD CONSTRAINT seuils_alarme_asserv_operationnel_check
CHECK (asserv_operationnel IN ('operationnel', 'partiel', 'non_operationnel', 'non_teste'));

ALTER TABLE public.detecteurs_flamme
ADD CONSTRAINT detecteurs_flamme_asserv_operationnel_check
CHECK (asserv_operationnel IN ('operationnel', 'partiel', 'non_operationnel', 'non_teste'));

-- 4. Définir une valeur par défaut
ALTER TABLE public.seuils_alarme
ALTER COLUMN asserv_operationnel SET DEFAULT 'operationnel';

ALTER TABLE public.detecteurs_flamme
ALTER COLUMN asserv_operationnel SET DEFAULT 'operationnel';
