'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { FileText, ClipboardList, Clock, CheckCircle2, Calendar } from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { StatsCardWithChart } from '@/components/stats/StatsCardWithChart'
import { ActivityTimeline } from '@/components/stats/ActivityTimeline'
import { Badge } from '@/components/ui/Badge'

export default function TechnicienDashboard() {
  const router = useRouter()
  const supabase = createClient()
  
  const [profile, setProfile] = useState<any>(null)
  const [interventions, setInterventions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [stats, setStats] = useState({
    total: 0,
    enCours: 0,
    terminees: 0,
    planifiees: 0
  })
  const [monthlyData, setMonthlyData] = useState<number[]>([])

  useEffect(() => {
    checkAuth()
    loadInterventions()
    loadMonthlyData()
  }, [filter])

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

    if (profileData?.role !== 'technicien') {
      router.push('/admin')
      return
    }

    setProfile(profileData)
    setLoading(false)
  }

  async function loadInterventions() {
    setLoading(true)

    let query = supabase
      .from('interventions')
      .select(`
        *,
        sites (
          nom,
          adresse,
          ville,
          clients (nom)
        )
      `)
      .order('date_intervention', { ascending: false })

    if (filter !== 'all') {
      query = query.eq('statut', filter)
    }

    const { data } = await query

    if (data) {
      setInterventions(data)

      setStats({
        total: data.length,
        enCours: data.filter(i => i.statut === 'en_cours').length,
        terminees: data.filter(i => i.statut === 'terminee').length,
        planifiees: data.filter(i => i.statut === 'planifiee').length
      })
    }
    setLoading(false)
  }

  async function loadMonthlyData() {
    // Simuler des données mensuelles pour le sparkline
    setMonthlyData([8, 12, 10, 15, 13, 17, 16])
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
  const activities = interventions.slice(0, 4).map((intervention) => ({
    id: intervention.id,
    icon: intervention.statut === 'terminee' ? CheckCircle2 : Clock,
    title: intervention.sites?.clients?.nom || 'Client',
    description: `${intervention.sites?.nom || 'Site'} - ${intervention.type?.replace(/_/g, ' ')}`,
    time: new Date(intervention.created_at || intervention.date_intervention).toLocaleDateString('fr-FR'),
    color: intervention.statut === 'terminee' ? 'emerald' as const : 'cyan' as const
  }))

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Sidebar
        userRole="technicien"
        userName={profile?.full_name}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-8 py-6 sticky top-0 z-40">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                Mes interventions
              </h1>
              <p className="text-gray-600 mt-1">
                Bienvenue {profile?.full_name} 👋
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600 bg-white px-4 py-2 rounded-xl shadow-sm ring-1 ring-gray-200">
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

        <main className="flex-1 overflow-y-auto px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCardWithChart
              title="Total"
              value={stats.total}
              icon={ClipboardList}
              color="emerald"
              trend={{ value: 8, isPositive: true }}
              sparklineData={monthlyData}
              onClick={() => setFilter('all')}
            />
            <StatsCardWithChart
              title="En cours"
              value={stats.enCours}
              icon={Clock}
              color="cyan"
              trend={{ value: 5, isPositive: true }}
              sparklineData={monthlyData.map(v => v * 0.6)}
              onClick={() => setFilter('en_cours')}
            />
            <StatsCardWithChart
              title="Terminées"
              value={stats.terminees}
              icon={CheckCircle2}
              color="blue"
              trend={{ value: 12, isPositive: true }}
              sparklineData={monthlyData.map(v => v * 0.5)}
              onClick={() => setFilter('terminee')}
            />
            <StatsCardWithChart
              title="Planifiées"
              value={stats.planifiees}
              icon={Calendar}
              color="purple"
              trend={{ value: 3, isPositive: true }}
              sparklineData={monthlyData.map(v => v * 0.3)}
              onClick={() => setFilter('planifiee')}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Interventions List */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-6 shadow-lg ring-1 ring-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-md">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    {filter === 'all' ? 'Toutes les interventions' :
                     filter === 'en_cours' ? 'Interventions en cours' :
                     filter === 'terminee' ? 'Interventions terminées' :
                     'Interventions planifiées'}
                  </h3>
                </div>

                {interventions.length === 0 ? (
                  <div className="text-center py-16 text-gray-500">
                    <ClipboardList className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="font-medium">Aucune intervention assignée</p>
                    <p className="text-sm mt-1">Les interventions qui vous sont attribuées apparaîtront ici</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {interventions.map((intervention, index) => (
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
                        className="cursor-pointer group bg-gradient-to-br from-gray-50 to-white hover:from-white hover:to-gray-50 border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-emerald-200 transition-all duration-200"
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
                          {intervention.type && (
                            <span className="capitalize">
                              {intervention.type?.replace(/_/g, ' ')}
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
            <div className="lg:col-span-1">
              <ActivityTimeline activities={activities} />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}