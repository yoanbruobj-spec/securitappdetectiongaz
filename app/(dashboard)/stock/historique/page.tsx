'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, History, TrendingUp, TrendingDown, Filter, ArrowRightLeft, X } from 'lucide-react'
import { cn } from '@/lib/utils'
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
  const [showFilters, setShowFilters] = useState(false)

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

    const { data: arts } = await supabase
      .from('stock_articles')
      .select('id, nom, reference')
      .order('nom', { ascending: true })

    if (arts) setArticles(arts)

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
    if (filterArticle && mouv.article_id !== filterArticle) return false
    if (filterType !== 'all' && mouv.type !== filterType) return false

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

    if (userRole === 'technicien' && userId && mouv.utilisateur_id !== userId) return false

    return true
  })

  const hasActiveFilters = filterArticle || filterType !== 'all' || filterPeriode !== 'all'

  function resetFilters() {
    setFilterArticle('')
    setFilterType('all')
    setFilterPeriode('all')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-4 py-4 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/stock')}
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                  <History className="w-5 h-5 text-amber-500" />
                </div>
                <h1 className="text-lg lg:text-xl font-bold text-slate-900">Historique</h1>
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'h-10 px-3 lg:px-4 border rounded-lg font-medium flex items-center gap-2 transition-colors',
                showFilters || hasActiveFilters
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              )}
            >
              <Filter className="w-5 h-5" />
              <span className="hidden sm:inline">Filtres</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 bg-emerald-500 rounded-full" />
              )}
            </button>
          </div>

          {/* Filters panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Article</label>
                  <select
                    value={filterArticle}
                    onChange={(e) => setFilterArticle(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Tous les articles</option>
                    {articles.map(art => (
                      <option key={art.id} value={art.id}>{art.nom}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="all">Tous</option>
                    <option value="entree">Entrées</option>
                    <option value="sortie">Sorties</option>
                    <option value="transfert">Transferts</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Période</label>
                  <select
                    value={filterPeriode}
                    onChange={(e) => setFilterPeriode(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="all">Toute la période</option>
                    <option value="today">Aujourd'hui</option>
                    <option value="week">Cette semaine</option>
                    <option value="month">Ce mois</option>
                  </select>
                </div>
              </div>
              {hasActiveFilters && (
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={resetFilters}
                    className="h-9 px-3 text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    Réinitialiser
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="px-4 py-4 lg:px-8 lg:py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 lg:gap-3 mb-4">
          <div className="bg-white rounded-xl p-3 lg:p-4 border border-slate-200">
            <p className="text-xs text-slate-500 mb-1">Mouvements</p>
            <p className="text-xl lg:text-2xl font-bold text-slate-900">{filteredMouvements.length}</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-3 lg:p-4 border border-emerald-100">
            <p className="text-xs text-emerald-600 mb-1">Entrées</p>
            <p className="text-xl lg:text-2xl font-bold text-emerald-900">
              {filteredMouvements.filter(m => m.type === 'entree').length}
            </p>
          </div>
          <div className="bg-red-50 rounded-xl p-3 lg:p-4 border border-red-100">
            <p className="text-xs text-red-600 mb-1">Sorties</p>
            <p className="text-xl lg:text-2xl font-bold text-red-900">
              {filteredMouvements.filter(m => m.type === 'sortie').length}
            </p>
          </div>
        </div>

        {/* Movements list */}
        {filteredMouvements.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <History className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucun mouvement</h3>
            <p className="text-slate-500">
              {hasActiveFilters ? 'Aucun mouvement ne correspond aux filtres' : 'Aucun mouvement enregistré'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredMouvements.map((mouv) => (
              <button
                key={mouv.id}
                onClick={() => router.push(`/stock/${mouv.article_id}`)}
                className="w-full bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 hover:shadow-sm transition-all text-left"
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                    mouv.type === 'entree' ? 'bg-emerald-50' :
                    mouv.type === 'sortie' ? 'bg-red-50' : 'bg-blue-50'
                  )}>
                    {mouv.type === 'entree' ? (
                      <TrendingUp className="w-5 h-5 text-emerald-500" />
                    ) : mouv.type === 'sortie' ? (
                      <TrendingDown className="w-5 h-5 text-red-500" />
                    ) : (
                      <ArrowRightLeft className="w-5 h-5 text-blue-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="min-w-0">
                        <p className={cn(
                          'font-semibold text-sm',
                          mouv.type === 'entree' ? 'text-emerald-700' :
                          mouv.type === 'sortie' ? 'text-red-700' : 'text-blue-700'
                        )}>
                          {mouv.type === 'entree' ? 'ENTRÉE' : mouv.type === 'sortie' ? 'SORTIE' : 'TRANSFERT'}
                          {' '}
                          {mouv.type === 'entree' ? '+' : mouv.type === 'sortie' ? '-' : ''}{mouv.quantite} unités
                        </p>
                        <p className="text-sm text-slate-600 truncate">
                          {mouv.stock_articles?.nom}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-slate-500">
                          {new Date(mouv.date_mouvement).toLocaleDateString('fr-FR')}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(mouv.date_mouvement).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{mouv.profiles?.full_name}</span>
                      <span className="text-slate-300">•</span>
                      <span>Stock: {mouv.quantite_avant} → {mouv.quantite_apres}</span>
                    </div>

                    {mouv.notes && (
                      <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded-lg line-clamp-2">
                        {mouv.notes}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
