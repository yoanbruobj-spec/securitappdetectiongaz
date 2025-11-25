'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Package,
  Search,
  Plus,
  Camera,
  History,
  Settings,
  AlertTriangle,
  Grid,
  List,
  ArrowLeft,
  CheckCircle2,
  Warehouse,
  MapPin
} from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import type { StockArticle, StockCategorie } from '@/types/stock'

export default function StockInventairePage() {
  const router = useRouter()
  const supabase = createClient()

  const [articles, setArticles] = useState<StockArticle[]>([])
  const [categories, setCategories] = useState<StockCategorie[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [userRole, setUserRole] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showOnlyAlerts, setShowOnlyAlerts] = useState(false)

  useEffect(() => {
    checkAuth()
    loadData()

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

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileData) {
      setUserRole(profileData.role)
      setProfile(profileData)
    }
  }

  async function loadData() {
    setLoading(true)
    await reloadData()
    setLoading(false)
  }

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

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <Sidebar userRole={userRole as any} userName={profile?.full_name} onLogout={handleLogout} />

      <main className="flex-1 pb-24 lg:pb-0">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="px-4 py-4 lg:px-8">
            {/* Title row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push(userRole === 'admin' ? '/admin' : '/technicien')}
                  className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100"
                >
                  <ArrowLeft className="w-5 h-5 text-slate-600" />
                </button>
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold text-slate-900">Stock</h1>
                  <p className="text-sm text-slate-500 hidden lg:block">Gestion de l'inventaire</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push('/stock/scanner')}
                  className="h-10 px-3 lg:px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium flex items-center gap-2 transition-colors"
                >
                  <Camera className="w-5 h-5" />
                  <span className="hidden lg:inline">Scanner</span>
                </button>
                {userRole === 'admin' && (
                  <button
                    onClick={() => router.push('/stock/nouveau')}
                    className="h-10 px-3 lg:px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="hidden lg:inline">Nouveau</span>
                  </button>
                )}
              </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-3 gap-2 lg:gap-3 mb-4">
              <div className="bg-blue-50 rounded-xl p-3 lg:p-4 border border-blue-100">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="w-4 h-4 text-blue-500" />
                  <span className="text-xs text-blue-600 font-medium">Articles</span>
                </div>
                <p className="text-xl lg:text-2xl font-bold text-blue-900">{totalArticles}</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3 lg:p-4 border border-emerald-100">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs text-emerald-600 font-medium">Total</span>
                </div>
                <p className="text-xl lg:text-2xl font-bold text-emerald-900">{totalQuantite}</p>
              </div>
              <button
                onClick={() => setShowOnlyAlerts(!showOnlyAlerts)}
                className={cn(
                  'rounded-xl p-3 lg:p-4 border text-left transition-all',
                  showOnlyAlerts
                    ? 'bg-red-100 border-red-300 ring-2 ring-red-400'
                    : articlesEnAlerte > 0
                    ? 'bg-red-50 border-red-100 hover:border-red-200'
                    : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className={cn(
                    'w-4 h-4',
                    articlesEnAlerte > 0 ? 'text-red-500' : 'text-slate-400'
                  )} />
                  <span className={cn(
                    'text-xs font-medium',
                    articlesEnAlerte > 0 ? 'text-red-600' : 'text-slate-500'
                  )}>
                    Alertes {showOnlyAlerts && '✓'}
                  </span>
                </div>
                <p className={cn(
                  'text-xl lg:text-2xl font-bold',
                  articlesEnAlerte > 0 ? 'text-red-900' : 'text-slate-700'
                )}>
                  {articlesEnAlerte}
                </p>
              </button>
            </div>

            {/* Search and filters */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher un article..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="flex-1 sm:flex-none h-11 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">Toutes catégories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nom}</option>
                  ))}
                </select>
                <div className="flex bg-slate-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      'p-2 rounded-md transition-colors',
                      viewMode === 'list'
                        ? 'bg-white text-emerald-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    )}
                  >
                    <List className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      'p-2 rounded-md transition-colors',
                      viewMode === 'grid'
                        ? 'bg-white text-emerald-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    )}
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick actions mobile */}
          <div className="px-4 pb-3 flex gap-2 overflow-x-auto lg:hidden">
            <button
              onClick={() => router.push('/stock/historique')}
              className="flex items-center gap-2 h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 whitespace-nowrap hover:bg-slate-50"
            >
              <History className="w-4 h-4" />
              Historique
            </button>
            {userRole === 'admin' && (
              <>
                <button
                  onClick={() => router.push('/stock/categories')}
                  className="flex items-center gap-2 h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 whitespace-nowrap hover:bg-slate-50"
                >
                  <Settings className="w-4 h-4" />
                  Catégories
                </button>
                <button
                  onClick={() => router.push('/stock/emplacements')}
                  className="flex items-center gap-2 h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 whitespace-nowrap hover:bg-slate-50"
                >
                  <Warehouse className="w-4 h-4" />
                  Emplacements
                </button>
              </>
            )}
          </div>
        </header>

        <div className="px-4 py-4 lg:px-8 lg:py-6">
          {/* Alert filter indicator */}
          {showOnlyAlerts && (
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-full text-sm font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                Alertes uniquement
                <button onClick={() => setShowOnlyAlerts(false)} className="hover:bg-red-100 rounded-full p-0.5 ml-1">
                  ✕
                </button>
              </span>
            </div>
          )}

          {/* Empty state */}
          {filteredArticles.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <div className={cn(
                'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4',
                showOnlyAlerts ? 'bg-emerald-50' : 'bg-slate-100'
              )}>
                {showOnlyAlerts
                  ? <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  : <Package className="w-8 h-8 text-slate-400" />
                }
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {showOnlyAlerts
                  ? 'Aucune alerte'
                  : searchTerm || selectedCategory !== 'all'
                  ? 'Aucun résultat'
                  : 'Aucun article'}
              </h3>
              <p className="text-slate-500 mb-6">
                {showOnlyAlerts
                  ? 'Tous vos articles ont un stock suffisant'
                  : searchTerm || selectedCategory !== 'all'
                  ? 'Aucun article ne correspond à votre recherche'
                  : 'Commencez par ajouter des articles à votre inventaire'}
              </p>
              {userRole === 'admin' && !searchTerm && selectedCategory === 'all' && !showOnlyAlerts && (
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => router.push('/stock/categories')}
                    className="h-10 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Gérer les catégories
                  </button>
                  <button
                    onClick={() => router.push('/stock/nouveau')}
                    className="h-10 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Créer un article
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* List view */}
              {viewMode === 'list' && (
                <div className="space-y-6">
                  {Object.entries(articlesByCategory).map(([categoryName, categoryArticles]) => (
                    <div key={categoryName}>
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-semibold text-slate-900">{categoryName}</h2>
                        <span className="text-xs text-slate-500">
                          {categoryArticles.reduce((sum, a) => sum + a.quantite, 0)} unités
                        </span>
                      </div>
                      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="divide-y divide-slate-100">
                          {categoryArticles.map((article) => (
                            <button
                              key={article.id}
                              onClick={() => router.push(`/stock/${article.id}`)}
                              className="w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                            >
                              {article.photo_url ? (
                                <div className="w-14 h-14 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0 bg-slate-50">
                                  <img
                                    src={article.photo_url}
                                    alt={article.nom}
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                              ) : (
                                <div className="w-14 h-14 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Package className="w-6 h-6 text-slate-400" />
                                </div>
                              )}

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="font-medium text-slate-900 truncate">
                                      {article.nom}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                      Réf: {article.reference}
                                    </p>
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <p className="text-xl font-bold text-slate-900">{article.quantite}</p>
                                    <p className="text-[10px] text-slate-400">unités</p>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                  {article.emplacement && (
                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {article.emplacement}
                                    </span>
                                  )}
                                  <Badge
                                    variant={article.quantite <= article.seuil_alerte ? 'danger' : 'success'}
                                    size="sm"
                                  >
                                    {article.quantite <= article.seuil_alerte ? 'Alerte' : 'OK'}
                                  </Badge>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Grid view */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
                  {filteredArticles.map((article) => (
                    <button
                      key={article.id}
                      onClick={() => router.push(`/stock/${article.id}`)}
                      className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 hover:shadow-sm transition-all text-left"
                    >
                      {article.photo_url ? (
                        <div className="w-full h-24 lg:h-32 rounded-lg overflow-hidden border border-slate-200 mb-3 bg-slate-50">
                          <img
                            src={article.photo_url}
                            alt={article.nom}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-24 lg:h-32 bg-slate-100 rounded-lg flex items-center justify-center mb-3">
                          <Package className="w-10 h-10 text-slate-300" />
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Badge
                          variant={article.quantite <= article.seuil_alerte ? 'danger' : 'success'}
                          size="sm"
                        >
                          {article.quantite <= article.seuil_alerte ? 'Alerte' : 'OK'}
                        </Badge>
                      </div>

                      <h3 className="font-medium text-sm text-slate-900 truncate mb-1">
                        {article.nom}
                      </h3>
                      <p className="text-xs text-slate-500 mb-3">Réf: {article.reference}</p>

                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-2xl font-bold text-slate-900">{article.quantite}</p>
                          <p className="text-xs text-slate-400">unités</p>
                        </div>
                        {article.emplacement && (
                          <span className="text-xs text-slate-400 truncate max-w-[80px] flex items-center gap-1">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            {article.emplacement}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Desktop quick actions */}
        <div className="hidden lg:flex items-center justify-center gap-3 p-4 bg-white border-t border-slate-200">
          <button
            onClick={() => router.push('/stock/historique')}
            className="h-10 px-4 bg-white border border-slate-200 text-slate-600 rounded-lg font-medium flex items-center gap-2 hover:bg-slate-50 transition-colors"
          >
            <History className="w-4 h-4" />
            Historique
          </button>
          {userRole === 'admin' && (
            <>
              <button
                onClick={() => router.push('/stock/categories')}
                className="h-10 px-4 bg-white border border-slate-200 text-slate-600 rounded-lg font-medium flex items-center gap-2 hover:bg-slate-50 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Catégories
              </button>
              <button
                onClick={() => router.push('/stock/emplacements')}
                className="h-10 px-4 bg-white border border-slate-200 text-slate-600 rounded-lg font-medium flex items-center gap-2 hover:bg-slate-50 transition-colors"
              >
                <Warehouse className="w-4 h-4" />
                Emplacements
              </button>
            </>
          )}
        </div>
      </main>

      <BottomNav userRole={userRole as any} />
    </div>
  )
}
