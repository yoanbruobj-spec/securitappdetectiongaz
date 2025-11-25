'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  FileText,
  ClipboardList,
  Clock,
  CheckCircle2,
  Calendar,
  MapPin,
  ChevronRight,
  Filter
} from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: number
  icon: React.ElementType
  color: 'emerald' | 'blue' | 'amber' | 'purple'
  active?: boolean
  onClick?: () => void
}

function StatCard({ title, value, icon: Icon, color, active, onClick }: StatCardProps) {
  const colors = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' }
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'bg-white rounded-xl border p-4 text-left w-full transition-all active:scale-[0.98]',
        active ? `${colors[color].border} border-2 shadow-sm` : 'border-slate-200 hover:border-slate-300'
      )}
    >
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', colors[color].bg)}>
        <Icon className={cn('w-5 h-5', colors[color].text)} />
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500 mt-0.5">{title}</p>
    </button>
  )
}

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
  }, [])

  useEffect(() => {
    if (profile) {
      loadInterventions()
    }
  }, [filter, profile])

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
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <Sidebar userRole="technicien" userName={profile?.full_name} onLogout={handleLogout} />

      <main className="flex-1 pb-24 lg:pb-0">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-4 py-4 lg:px-8 lg:py-6 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-slate-900">
                Bonjour, {profile?.full_name?.split(' ')[0]} 👋
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center lg:hidden">
              <span className="text-emerald-600 font-semibold">
                {profile?.full_name?.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        <div className="px-4 py-6 lg:px-8 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <StatCard
              title="Total"
              value={stats.total}
              icon={ClipboardList}
              color="emerald"
              active={filter === 'all'}
              onClick={() => setFilter('all')}
            />
            <StatCard
              title="En cours"
              value={stats.enCours}
              icon={Clock}
              color="blue"
              active={filter === 'en_cours'}
              onClick={() => setFilter('en_cours')}
            />
            <StatCard
              title="Terminées"
              value={stats.terminees}
              icon={CheckCircle2}
              color="emerald"
              active={filter === 'terminee'}
              onClick={() => setFilter('terminee')}
            />
            <StatCard
              title="Planifiées"
              value={stats.planifiees}
              icon={Calendar}
              color="purple"
              active={filter === 'planifiee'}
              onClick={() => setFilter('planifiee')}
            />
          </div>

          {/* Filter indicator */}
          {filter !== 'all' && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-600">
                Filtré par : <span className="font-medium text-slate-900">
                  {filter === 'en_cours' ? 'En cours' : filter === 'terminee' ? 'Terminées' : 'Planifiées'}
                </span>
              </span>
              <button
                onClick={() => setFilter('all')}
                className="text-sm text-emerald-600 font-medium ml-2"
              >
                Réinitialiser
              </button>
            </div>
          )}

          {/* Interventions List */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-emerald-500" />
                </div>
                <h3 className="font-semibold text-slate-900">Mes interventions</h3>
              </div>
              <span className="text-sm text-slate-500">{interventions.length} résultat(s)</span>
            </div>

            {interventions.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Aucune intervention</p>
                <p className="text-sm text-slate-400 mt-1">Les interventions qui vous sont attribuées apparaîtront ici</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {interventions.map((intervention) => (
                  <button
                    key={intervention.id}
                    onClick={() => {
                      const path = intervention.type_rapport === 'portable'
                        ? `/intervention-portable/${intervention.id}`
                        : `/intervention/${intervention.id}`
                      router.push(path)
                    }}
                    className="w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <ClipboardList className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-900 truncate">
                              {intervention.sites?.clients?.nom || 'Client'}
                            </p>
                            {intervention.type_rapport === 'portable' && (
                              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-medium">
                                Portable
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5" />
                            <span className="truncate">{intervention.sites?.nom || 'Site'}</span>
                          </p>
                        </div>
                        <Badge
                          variant={
                            intervention.statut === 'terminee' ? 'success' :
                            intervention.statut === 'en_cours' ? 'info' : 'warning'
                          }
                          size="sm"
                        >
                          {intervention.statut === 'terminee' ? 'Terminée' :
                           intervention.statut === 'en_cours' ? 'En cours' : 'Planifiée'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(intervention.date_intervention).toLocaleDateString('fr-FR')}
                        </span>
                        {intervention.type && (
                          <span className="capitalize">
                            {intervention.type?.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Action - Mobile */}
          <div className="lg:hidden">
            <button
              onClick={() => router.push('/select-rapport-type')}
              className="w-full bg-emerald-500 text-white rounded-xl p-4 text-left hover:bg-emerald-600 transition-colors active:scale-[0.98] flex items-center justify-between"
            >
              <div>
                <p className="font-semibold">Nouveau rapport</p>
                <p className="text-sm text-emerald-100 mt-0.5">Créer une intervention</p>
              </div>
              <ClipboardList className="w-6 h-6" />
            </button>
          </div>
        </div>
      </main>

      <BottomNav userRole="technicien" />
    </div>
  )
}
