'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Users, Building2, ClipboardList, AlertTriangle, Plus, FileText, Calendar, LogOut, Package } from 'lucide-react'
import Image from 'next/image'
import { StatCard } from '@/components/ui/StatCard'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({
    users: 0,
    clients: 0,
    interventions: 0,
    alertes: 0
  })
  const [recentInterventions, setRecentInterventions] = useState<any[]>([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
    loadStats()
    loadRecentInterventions()
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
    const [usersRes, clientsRes, interventionsRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('clients').select('id', { count: 'exact', head: true }),
      supabase.from('interventions').select('id', { count: 'exact', head: true })
    ])

    setStats({
      users: usersRes.count || 0,
      clients: clientsRes.count || 0,
      interventions: interventionsRes.count || 0,
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

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="space-y-4 w-full max-w-6xl px-6">
          <div className="grid grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} variant="glass" padding="md">
                <Skeleton height="120px" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-lg">
        <div className="p-6 border-b border-gray-200 bg-slate-800">
          <div className="flex items-center justify-center">
            <Image
              src="/logo-securit-blanc.png"
              alt="SÉCUR'IT"
              width={160}
              height={40}
              priority
              className="object-contain"
            />
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => router.push('/select-rapport-type')}
            className="w-full flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-xl font-medium transform hover:scale-[1.02]"
          >
            <div className="p-1.5 bg-white/20 rounded-lg">
              <Plus className="w-5 h-5" />
            </div>
            <span>Nouveau rapport</span>
          </button>

          <div className="pt-2 pb-1">
            <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Navigation</p>
          </div>

          <button
            onClick={() => router.push('/interventions')}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition-all font-medium group"
          >
            <div className="p-1.5 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
              <FileText className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-sm">Mes rapports</span>
          </button>

          <button
            onClick={() => router.push('/planning')}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-green-50 hover:text-green-700 rounded-lg transition-all font-medium group"
          >
            <div className="p-1.5 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
              <Calendar className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-sm">Planning</span>
          </button>

          <button
            onClick={() => router.push('/stock')}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-amber-50 hover:text-amber-700 rounded-lg transition-all font-medium group"
          >
            <div className="p-1.5 bg-amber-50 rounded-lg group-hover:bg-amber-100 transition-colors">
              <Package className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-sm">Stock</span>
          </button>

          <div className="pt-3 pb-1">
            <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Gestion</p>
          </div>

          <button
            onClick={() => router.push('/clients')}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-orange-50 hover:text-orange-700 rounded-lg transition-all font-medium group"
          >
            <div className="p-1.5 bg-orange-50 rounded-lg group-hover:bg-orange-100 transition-colors">
              <Building2 className="w-4 h-4 text-orange-600" />
            </div>
            <span className="text-sm">Clients</span>
          </button>

          <button
            onClick={() => router.push('/utilisateurs')}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-all font-medium group"
          >
            <div className="p-1.5 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <span className="text-sm">Utilisateurs</span>
          </button>
        </nav>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="mb-3 px-2">
            <p className="text-xs text-slate-500 mb-1">Connecté en tant que</p>
            <p className="text-sm text-slate-800 font-medium truncate">{profile?.full_name}</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="secondary"
            size="sm"
            icon={<LogOut className="w-4 h-4" />}
            className="w-full"
          >
            Déconnexion
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 shadow-sm px-8 py-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-slate-800 mb-1">Tableau de bord</h2>
                <p className="text-slate-600">Bienvenue {profile?.full_name} 👋</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </motion.div>
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-8">
          <div className="grid grid-cols-4 gap-6 mb-6">
          <div onClick={() => router.push('/utilisateurs')} className="cursor-pointer transform transition-transform hover:scale-105">
            <StatCard
              title="Utilisateurs"
              value={stats.users}
              icon={Users}
              color="blue"
            />
          </div>
          <div onClick={() => router.push('/clients')} className="cursor-pointer transform transition-transform hover:scale-105">
            <StatCard
              title="Clients"
              value={stats.clients}
              icon={Building2}
              color="green"
            />
          </div>
          <div onClick={() => router.push('/interventions')} className="cursor-pointer transform transition-transform hover:scale-105">
            <StatCard
              title="Interventions"
              value={stats.interventions}
              icon={ClipboardList}
              color="purple"
            />
          </div>
          <div onClick={() => router.push('/interventions?filter=alertes')} className="cursor-pointer transform transition-transform hover:scale-105">
            <StatCard
              title="Alertes"
              value={stats.alertes}
              icon={AlertTriangle}
              color="orange"
            />
          </div>
          </div>

          <Card variant="glass" padding="lg" className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-md">
                  <ClipboardList className="w-5 h-5 text-white" />
                </div>
                Dernières interventions
              </h3>
              <button
                onClick={() => router.push('/interventions')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition"
              >
                Tout voir
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            {recentInterventions.length === 0 ? (
              <div className="text-center py-16 text-slate-600 bg-gray-50 rounded-xl">
                <ClipboardList className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="font-medium">Aucune intervention pour le moment</p>
                <p className="text-sm text-slate-500 mt-1">Créez votre première intervention</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentInterventions.map((intervention, index) => (
                  <motion.div
                    key={intervention.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div
                      onClick={() => {
                        if (intervention.type_rapport === 'portable') {
                          router.push(`/intervention-portable/${intervention.id}`)
                        } else {
                          router.push(`/intervention/${intervention.id}`)
                        }
                      }}
                      className="cursor-pointer group bg-gray-50 hover:bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-slate-800 group-hover:text-blue-600 transition">
                              {intervention.sites?.clients?.nom}
                            </p>
                            <Badge
                              variant={intervention.type_rapport === 'portable' ? 'info' : 'default'}
                              size="sm"
                            >
                              {intervention.type_rapport === 'portable' ? 'Portable' : 'Fixe'}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 flex items-center gap-2">
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
                            intervention.statut === 'planifiee' ? 'warning' :
                            'default'
                          }
                          size="sm"
                        >
                          {intervention.statut}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
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
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </main>
      </div>
    </div>
  )
}