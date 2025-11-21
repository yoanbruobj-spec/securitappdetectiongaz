'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Package, Search, Plus, Camera, History, Settings, AlertTriangle, Grid, List, ChevronRight, ArrowLeft, CheckCircle2, Warehouse } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { StockArticle, StockCategorie } from '@/types/stock'

export default function StockInventairePage() {
  const router = useRouter()
  const supabase = createClient()

  const [articles, setArticles] = useState<StockArticle[]>([])
  const [categories, setCategories] = useState<StockCategorie[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [userRole, setUserRole] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showOnlyAlerts, setShowOnlyAlerts] = useState(false)

  useEffect(() => {
    checkAuth()
    loadData()

    // Recharger les données quand la page redevient visible (sans écran de chargement)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        reloadData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile) {
      setUserRole(profile.role)
    }
  }

  async function loadData() {
    setLoading(true)
    await reloadData()
    setLoading(false)
  }

  // Recharge les données sans afficher l'écran de chargement
  async function reloadData() {
    const { data: cats } = await supabase
      .from('stock_categories')
      .select('*')
      .order('ordre', { ascending: true })

    if (cats) setCategories(cats)

    const { data: arts } = await supabase
      .from('stock_articles')
      .select(`
        *,
        stock_categories (*)
      `)
      .order('nom', { ascending: true })

    if (arts) setArticles(arts)
  }

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (article.emplacement && article.emplacement.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesCategory = selectedCategory === 'all' || article.categorie_id === selectedCategory

    const matchesAlertFilter = !showOnlyAlerts || (article.quantite <= article.seuil_alerte)

    return matchesSearch && matchesCategory && matchesAlertFilter
  })

  const articlesByCategory = filteredArticles.reduce<Record<string, StockArticle[]>>((acc, article) => {
    const catName = article.stock_categories?.nom || 'Sans catégorie'
    if (!acc[catName]) acc[catName] = []
    acc[catName].push(article)
    return acc
  }, {})

  const totalArticles = articles.length
  const totalQuantite = articles.reduce((sum, a) => sum + a.quantite, 0)
  const articlesEnAlerte = articles.filter(a => a.quantite <= a.seuil_alerte).length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-gray-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex flex-col">
      {/* Header glassmorphism */}
      <header className="bg-gradient-to-r from-white/80 via-white/60 to-white/80 backdrop-blur-2xl border-b border-gray-200/50 sticky top-0 z-50 shadow-xl">
        <div className="px-4 lg:px-6 py-3 lg:py-4">
          <div className="flex items-center justify-between mb-3 lg:mb-4">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => {
                  if (userRole === 'admin') {
                    router.push('/admin')
                  } else if (userRole === 'technicien') {
                    router.push('/technicien')
                  } else {
                    router.back()
                  }
                }}
                variant="ghost"
                size="sm"
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                <span className="hidden sm:inline">Retour</span>
              </Button>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/50">
                <Package className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-lg lg:text-xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                  Inventaire
                </h1>
                <p className="text-xs text-slate-600 hidden lg:block">Gérez votre stock avec QR codes</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => router.push('/stock/scanner')}
                variant="primary"
                size="sm"
                icon={<Camera className="w-4 h-4 lg:w-5 lg:h-5" />}
              >
                <span className="hidden lg:inline">Scanner</span>
              </Button>
              {userRole === 'admin' && (
                <Button
                  onClick={() => router.push('/stock/nouveau')}
                  variant="secondary"
                  size="sm"
                  icon={<Plus className="w-4 h-4 lg:w-5 lg:h-5" />}
                >
                  <span className="hidden lg:inline">Nouveau</span>
                </Button>
              )}
            </div>
          </div>

          {/* Stats mini - version mobile optimisée */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-2 lg:p-3 border border-blue-200">
              <div className="text-xs lg:text-sm text-blue-700 mb-0.5 lg:mb-1">Articles</div>
              <div className="text-lg lg:text-2xl font-bold text-blue-900">{totalArticles}</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-2 lg:p-3 border border-emerald-200">
              <div className="text-xs lg:text-sm text-emerald-700 mb-0.5 lg:mb-1">Stock total</div>
              <div className="text-lg lg:text-2xl font-bold text-emerald-900">{totalQuantite}</div>
            </div>
            <button
              onClick={() => setShowOnlyAlerts(!showOnlyAlerts)}
              className={`bg-gradient-to-br rounded-lg p-2 lg:p-3 border transition-all hover:shadow-md ${
                showOnlyAlerts
                  ? 'from-red-100 to-red-200 border-red-300 ring-2 ring-red-400'
                  : articlesEnAlerte > 0
                  ? 'from-red-50 to-red-100 border-red-200 hover:border-red-300'
                  : 'from-gray-50 to-gray-100 border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`text-xs lg:text-sm mb-0.5 lg:mb-1 flex items-center justify-between ${
                showOnlyAlerts ? 'text-red-800' : articlesEnAlerte > 0 ? 'text-red-700' : 'text-gray-600'
              }`}>
                <span>Alertes</span>
                {showOnlyAlerts && (
                  <span className="text-xs">✓</span>
                )}
              </div>
              <div className={`text-lg lg:text-2xl font-bold ${
                showOnlyAlerts ? 'text-red-900' : articlesEnAlerte > 0 ? 'text-red-900' : 'text-gray-700'
              }`}>
                {articlesEnAlerte}
              </div>
            </button>
          </div>

          {/* Barre de recherche et filtres */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500"
              />
              {showOnlyAlerts && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Alertes uniquement
                  </span>
                  <button
                    onClick={() => setShowOnlyAlerts(false)}
                    className="text-gray-400 hover:text-gray-600 transition"
                    title="Réinitialiser le filtre"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="flex-1 sm:flex-none px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500"
              >
                <option value="all">Toutes catégories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nom}</option>
                ))}
              </select>
              <div className="flex gap-1 p-0.5 bg-gray-100 rounded-lg">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition ${
                    viewMode === 'list' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition ${
                    viewMode === 'grid' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions mobile */}
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto lg:hidden">
          <button
            onClick={() => router.push('/stock/historique')}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs whitespace-nowrap"
          >
            <History className="w-3.5 h-3.5" />
            Historique
          </button>
          {userRole === 'admin' && (
            <>
              <button
                onClick={() => router.push('/stock/categories')}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs whitespace-nowrap"
              >
                <Settings className="w-3.5 h-3.5" />
                Catégories
              </button>
              <button
                onClick={() => router.push('/stock/emplacements')}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs whitespace-nowrap"
              >
                <Warehouse className="w-3.5 h-3.5" />
                Emplacements
              </button>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4 lg:p-6">
        {/* État vide */}
        {filteredArticles.length === 0 ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center bg-white rounded-xl p-8 shadow-sm max-w-md">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                showOnlyAlerts ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' : 'bg-gradient-to-br from-emerald-500 to-cyan-500'
              }`}>
                {showOnlyAlerts ? <CheckCircle2 className="w-8 h-8 text-white" /> : <Package className="w-8 h-8 text-white" />}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {showOnlyAlerts
                  ? 'Aucune alerte !'
                  : searchTerm || selectedCategory !== 'all'
                  ? 'Aucun résultat'
                  : 'Aucun article'}
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                {showOnlyAlerts
                  ? 'Tous vos articles ont un stock suffisant'
                  : searchTerm || selectedCategory !== 'all'
                  ? 'Aucun article ne correspond à votre recherche'
                  : 'Commencez par ajouter des articles à votre inventaire'
                }
              </p>
              {userRole === 'admin' && !searchTerm && selectedCategory === 'all' && (
                <div className="space-y-3">
                  <button
                    onClick={() => router.push('/stock/categories')}
                    className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition text-sm flex items-center justify-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Gérer les catégories
                  </button>
                  <button
                    onClick={() => router.push('/stock/nouveau')}
                    className="w-full px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white rounded-lg transition text-sm flex items-center justify-center gap-2 shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    Créer un article
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Vue liste */}
            {viewMode === 'list' && (
              <div className="space-y-4 lg:space-y-6">
                {Object.entries(articlesByCategory).map(([categoryName, categoryArticles]) => (
                  <div key={categoryName}>
                    <div className="flex items-center justify-between mb-2 lg:mb-3">
                      <h2 className="text-sm lg:text-base font-bold text-gray-900">
                        {categoryName}
                      </h2>
                      <span className="text-xs text-gray-500">
                        {categoryArticles.reduce((sum, a) => sum + a.quantite, 0)} unités
                      </span>
                    </div>
                    <div className="space-y-2">
                      {categoryArticles.map((article, index) => (
                        <motion.div
                          key={article.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          onClick={() => router.push(`/stock/${article.id}`)}
                          className="bg-white rounded-lg p-3 lg:p-4 border border-gray-200 hover:border-emerald-200 hover:shadow-md cursor-pointer transition group"
                        >
                          <div className="flex justify-between items-start gap-3">
                            {/* Image de l'article */}
                            {article.photo_url && (
                              <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-lg overflow-hidden border-2 border-gray-200 flex-shrink-0 bg-gray-50 flex items-center justify-center">
                                <img
                                  src={article.photo_url}
                                  alt={article.nom}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm lg:text-base text-gray-900 mb-0.5 truncate group-hover:text-emerald-600 transition">
                                {article.nom}
                              </h3>
                              <p className="text-xs text-gray-500 mb-1">
                                Réf: {article.reference}
                              </p>
                              {article.emplacement && (
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                  <span>📍</span>
                                  {article.emplacement}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1.5">
                              <div className="text-right">
                                <div className="text-xl lg:text-2xl font-bold text-gray-900">
                                  {article.quantite}
                                </div>
                                <div className="text-[10px] lg:text-xs text-gray-500">unités</div>
                              </div>
                              {article.quantite <= article.seuil_alerte ? (
                                <Badge variant="danger" size="sm">Alerte</Badge>
                              ) : (
                                <Badge variant="success" size="sm">OK</Badge>
                              )}
                            </div>
                          </div>
                          {article.numeros_serie && (
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <p className="text-[10px] lg:text-xs text-gray-400 truncate">
                                N° série: {article.numeros_serie.substring(0, 40)}
                                {article.numeros_serie.length > 40 ? '...' : ''}
                              </p>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Vue grille */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                {filteredArticles.map((article, index) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => router.push(`/stock/${article.id}`)}
                    className="bg-white rounded-lg p-4 border border-gray-200 hover:border-emerald-200 hover:shadow-lg cursor-pointer transition group"
                  >
                    {/* Image de l'article */}
                    {article.photo_url && (
                      <div className="w-full h-32 rounded-lg overflow-hidden border-2 border-gray-200 mb-3 bg-gray-50 flex items-center justify-center">
                        <img
                          src={article.photo_url}
                          alt={article.nom}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}

                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-100 to-cyan-100 flex items-center justify-center">
                        <Package className="w-5 h-5 text-emerald-600" />
                      </div>
                      {article.quantite <= article.seuil_alerte ? (
                        <Badge variant="danger" size="sm">
                          <AlertTriangle className="w-3 h-3" />
                        </Badge>
                      ) : (
                        <Badge variant="success" size="sm">OK</Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-sm mb-1 truncate group-hover:text-emerald-600 transition">
                      {article.nom}
                    </h3>
                    <p className="text-xs text-gray-500 mb-3">Réf: {article.reference}</p>
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-2xl font-bold text-gray-900">{article.quantite}</div>
                        <div className="text-xs text-gray-500">unités</div>
                      </div>
                      {article.emplacement && (
                        <div className="text-xs text-gray-400 truncate max-w-[100px]">
                          📍 {article.emplacement}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Actions rapides desktop */}
      <div className="hidden lg:flex items-center justify-center gap-3 p-4 bg-white border-t border-gray-200">
        <button
          onClick={() => router.push('/stock/historique')}
          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm flex items-center gap-2"
        >
          <History className="w-4 h-4" />
          Historique
        </button>
        {userRole === 'admin' && (
          <>
            <button
              onClick={() => router.push('/stock/categories')}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Catégories
            </button>
            <button
              onClick={() => router.push('/stock/emplacements')}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm flex items-center gap-2"
            >
              <Warehouse className="w-4 h-4" />
              Emplacements
            </button>
          </>
        )}
      </div>
    </div>
  )
}
