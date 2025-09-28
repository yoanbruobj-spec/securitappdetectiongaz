'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Plus, FileText, Calendar, Building2, LogOut, ClipboardList, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { StatCard } from '@/components/ui/StatCard'
import { Skeleton } from '@/components/ui/Skeleton'

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

  useEffect(() => {
    checkAuth()
    loadInterventions()
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

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
        <div className="space-y-4 w-full max-w-6xl px-8">
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
            <h2 className="text-3xl font-bold text-slate-100 mb-2">Mes interventions</h2>
            <p className="text-slate-400">Bienvenue {profile?.full_name}</p>
          </motion.div>
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-6">
          <div className="grid grid-cols-4 gap-6 mb-6">
            <StatCard
              title="Total"
              value={stats.total}
              icon={ClipboardList}
              color="blue"
            />
            <StatCard
              title="En cours"
              value={stats.enCours}
              icon={Clock}
              color="orange"
            />
            <StatCard
              title="Terminées"
              value={stats.terminees}
              icon={FileText}
              color="green"
            />
            <StatCard
              title="Planifiées"
              value={stats.planifiees}
              icon={Calendar}
              color="purple"
            />
          </div>

          <Card variant="glass" padding="md" className="mb-6">
            <div className="flex gap-2">
              <Button
                onClick={() => setFilter('all')}
                variant={filter === 'all' ? 'primary' : 'secondary'}
                size="sm"
              >
                Toutes
              </Button>
              <Button
                onClick={() => setFilter('en_cours')}
                variant={filter === 'en_cours' ? 'primary' : 'secondary'}
                size="sm"
              >
                En cours
              </Button>
              <Button
                onClick={() => setFilter('terminee')}
                variant={filter === 'terminee' ? 'primary' : 'secondary'}
                size="sm"
              >
                Terminées
              </Button>
              <Button
                onClick={() => setFilter('planifiee')}
                variant={filter === 'planifiee' ? 'primary' : 'secondary'}
                size="sm"
              >
                Planifiées
              </Button>
            </div>
          </Card>

          {interventions.length === 0 ? (
            <div className="text-center py-16">
              <ClipboardList className="w-16 h-16 mx-auto mb-4 text-slate-600" />
              <p className="text-slate-400 text-lg">Aucune intervention assignée</p>
            </div>
          ) : (
            <div className="space-y-4">
              {interventions.map((intervention, index) => (
                <motion.div
                  key={intervention.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    variant="glass"
                    padding="lg"
                    hover
                    className="cursor-pointer"
                    onClick={() => router.push(`/intervention/${intervention.id}`)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-1 text-slate-100">
                          {intervention.sites?.clients?.nom}
                        </h3>
                        <p className="text-slate-400">{intervention.sites?.nom}</p>
                        <p className="text-sm text-slate-500">
                          {intervention.sites?.adresse}, {intervention.sites?.ville}
                        </p>
                      </div>
                      <Badge
                        variant={
                          intervention.statut === 'terminee' ? 'success' :
                          intervention.statut === 'en_cours' ? 'info' :
                          intervention.statut === 'planifiee' ? 'warning' :
                          'default'
                        }
                      >
                        {intervention.statut === 'terminee' ? 'Terminée' :
                         intervention.statut === 'en_cours' ? 'En cours' :
                         intervention.statut === 'planifiee' ? 'Planifiée' :
                         intervention.statut}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-6 text-sm">
                      <div>
                        <p className="text-slate-500 mb-1 text-xs">Date</p>
                        <p className="text-slate-100 font-medium">
                          {new Date(intervention.date_intervention).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-1 text-xs">Type</p>
                        <p className="text-slate-100 font-medium capitalize">
                          {intervention.type?.replace(/_/g, ' ')}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-1 text-xs">Horaires</p>
                        <p className="text-slate-100 font-medium">
                          {intervention.heure_debut && intervention.heure_fin
                            ? `${intervention.heure_debut} - ${intervention.heure_fin}`
                            : '-'}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}