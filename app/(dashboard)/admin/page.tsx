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
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-slate-100 border-r border-gray-400 flex flex-col">
        <div className="p-6 border-b border-gray-400 bg-white">
          <div className="flex items-center justify-center">
            <Image
              src="/logo-securit.png"
              alt="SÉCUR'IT"
              width={160}
              height={40}
              priority
              className="object-contain"
            />
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-3">
          <button
            onClick={() => router.push('/select-rapport-type')}
            className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg font-medium"
          >
            <div className="p-2 bg-white/20 rounded-lg">
              <Plus className="w-5 h-5" />
            </div>
            <span>Nouveau rapport</span>
          </button>

          <button
            onClick={() => router.push('/interventions')}
            className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-purple-50 text-slate-700 hover:text-purple-700 rounded-lg transition-all border-2 border-gray-200 hover:border-purple-300 font-medium group"
          >
            <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <span>Mes rapports</span>
          </button>

          <button
            onClick={() => router.push('/planning')}
            className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-green-50 text-slate-700 hover:text-green-700 rounded-lg transition-all border-2 border-gray-200 hover:border-green-300 font-medium group"
          >
            <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <span>Planning</span>
          </button>

          <button
            onClick={() => router.push('/stock')}
            className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-purple-50 text-slate-700 hover:text-purple-700 rounded-lg transition-all border-2 border-gray-200 hover:border-purple-300 font-medium group"
          >
            <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <span>Stock</span>
          </button>

          <button
            onClick={() => router.push('/clients')}
            className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-orange-50 text-slate-700 hover:text-orange-700 rounded-lg transition-all border-2 border-gray-200 hover:border-orange-300 font-medium group"
          >
            <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
              <Building2 className="w-5 h-5 text-orange-600" />
            </div>
            <span>Clients</span>
          </button>

          <button
            onClick={() => router.push('/utilisateurs')}
            className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-lg transition-all border-2 border-gray-200 hover:border-indigo-300 font-medium group"
          >
            <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Utilisateurs</span>
          </button>
        </nav>

        <div className="p-4 border-t border-gray-400 bg-white">
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
        <header className="bg-white border-b border-gray-300 shadow-sm px-8 py-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Tableau de bord Admin</h2>
            <p className="text-slate-600">Bienvenue {profile?.full_name}</p>
          </motion.div>
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-6">
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

          <Card variant="glass" padding="lg" className="bg-white border border-gray-300 rounded-lg">
            <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                <ClipboardList className="w-4 h-4 text-purple-600" />
              </div>
              Dernières interventions
              <span className="text-xs text-slate-500 ml-auto font-normal">
                <svg className="inline w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Cliquez pour voir les détails
              </span>
            </h3>
            {recentInterventions.length === 0 ? (
              <div className="text-center py-12 text-slate-600">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Aucune intervention pour le moment</p>
              </div>
            ) : (
              <div className="space-y-3">
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
                          // Par défaut ou si type_rapport = 'fixe'
                          router.push(`/intervention/${intervention.id}`)
                        }
                      }}
                      className="cursor-pointer bg-white border border-gray-300 rounded-lg p-4 hover:bg-gray-50 hover:shadow-md transition-all duration-200">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-slate-800">{intervention.sites?.clients?.nom}</p>
                          <p className="text-sm text-slate-600">{intervention.sites?.nom}</p>
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
                      <p className="text-sm text-slate-600">
                        {new Date(intervention.date_intervention).toLocaleDateString('fr-FR')}
                      </p>
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