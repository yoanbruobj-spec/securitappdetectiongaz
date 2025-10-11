'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus, Package, QrCode, History, Search, Settings, BarChart3, AlertTriangle, Camera } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import type { StockArticle, StockCategorie } from '@/types/stock'

export default function StockInventairePage() {
  const router = useRouter()
  const supabase = createClient()

  const [articles, setArticles] = useState<StockArticle[]>([])
  const [categories, setCategories] = useState<StockCategorie[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
    loadData()
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

    // Charger catégories
    const { data: cats } = await supabase
      .from('stock_categories')
      .select('*')
      .order('ordre', { ascending: true })

    if (cats) setCategories(cats)

    // Charger articles avec catégories
    const { data: arts } = await supabase
      .from('stock_articles')
      .select(`
        *,
        stock_categories (*)
      `)
      .order('nom', { ascending: true })

    if (arts) setArticles(arts)

    setLoading(false)
  }

  const filteredArticles = articles.filter(article =>
    article.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (article.emplacement && article.emplacement.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Grouper par catégorie
  const articlesByCategory = filteredArticles.reduce<Record<string, StockArticle[]>>((acc, article) => {
    const catName = article.stock_categories?.nom || 'Sans catégorie'
    if (!acc[catName]) acc[catName] = []
    acc[catName].push(article)
    return acc
  }, {})

  // Stats
  const totalArticles = articles.length
  const totalQuantite = articles.reduce((sum, a) => sum + a.quantite, 0)
  const articlesEnAlerte = articles.filter(a => a.quantite <= a.seuil_alerte).length

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="space-y-4 w-full max-w-6xl px-8">
          {[1, 2, 3].map(i => (
            <Card key={i} variant="glass" padding="lg">
              <Skeleton height="100px" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-300 shadow-sm sticky top-0 z-50">
        <div className="px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push('/admin')}
              variant="ghost"
              size="sm"
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Retour
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-purple-500 shadow-lg shadow-purple-500/20 flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Inventaire Stock</h1>
                <p className="text-sm text-slate-600">Gérez vos articles avec QR codes</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => router.push('/stock/scanner')}
              variant="primary"
              icon={<Camera className="w-5 h-5" />}
              className="shadow-lg shadow-blue-500/30"
            >
              Scanner QR
            </Button>
            <Button
              onClick={() => router.push('/stock/historique')}
              variant="secondary"
              icon={<History className="w-5 h-5" />}
            >
              Historique
            </Button>
            {userRole === 'admin' && (
              <>
                <Button
                  onClick={() => router.push('/stock/categories')}
                  variant="secondary"
                  icon={<Settings className="w-5 h-5" />}
                >
                  Catégories
                </Button>
                <Button
                  onClick={() => router.push('/stock/nouveau')}
                  variant="primary"
                  icon={<Plus className="w-5 h-5" />}
                >
                  Nouvel article
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-8 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card variant="glass" padding="md" className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium mb-1">Articles</p>
                <p className="text-3xl font-bold text-blue-900">{totalArticles}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
          <Card variant="glass" padding="md" className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium mb-1">Quantité totale</p>
                <p className="text-3xl font-bold text-green-900">{totalQuantite}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
          <Card variant="glass" padding="md" className={`bg-gradient-to-br ${articlesEnAlerte > 0 ? 'from-red-50 to-red-100 border-red-200' : 'from-gray-50 to-gray-100 border-gray-200'} border hover:shadow-lg transition-shadow ${articlesEnAlerte > 0 ? 'animate-pulse' : ''}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium mb-1 ${articlesEnAlerte > 0 ? 'text-red-700' : 'text-gray-600'}`}>En alerte</p>
                <p className={`text-3xl font-bold ${articlesEnAlerte > 0 ? 'text-red-900' : 'text-gray-700'}`}>{articlesEnAlerte}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${articlesEnAlerte > 0 ? 'bg-red-500' : 'bg-gray-400'}`}>
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        </div>

        {/* Recherche */}
        <Card variant="glass" padding="md" className="mb-6 bg-white border border-gray-300">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un article..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </Card>

        {/* Articles par catégorie */}
        {Object.keys(articlesByCategory).length === 0 ? (
          <div className="flex items-center justify-center min-h-[500px]">
            <Card variant="glass" padding="lg" className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 max-w-5xl w-full">
              <div className="text-center py-8 px-4">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <Package className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3">Aucun article en stock</h3>
                <p className="text-slate-600 mb-10 max-w-md mx-auto">
                  Commencez à gérer votre inventaire en suivant ces étapes simples
                </p>

                {userRole === 'admin' ? (
                  <div className="w-full">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 max-w-4xl mx-auto">
                      <div className="bg-white rounded-lg p-6 border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4 mx-auto">
                          <span className="text-2xl font-bold text-purple-600">1</span>
                        </div>
                        <h4 className="font-semibold text-slate-800 mb-2 text-lg">Créer des catégories</h4>
                        <p className="text-sm text-slate-600 mb-4">Organisez vos articles (Cellules, Détecteurs, etc.)</p>
                        <Button
                          onClick={() => router.push('/stock/categories')}
                          variant="secondary"
                          size="sm"
                          className="w-full"
                          icon={<Settings className="w-4 h-4" />}
                        >
                          Catégories
                        </Button>
                      </div>

                      <div className="bg-white rounded-lg p-6 border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4 mx-auto">
                          <span className="text-2xl font-bold text-blue-600">2</span>
                        </div>
                        <h4 className="font-semibold text-slate-800 mb-2 text-lg">Ajouter des articles</h4>
                        <p className="text-sm text-slate-600 mb-4">Renseignez vos références et QR codes</p>
                        <Button
                          onClick={() => router.push('/stock/nouveau')}
                          variant="primary"
                          size="sm"
                          className="w-full"
                          icon={<Plus className="w-4 h-4" />}
                        >
                          Nouvel article
                        </Button>
                      </div>

                      <div className="bg-white rounded-lg p-6 border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mb-4 mx-auto">
                          <span className="text-2xl font-bold text-green-600">3</span>
                        </div>
                        <h4 className="font-semibold text-slate-800 mb-2 text-lg">Scanner & Gérer</h4>
                        <p className="text-sm text-slate-600 mb-4">Utilisez le scanner QR pour les mouvements</p>
                        <Button
                          onClick={() => router.push('/stock/scanner')}
                          variant="secondary"
                          size="sm"
                          className="w-full"
                          icon={<Camera className="w-4 h-4" />}
                        >
                          Scanner
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <Button
                        onClick={() => router.push('/stock/nouveau')}
                        variant="primary"
                        className="shadow-lg"
                        icon={<Plus className="w-5 h-5" />}
                      >
                        Créer le premier article
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg p-6 max-w-md mx-auto border border-slate-200">
                    <p className="text-slate-600 mb-4">
                      Aucun article n'est disponible pour le moment.
                    </p>
                    <p className="text-sm text-slate-500">
                      Contactez un administrateur pour ajouter des articles au stock.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(articlesByCategory).map(([categoryName, categoryArticles]) => (
              <div key={categoryName}>
                <h2 className="text-lg font-semibold text-slate-800 mb-3">
                  {categoryName} ({categoryArticles.reduce((sum, a) => sum + a.quantite, 0)} unités)
                </h2>
                <div className="space-y-3">
                  {categoryArticles.map((article, index) => (
                    <motion.div
                      key={article.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card
                        variant="glass"
                        padding="lg"
                        hover
                        className="cursor-pointer bg-white border border-gray-300"
                        onClick={() => router.push(`/stock/${article.id}`)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-slate-800">{article.nom}</h3>
                            <p className="text-sm text-slate-600">Réf: {article.reference}</p>
                            {article.emplacement && (
                              <p className="text-sm text-slate-500">📍 {article.emplacement}</p>
                            )}
                            {article.numeros_serie && (
                              <p className="text-xs text-slate-400 mt-1">N° série: {article.numeros_serie.substring(0, 50)}{article.numeros_serie.length > 50 ? '...' : ''}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-2xl font-bold text-slate-800">{article.quantite}</p>
                              <p className="text-xs text-slate-500">unités</p>
                            </div>
                            {article.quantite <= article.seuil_alerte && (
                              <Badge variant="danger">Alerte</Badge>
                            )}
                            {article.quantite > article.seuil_alerte && (
                              <Badge variant="success">OK</Badge>
                            )}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
