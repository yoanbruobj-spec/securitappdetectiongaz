'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Users, Building2, ClipboardList, AlertTriangle, Plus, FileText, Calendar, LogOut } from 'lucide-react'
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
      <div className="min-h-screen flex items-center justify-center bg-[#0A0E1A]">
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
    <div className="min-h-screen bg-[#0A0E1A] flex">
      <aside className="w-64 bg-[#141B2D] border-r border-[#2D3B52] flex flex-col">
        <div className="p-6 border-b border-[#2D3B52]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 shadow-lg shadow-blue-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">SÉCUR'IT</h1>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Button
            onClick={() => router.push('/select-rapport-type')}
            variant="primary"
            size="md"
            icon={<Plus className="w-5 h-5" />}
            className="w-full justify-start"
          >
            Nouveau rapport
          </Button>

          <Button
            onClick={() => router.push('/interventions')}
            variant="ghost"
            size="md"
            icon={<FileText className="w-5 h-5" />}
            className="w-full justify-start"
          >
            Mes rapports
          </Button>

          <Button
            onClick={() => router.push('/planning')}
            variant="ghost"
            size="md"
            icon={<Calendar className="w-5 h-5" />}
            className="w-full justify-start"
          >
            Planning
          </Button>

          <Button
            onClick={() => router.push('/clients')}
            variant="ghost"
            size="md"
            icon={<Building2 className="w-5 h-5" />}
            className="w-full justify-start"
          >
            Clients
          </Button>

          <Button
            onClick={() => router.push('/utilisateurs')}
            variant="ghost"
            size="md"
            icon={<Users className="w-5 h-5" />}
            className="w-full justify-start"
          >
            Utilisateurs
          </Button>
        </nav>

        <div className="p-4 border-t border-[#2D3B52]">
          <div className="mb-3 px-2">
            <p className="text-xs text-slate-500 mb-1">Connecté en tant que</p>
            <p className="text-sm text-slate-300 font-medium truncate">{profile?.full_name}</p>
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
        <header className="bg-[#141B2D]/50 backdrop-blur-xl border-b border-[#2D3B52] px-8 py-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-3xl font-bold text-slate-100 mb-2">Tableau de bord Admin</h2>
            <p className="text-slate-400">Bienvenue {profile?.full_name}</p>
          </motion.div>
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-6">
          <div className="grid grid-cols-4 gap-6 mb-6">
          <StatCard
            title="Utilisateurs"
            value={stats.users}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Clients"
            value={stats.clients}
            icon={Building2}
            color="green"
          />
          <StatCard
            title="Interventions"
            value={stats.interventions}
            icon={ClipboardList}
            color="purple"
          />
          <StatCard
            title="Alertes"
            value={stats.alertes}
            icon={AlertTriangle}
            color="orange"
          />
          </div>

          <Card variant="glass" padding="lg">
            <h3 className="text-lg font-semibold text-slate-100 mb-6 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <ClipboardList className="w-4 h-4 text-purple-400" />
              </div>
              Dernières interventions
            </h3>
            {recentInterventions.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
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
                    <Card variant="elevated" padding="md" hover className="cursor-pointer">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-slate-100">{intervention.sites?.clients?.nom}</p>
                          <p className="text-sm text-slate-400">{intervention.sites?.nom}</p>
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
                      <p className="text-sm text-slate-500">
                        {new Date(intervention.date_intervention).toLocaleDateString('fr-FR')}
                      </p>
                    </Card>
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