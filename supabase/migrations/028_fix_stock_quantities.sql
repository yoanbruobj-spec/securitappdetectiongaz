-- Migration : Correction et synchronisation des quantités
-- Recalcule le champ quantite dans stock_articles en fonction de stock_inventaire

-- Mettre à jour toutes les quantités dans stock_articles
UPDATE public.stock_articles sa
SET quantite = COALESCE(
  (
    SELECT SUM(si.quantite)
    FROM public.stock_inventaire si
    WHERE si.article_id = sa.id
  ),
  0
);

-- Afficher un résumé
DO $$
DECLARE
  total_articles integer;
  articles_avec_stock integer;
  total_stock integer;
BEGIN
  SELECT COUNT(*) INTO total_articles FROM public.stock_articles;
  SELECT COUNT(*) INTO articles_avec_stock FROM public.stock_articles WHERE quantite > 0;
  SELECT SUM(quantite) INTO total_stock FROM public.stock_articles;

  RAISE NOTICE '=== Synchronisation terminée ===';
  RAISE NOTICE 'Total articles: %', total_articles;
  RAISE NOTICE 'Articles avec stock: %', articles_avec_stock;
  RAISE NOTICE 'Stock total: %', COALESCE(total_stock, 0);
END $$;
