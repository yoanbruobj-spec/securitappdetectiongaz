-- Migration pour corriger les permissions RLS sur les tables de stock
-- Fix permissions pour permettre aux utilisateurs authentifiés de gérer le stock

-- Activer RLS sur les tables si pas déjà fait
ALTER TABLE public.stock_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_mouvements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_categories ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Users can view stock articles" ON public.stock_articles;
DROP POLICY IF EXISTS "Admins can manage stock articles" ON public.stock_articles;
DROP POLICY IF EXISTS "Users can update stock articles" ON public.stock_articles;
DROP POLICY IF EXISTS "Users can view stock mouvements" ON public.stock_mouvements;
DROP POLICY IF EXISTS "Users can insert stock mouvements" ON public.stock_mouvements;
DROP POLICY IF EXISTS "Users can view stock categories" ON public.stock_categories;
DROP POLICY IF EXISTS "Admins can manage stock categories" ON public.stock_categories;

-- ============================================
-- POLICIES POUR stock_articles
-- ============================================

-- Tous les utilisateurs authentifiés peuvent voir les articles
CREATE POLICY "Users can view stock articles"
ON public.stock_articles
FOR SELECT
TO authenticated
USING (true);

-- Tous les utilisateurs authentifiés peuvent mettre à jour les articles (quantités)
CREATE POLICY "Users can update stock articles"
ON public.stock_articles
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Seuls les admins peuvent créer des articles
CREATE POLICY "Admins can insert stock articles"
ON public.stock_articles
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Seuls les admins peuvent supprimer des articles
CREATE POLICY "Admins can delete stock articles"
ON public.stock_articles
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ============================================
-- POLICIES POUR stock_mouvements
-- ============================================

-- Tous les utilisateurs authentifiés peuvent voir les mouvements
CREATE POLICY "Users can view stock mouvements"
ON public.stock_mouvements
FOR SELECT
TO authenticated
USING (true);

-- Tous les utilisateurs authentifiés peuvent créer des mouvements
CREATE POLICY "Users can insert stock mouvements"
ON public.stock_mouvements
FOR INSERT
TO authenticated
WITH CHECK (
  utilisateur_id = auth.uid()
);

-- Les admins peuvent supprimer des mouvements
CREATE POLICY "Admins can delete stock mouvements"
ON public.stock_mouvements
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ============================================
-- POLICIES POUR stock_categories
-- ============================================

-- Tous les utilisateurs authentifiés peuvent voir les catégories
CREATE POLICY "Users can view stock categories"
ON public.stock_categories
FOR SELECT
TO authenticated
USING (true);

-- Seuls les admins peuvent gérer les catégories
CREATE POLICY "Admins can manage stock categories"
ON public.stock_categories
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Vérifier que les indexes existent pour les performances
CREATE INDEX IF NOT EXISTS idx_stock_mouvements_article_id ON public.stock_mouvements(article_id);
CREATE INDEX IF NOT EXISTS idx_stock_mouvements_utilisateur_id ON public.stock_mouvements(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_stock_mouvements_date ON public.stock_mouvements(date_mouvement DESC);
CREATE INDEX IF NOT EXISTS idx_stock_articles_categorie_id ON public.stock_articles(categorie_id);
CREATE INDEX IF NOT EXISTS idx_stock_articles_qr_code ON public.stock_articles(qr_code);
