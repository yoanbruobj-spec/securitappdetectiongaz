-- Migration : Catégories par défaut pour le stock

-- Insérer quelques catégories par défaut
INSERT INTO public.stock_categories (nom, icone, ordre) VALUES
('Cellules détecteurs', '🔋', 1),
('Détecteurs portables', '📱', 2),
('Électronique', '🔌', 3),
('Gaz étalonnage', '🧪', 4),
('Pièces détachées', '🔧', 5),
('Consommables', '📦', 6)
ON CONFLICT DO NOTHING;
