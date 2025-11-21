'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Users, Building2, ClipboardList, AlertTriangle, FileText, CheckCircle2, Clock, TrendingUp, Package } from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { StatsCardWithChart } from '@/components/stats/StatsCardWithChart'
import { ActivityTimeline } from '@/components/stats/ActivityTimeline'
import { Badge } from '@/components/ui/Badge'
import type { StockArticle } from '@/types/stock'

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({
    users: 0,
    clients: 0,
    interventions: 0,
    interventionsTerminees: 0,
    interventionsEnCours: 0,
    alertes: 0,
    stockAlertes: 0
  })
  const [recentInterventions, setRecentInterventions] = useState<any[]>([])
  const [stockAlertes, setStockAlertes] = useState<StockArticle[]>([])
  const [monthlyData, setMonthlyData] = useState<number[]>([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
    loadStats()
    loadRecentInterventions()
    loadMonthlyData()
    loadStockAlertes()
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

    if (profileData?.role !== 'admin') {
      router.push('/login')
      return
    }

    setProfile(profileData)
    setLoading(false)
  }

  async function loadStats() {
    const [usersRes, clientsRes, interventionsRes, termineeRes, enCoursRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('clients').select('id', { count: 'exact', head: true }),
      supabase.from('interventions').select('id', { count: 'exact', head: true }),
      supabase.from('interventions').select('id', { count: 'exact', head: true }).eq('statut', 'terminee'),
      supabase.from('interventions').select('id', { count: 'exact', head: true }).eq('statut', 'en_cours')
    ])

    setStats({
      users: usersRes.count || 0,
      clients: clientsRes.count || 0,
      interventions: interventionsRes.count || 0,
      interventionsTerminees: termineeRes.count || 0,
      interventionsEnCours: enCoursRes.count || 0,
      alertes: 0
    })
  }

  async function loadRecentInterventions() {
    const { data } = await supabase
      .from('interventions')
      .select(`
        *,
        sites (
          nom,
          clients (nom)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    if (data) {
      setRecentInterventions(data)
    }
  }

  async function loadMonthlyData() {
    // Simuler des données mensuelles pour le sparkline
    setMonthlyData([12, 19, 15, 23, 18, 25, 22])
  }

  async function loadStockAlertes() {
    const { data } = await supabase
      .from('stock_articles')
      .select(`
        *,
        stock_categories (*)
      `)
      .order('quantite', { ascending: true })

    if (data) {
      // Filtrer les articles en alerte (quantite <= seuil_alerte)
      const articlesEnAlerte = data.filter(article => article.quantite <= article.seuil_alerte)
      setStockAlertes(articlesEnAlerte)

      // Mettre à jour les stats
      setStats(prev => ({
        ...prev,
        stockAlertes: articlesEnAlerte.length
      }))
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Chargement...</p>
        </div>
      </div>
    )
  }

  // Activités récentes pour la timeline
  const activities = recentInterventions.slice(0, 4).map((intervention) => ({
    id: intervention.id,
    icon: intervention.statut === 'terminee' ? CheckCircle2 : Clock,
    title: intervention.sites?.clients?.nom || 'Client',
    description: `${intervention.sites?.nom || 'Site'} - ${intervention.type?.replace(/_/g, ' ')}`,
    time: new Date(intervention.created_at).toLocaleDateString('fr-FR'),
    color: intervention.statut === 'terminee' ? 'emerald' as const : 'cyan' as const
  }))

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Sidebar
        userRole="admin"
        userName={profile?.full_name}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 sticky top-0 z-30 ml-0 lg:ml-0">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between ml-16 lg:ml-0"
          >
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                Tableau de bord
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1 hidden sm:block">
                Bienvenue {profile?.full_name} 👋
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-3 text-sm text-gray-600 bg-white px-4 py-2 rounded-xl shadow-sm ring-1 ring-gray-200">
              <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              {new Date().toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </motion.div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-8 sm:mb-10 lg:mb-12">
            <StatsCardWithChart
              title="Total Interventions"
              value={stats.interventions}
              icon={ClipboardList}
              color="emerald"
              trend={{ value: 12, isPositive: true }}
              sparklineData={monthlyData}
              onClick={() => router.push('/interventions')}
            />
            <StatsCardWithChart
              title="Terminées"
              value={stats.interventionsTerminees}
              icon={CheckCircle2}
              color="cyan"
              trend={{ value: 8, isPositive: true }}
              sparklineData={monthlyData.map(v => v * 0.7)}
              onClick={() => router.push('/interventions?filter=terminee')}
            />
            <StatsCardWithChart
              title="Alertes Stock"
              value={stats.stockAlertes}
              icon={AlertTriangle}
              color="orange"
              sparklineData={[]}
              onClick={() => router.push('/stock')}
            />
            <StatsCardWithChart
              title="Clients"
              value={stats.clients}
              icon={Building2}
              color="blue"
              trend={{ value: 5, isPositive: true }}
              sparklineData={[8, 12, 10, 15, 13, 17, 16]}
              onClick={() => router.push('/clients')}
            />
            <StatsCardWithChart
              title="Utilisateurs"
              value={stats.users}
              icon={Users}
              color="purple"
              trend={{ value: 3, isPositive: true }}
              sparklineData={[5, 7, 6, 8, 7, 9, 9]}
              onClick={() => router.push('/utilisateurs')}
            />
          </div>

          {/* Alertes de stock */}
          {stockAlertes.length > 0 && (
            <div className="mb-8 sm:mb-10 lg:mb-12">
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl ring-2 ring-red-500/20">
                {/* Header avec badge d'alerte */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b-2 border-red-100">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 via-red-600 to-orange-600 flex items-center justify-center shadow-lg animate-pulse">
                      <AlertTriangle className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-2xl font-bold text-gray-900">
                          Alertes de stock
                        </h3>
                        <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-bold rounded-full">
                          {stockAlertes.length}
                        </span>
                      </div>
                      <p className="text-base text-gray-600">
                        Article{stockAlertes.length > 1 ? 's' : ''} nécessitant un réapprovisionnement
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push('/stock')}
                    className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold rounded-xl flex items-center gap-2 transition shadow-lg hover:shadow-xl self-start sm:self-center"
                  >
                    Gérer le stock
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                {/* Liste des articles en alerte */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
                  {stockAlertes.slice(0, 6).map((article, index) => (
                    <motion.div
                      key={article.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.08 }}
                      onClick={() => router.push(`/stock/${article.id}`)}
                      className="cursor-pointer bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-6 border-2 border-red-200 hover:border-red-400 hover:shadow-lg transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-4 mb-5">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-md">
                          <Package className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-base text-gray-900 mb-0.5 truncate group-hover:text-red-600 transition">
                            {article.nom}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Réf: <span className="font-medium">{article.reference}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-red-200">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Stock actuel</p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-red-600">{article.quantite}</span>
                            <span className="text-lg text-gray-400">/ {article.seuil_alerte}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant="danger" size="sm" className="text-xs font-bold px-3 py-1">
                            ⚠️ ALERTE
                          </Badge>
                          {article.emplacement && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <span>📍</span>
                              <span className="truncate max-w-[120px]">{article.emplacement}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Footer si plus d'articles */}
                {stockAlertes.length > 6 && (
                  <div className="mt-6 pt-6 border-t-2 border-red-100 text-center">
                    <button
                      onClick={() => router.push('/stock')}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-xl transition"
                    >
                      <AlertTriangle className="w-5 h-5" />
                      Voir les {stockAlertes.length - 6} autres alertes
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Recent Interventions */}
            <div className="lg:col-span-2 order-2 lg:order-1">
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg ring-1 ring-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-md">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    Dernières interventions
                  </h3>
                  <button
                    onClick={() => router.push('/interventions')}
                    className="text-sm text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 transition group"
                  >
                    Tout voir
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                {recentInterventions.length === 0 ? (
                  <div className="text-center py-16 text-gray-500">
                    <ClipboardList className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="font-medium">Aucune intervention</p>
                    <p className="text-sm mt-1">Les interventions apparaîtront ici</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentInterventions.map((intervention, index) => (
                      <motion.div
                        key={intervention.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => {
                          if (intervention.type_rapport === 'portable') {
                            router.push(`/intervention-portable/${intervention.id}`)
                          } else {
                            router.push(`/intervention/${intervention.id}`)
                          }
                        }}
                        className="cursor-pointer group bg-gradient-to-br from-gray-50 to-white hover:from-white hover:to-gray-50 border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-emerald-200 transition-all duration-200"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-gray-900 group-hover:text-emerald-600 transition">
                                {intervention.sites?.clients?.nom}
                              </p>
                              <Badge
                                variant={intervention.type_rapport === 'portable' ? 'info' : 'default'}
                                size="sm"
                              >
                                {intervention.type_rapport === 'portable' ? 'Portable' : 'Fixe'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {intervention.sites?.nom}
                            </p>
                          </div>
                          <Badge
                            variant={
                              intervention.statut === 'terminee' ? 'success' :
                              intervention.statut === 'en_cours' ? 'info' :
                              'warning'
                            }
                            size="sm"
                          >
                            {intervention.statut === 'terminee' ? 'Terminée' :
                             intervention.statut === 'en_cours' ? 'En cours' :
                             'Planifiée'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                            {new Date(intervention.date_intervention).toLocaleDateString('fr-FR')}
                          </span>
                          {intervention.technicien && (
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                              {intervention.technicien}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="lg:col-span-1 order-1 lg:order-2">
              <ActivityTimeline activities={activities} />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
