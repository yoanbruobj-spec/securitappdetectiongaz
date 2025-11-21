'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Users, Building2, ClipboardList, AlertTriangle, FileText, CheckCircle2, Clock, TrendingUp, Package } from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { StatsCardWithChart } from '@/components/stats/StatsCardWithChart'
import { QuickStatGlass } from '@/components/stats/QuickStatGlass'
import { ActivityTimeline } from '@/components/stats/ActivityTimeline'
import { Badge } from '@/components/ui/Badge'
import { DashboardSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'
import { AnimatedBackground } from '@/components/backgrounds/AnimatedBackground'
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
      <div className="min-h-screen flex bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Sidebar
          userRole="admin"
          userName={profile?.full_name}
          onLogout={handleLogout}
        />
        <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
          <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 sticky top-0 z-30">
            <div className="ml-16 lg:ml-0">
              <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </header>
          <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
            <DashboardSkeleton />
          </main>
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
    <div className="min-h-screen flex relative overflow-hidden">
      <AnimatedBackground />
      <Sidebar
        userRole="admin"
        userName={profile?.full_name}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header GLASSMORPHISM */}
        <header className="glass-strong border-b border-white/20 dark:border-gray-700/50 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 sticky top-0 z-30 ml-0 lg:ml-0 shadow-lg">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between ml-16 lg:ml-0"
          >
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-4xl font-black text-gradient drop-shadow-lg">
                Tableau de bord
              </h1>
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mt-2 font-medium hidden sm:block">
                Bienvenue {profile?.full_name} <span className="inline-block animate-float">👋</span>
              </p>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="hidden sm:flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 glass px-5 py-3 rounded-2xl shadow-xl ring-2 ring-emerald-500/20"
            >
              <motion.svg
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 text-emerald-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </motion.svg>
              <span className="font-semibold">
                {new Date().toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                })}
              </span>
            </motion.div>
          </motion.div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          {/* Stats Cards - Design GLASSMORPHISM 3D */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-8 sm:mb-10 lg:mb-12">
            <QuickStatGlass
              title="Total Interventions"
              value={stats.interventions}
              icon={ClipboardList}
              color="emerald"
              trend={{ value: 12, isPositive: true }}
              onClick={() => router.push('/interventions')}
            />
            <QuickStatGlass
              title="Terminées"
              value={stats.interventionsTerminees}
              icon={CheckCircle2}
              color="cyan"
              trend={{ value: 8, isPositive: true }}
              onClick={() => router.push('/interventions?filter=terminee')}
            />
            <QuickStatGlass
              title="Alertes Stock"
              value={stats.stockAlertes}
              icon={AlertTriangle}
              color="orange"
              onClick={() => router.push('/stock')}
            />
            <QuickStatGlass
              title="Clients"
              value={stats.clients}
              icon={Building2}
              color="blue"
              trend={{ value: 5, isPositive: true }}
              onClick={() => router.push('/clients')}
            />
            <QuickStatGlass
              title="Utilisateurs"
              value={stats.users}
              icon={Users}
              color="purple"
              trend={{ value: 3, isPositive: true }}
              onClick={() => router.push('/utilisateurs')}
            />
          </div>

          {/* Alertes de stock - GLASSMORPHISM */}
          {stockAlertes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 sm:mb-10 lg:mb-12"
            >
              <div className="glass-strong rounded-3xl p-6 sm:p-8 shadow-2xl ring-2 ring-red-500/30 dark:ring-red-500/40 relative overflow-hidden">
                {/* Glow effect animé */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-orange-500/10 to-red-500/10 animate-gradient opacity-50" />

                {/* Header avec badge d'alerte */}
                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b-2 border-red-200/50 dark:border-red-800/50">
                  <div className="flex items-center gap-4">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 via-red-600 to-orange-600 flex items-center justify-center shadow-2xl"
                    >
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 blur-xl opacity-60 animate-pulse-glow" />
                      <AlertTriangle className="relative w-7 h-7 text-white drop-shadow-lg" />
                    </motion.div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-2xl font-black bg-gradient-to-r from-red-600 via-orange-600 to-red-600 bg-clip-text text-transparent drop-shadow-sm">
                          Alertes de stock
                        </h3>
                        <motion.span
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="px-3 py-1 bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-bold rounded-full shadow-lg"
                        >
                          {stockAlertes.length}
                        </motion.span>
                      </div>
                      <p className="text-base text-gray-600 dark:text-gray-400">
                        Article{stockAlertes.length > 1 ? 's' : ''} nécessitant un réapprovisionnement
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push('/stock')}
                    className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold rounded-xl flex items-center gap-2 transition shadow-xl hover:shadow-2xl hover:glow-purple self-start sm:self-center"
                  >
                    Gérer le stock
                    <motion.svg
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </motion.svg>
                  </motion.button>
                </div>

                {/* Liste des articles en alerte */}
                <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
                  {stockAlertes.slice(0, 6).map((article, index) => (
                    <motion.div
                      key={article.id}
                      initial={{ opacity: 0, x: -20, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      whileHover={{ y: -4, scale: 1.02 }}
                      transition={{ delay: index * 0.08 }}
                      onClick={() => router.push(`/stock/${article.id}`)}
                      className="cursor-pointer glass rounded-2xl p-6 ring-2 ring-red-400/30 dark:ring-red-500/40 hover:ring-red-500/50 dark:hover:ring-red-400/60 hover:shadow-2xl transition-all duration-300 group relative overflow-hidden"
                    >
                      {/* Gradient glow on hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-red-500/0 via-orange-500/0 to-red-500/0 group-hover:from-red-500/10 group-hover:via-orange-500/10 group-hover:to-red-500/10 transition-all duration-500" />
                      <div className="relative flex items-center gap-4 mb-5">
                        <motion.div
                          whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                          transition={{ duration: 0.5 }}
                          className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg"
                        >
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 blur-lg opacity-50 animate-pulse-glow" />
                          <Package className="relative w-6 h-6 text-white drop-shadow-lg" />
                        </motion.div>
                        <div className="relative flex-1 min-w-0">
                          <h4 className="font-black text-base text-gray-900 dark:text-gray-100 mb-0.5 truncate group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-300">
                            {article.nom}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Réf: <span className="font-medium">{article.reference}</span>
                          </p>
                        </div>
                      </div>

                      <div className="relative flex items-center justify-between glass rounded-xl p-3 ring-1 ring-red-300/30 dark:ring-red-700/40">
                        <div>
                          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide">Stock actuel</p>
                          <div className="flex items-baseline gap-2">
                            <motion.span
                              initial={{ scale: 0.5, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: index * 0.08 + 0.2 }}
                              className="text-3xl font-black text-red-600 dark:text-red-400"
                            >
                              {article.quantite}
                            </motion.span>
                            <span className="text-lg font-semibold text-gray-500 dark:text-gray-500">/ {article.seuil_alerte}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant="danger" size="sm" className="text-xs font-bold px-3 py-1">
                            ⚠️ ALERTE
                          </Badge>
                          {article.emplacement && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
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
                  <div className="mt-6 pt-6 border-t-2 border-red-100 dark:border-red-900/50 text-center">
                    <button
                      onClick={() => router.push('/stock')}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 font-semibold rounded-xl transition"
                    >
                      <AlertTriangle className="w-5 h-5" />
                      Voir les {stockAlertes.length - 6} autres alertes
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Recent Interventions - GLASSMORPHISM */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-2 order-2 lg:order-1"
            >
              <div className="glass-strong rounded-3xl p-6 sm:p-8 shadow-2xl ring-2 ring-emerald-500/20 dark:ring-emerald-500/30 relative overflow-hidden">
                {/* Gradient glow animé */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-cyan-500/5 to-emerald-500/5 animate-gradient opacity-50" />

                <div className="relative flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black text-gradient flex items-center gap-3">
                    <motion.div
                      whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                      className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-xl"
                    >
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 blur-lg opacity-60 animate-pulse-glow" />
                      <FileText className="relative w-5 h-5 text-white drop-shadow-lg" />
                    </motion.div>
                    Dernières interventions
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push('/interventions')}
                    className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-bold flex items-center gap-1 glass px-4 py-2 rounded-xl shadow-lg transition group"
                  >
                    Tout voir
                    <motion.svg
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </motion.svg>
                  </motion.button>
                </div>

                {recentInterventions.length === 0 ? (
                  <EmptyState
                    icon={ClipboardList}
                    title="Aucune intervention"
                    description="Les interventions apparaîtront ici"
                  />
                ) : (
                  <div className="relative space-y-4">
                    {recentInterventions.map((intervention, index) => (
                      <motion.div
                        key={intervention.id}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        whileHover={{ y: -4, scale: 1.01 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => {
                          if (intervention.type_rapport === 'portable') {
                            router.push(`/intervention-portable/${intervention.id}`)
                          } else {
                            router.push(`/intervention/${intervention.id}`)
                          }
                        }}
                        className="relative cursor-pointer group glass rounded-2xl p-5 ring-1 ring-gray-300/30 dark:ring-gray-600/30 hover:ring-emerald-400/50 dark:hover:ring-emerald-500/50 hover:shadow-2xl transition-all duration-300 overflow-hidden"
                      >
                        {/* Gradient glow on hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-cyan-500/0 to-emerald-500/0 group-hover:from-emerald-500/10 group-hover:via-cyan-500/10 group-hover:to-emerald-500/10 transition-all duration-500" />
                        <div className="relative flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-black text-gray-900 dark:text-gray-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300">
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
