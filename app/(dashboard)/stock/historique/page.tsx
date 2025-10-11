'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { ArrowLeft, History, TrendingUp, TrendingDown, Filter } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import type { StockMouvement, StockArticle } from '@/types/stock'

export default function HistoriqueStockPage() {
  const router = useRouter()
  const supabase = createClient()

  const [mouvements, setMouvements] = useState<StockMouvement[]>([])
  const [articles, setArticles] = useState<StockArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // Filtres
  const [filterArticle, setFilterArticle] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterPeriode, setFilterPeriode] = useState<string>('all')

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

    setUserId(user.id)

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

    // Charger articles pour filter
    const { data: arts } = await supabase
      .from('stock_articles')
      .select('id, nom, reference')
      .order('nom', { ascending: true })

    if (arts) setArticles(arts)

    // Charger mouvements
    const { data: mouvs } = await supabase
      .from('stock_mouvements')
      .select(`
        *,
        stock_articles (nom, reference),
        profiles (full_name, email, role)
      `)
      .order('date_mouvement', { ascending: false })

    if (mouvs) setMouvements(mouvs)

    setLoading(false)
  }

  // Filtrer mouvements
  const filteredMouvements = mouvements.filter(mouv => {
    // Filter article
    if (filterArticle && mouv.article_id !== filterArticle) return false

    // Filter type
    if (filterType !== 'all' && mouv.type !== filterType) return false

    // Filter période
    if (filterPeriode !== 'all') {
      const mouvDate = new Date(mouv.date_mouvement)
      const now = new Date()

      if (filterPeriode === 'today') {
        if (mouvDate.toDateString() !== now.toDateString()) return false
      } else if (filterPeriode === 'week') {
        const weekAgo = new Date(now)
        weekAgo.setDate(now.getDate() - 7)
        if (mouvDate < weekAgo) return false
      } else if (filterPeriode === 'month') {
        const monthAgo = new Date(now)
        monthAgo.setMonth(now.getMonth() - 1)
        if (mouvDate < monthAgo) return false
      }
    }

    // Si technicien, voir seulement ses mouvements (sauf admin)
    if (userRole === 'technicien' && userId && mouv.utilisateur_id !== userId) return false

    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="space-y-4 w-full max-w-4xl px-8">
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
              onClick={() => router.push('/stock')}
              variant="ghost"
              size="sm"
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Retour
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-600 to-orange-500 shadow-lg shadow-orange-500/20 flex items-center justify-center">
                <History className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-800">Historique des mouvements</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-5xl mx-auto">
          {/* Filtres */}
          <Card variant="glass" padding="md" className="mb-6 bg-white border border-gray-300">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-5 h-5 text-slate-600" />
              <h2 className="font-semibold text-slate-800">Filtres</h2>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Article</label>
                <select
                  value={filterArticle}
                  onChange={(e) => setFilterArticle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                >
                  <option value="">Tous les articles</option>
                  {articles.map(art => (
                    <option key={art.id} value={art.id}>{art.nom}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                >
                  <option value="all">Tous</option>
                  <option value="entree">Entrées</option>
                  <option value="sortie">Sorties</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Période</label>
                <select
                  value={filterPeriode}
                  onChange={(e) => setFilterPeriode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                >
                  <option value="all">Toute la période</option>
                  <option value="today">Aujourd'hui</option>
                  <option value="week">Cette semaine</option>
                  <option value="month">Ce mois</option>
                </select>
              </div>
            </div>
            {(filterArticle || filterType !== 'all' || filterPeriode !== 'all') && (
              <div className="mt-3 flex justify-end">
                <Button
                  onClick={() => {
                    setFilterArticle('')
                    setFilterType('all')
                    setFilterPeriode('all')
                  }}
                  variant="secondary"
                  size="sm"
                >
                  Réinitialiser
                </Button>
              </div>
            )}
          </Card>

          {/* Statistiques */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card variant="glass" padding="md" className="bg-white border border-gray-300">
              <p className="text-sm text-slate-500">Mouvements</p>
              <p className="text-2xl font-bold text-slate-800">{filteredMouvements.length}</p>
            </Card>
            <Card variant="glass" padding="md" className="bg-white border border-gray-300">
              <p className="text-sm text-slate-500">Entrées</p>
              <p className="text-2xl font-bold text-green-600">
                {filteredMouvements.filter(m => m.type === 'entree').length}
              </p>
            </Card>
            <Card variant="glass" padding="md" className="bg-white border border-gray-300">
              <p className="text-sm text-slate-500">Sorties</p>
              <p className="text-2xl font-bold text-red-600">
                {filteredMouvements.filter(m => m.type === 'sortie').length}
              </p>
            </Card>
          </div>

          {/* Liste mouvements */}
          {filteredMouvements.length === 0 ? (
            <div className="text-center py-16">
              <History className="w-16 h-16 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-600 text-lg">Aucun mouvement trouvé</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMouvements.map((mouv, index) => (
                <motion.div
                  key={mouv.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <Card
                    variant="glass"
                    padding="lg"
                    className="bg-white border border-gray-300 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => router.push(`/stock/${mouv.article_id}`)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        mouv.type === 'entree' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {mouv.type === 'entree' ? (
                          <TrendingUp className="w-6 h-6 text-green-600" />
                        ) : (
                          <TrendingDown className="w-6 h-6 text-red-600" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-slate-800">
                              {mouv.type === 'entree' ? 'ENTRÉE' : 'SORTIE'}
                              {' '}
                              {mouv.type === 'entree' ? '+' : '-'}{mouv.quantite} unités
                            </h3>
                            <p className="text-sm text-slate-600">
                              {mouv.stock_articles?.nom} ({mouv.stock_articles?.reference})
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-slate-600">
                              {new Date(mouv.date_mouvement).toLocaleDateString('fr-FR')}
                            </p>
                            <p className="text-xs text-slate-500">
                              {new Date(mouv.date_mouvement).toLocaleTimeString('fr-FR')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <p className="text-slate-600">
                            👤 {mouv.profiles?.full_name}
                          </p>
                          <p className="text-slate-500">
                            Stock: {mouv.quantite_avant} → {mouv.quantite_apres}
                          </p>
                        </div>

                        {mouv.notes && (
                          <p className="text-sm text-slate-600 mt-2 bg-gray-50 p-2 rounded">
                            💬 {mouv.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
