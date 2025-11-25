'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Users,
  Package,
  ChevronRight,
  Calendar,
  MapPin
} from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import type { StockArticle } from '@/types/stock'

interface StatCardProps {
  title: string
  value: number
  icon: React.ElementType
  color: 'emerald' | 'blue' | 'amber' | 'red' | 'purple'
  onClick?: () => void
}

function StatCard({ title, value, icon: Icon, color, onClick }: StatCardProps) {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600'
  }

  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl border border-slate-200 p-4 text-left w-full hover:border-slate-300 hover:shadow-sm transition-all active:scale-[0.98]"
    >
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', colors[color])}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500 mt-0.5">{title}</p>
    </button>
  )
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({
    interventions: 0,
    interventionsTerminees: 0,
    clients: 0,
    users: 0,
    stockAlertes: 0
  })
  const [recentInterventions, setRecentInterventions] = useState<any[]>([])
  const [stockAlertes, setStockAlertes] = useState<StockArticle[]>([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
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
    await Promise.all([loadStats(), loadRecentInterventions(), loadStockAlertes()])
    setLoading(false)
  }

  async function loadStats() {
    const [usersRes, clientsRes, interventionsRes, termineeRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('clients').select('id', { count: 'exact', head: true }),
      supabase.from('interventions').select('id', { count: 'exact', head: true }),
      supabase.from('interventions').select('id', { count: 'exact', head: true }).eq('statut', 'terminee')
    ])

    setStats(prev => ({
      ...prev,
      users: usersRes.count || 0,
      clients: clientsRes.count || 0,
      interventions: interventionsRes.count || 0,
      interventionsTerminees: termineeRes.count || 0
    }))
  }

  async function loadRecentInterventions() {
    const { data } = await supabase
      .from('interventions')
      .select(`*, sites (nom, clients (nom))`)
      .order('created_at', { ascending: false })
      .limit(5)

    if (data) setRecentInterventions(data)
  }

  async function loadStockAlertes() {
    const { data } = await supabase
      .from('stock_articles')
      .select(`*, stock_categories (*)`)
      .order('quantite', { ascending: true })

    if (data) {
      const articlesEnAlerte = data.filter(article => article.quantite <= article.seuil_alerte)
      setStockAlertes(articlesEnAlerte)
      setStats(prev => ({ ...prev, stockAlertes: articlesEnAlerte.length }))
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
      <Sidebar userRole="admin" userName={profile?.full_name} onLogout={handleLogout} />

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
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
            <StatCard
              title="Interventions"
              value={stats.interventions}
              icon={ClipboardList}
              color="emerald"
              onClick={() => router.push('/interventions')}
            />
            <StatCard
              title="Terminées"
              value={stats.interventionsTerminees}
              icon={CheckCircle2}
              color="blue"
              onClick={() => router.push('/interventions?filter=terminee')}
            />
            <StatCard
              title="Alertes stock"
              value={stats.stockAlertes}
              icon={AlertTriangle}
              color={stats.stockAlertes > 0 ? 'red' : 'amber'}
              onClick={() => router.push('/stock')}
            />
            <StatCard
              title="Clients"
              value={stats.clients}
              icon={Building2}
              color="purple"
              onClick={() => router.push('/clients')}
            />
            <div className="hidden lg:block">
              <StatCard
                title="Utilisateurs"
                value={stats.users}
                icon={Users}
                color="blue"
                onClick={() => router.push('/utilisateurs')}
              />
            </div>
          </div>

          {/* Stock Alerts */}
          {stockAlertes.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Alertes stock</h3>
                    <p className="text-xs text-slate-500">{stockAlertes.length} article(s) à réapprovisionner</p>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/stock')}
                  className="text-sm text-emerald-600 font-medium flex items-center gap-1"
                >
                  Voir tout
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {stockAlertes.slice(0, 3).map((article) => (
                  <button
                    key={article.id}
                    onClick={() => router.push(`/stock/${article.id}`)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{article.nom}</p>
                        <p className="text-xs text-slate-500">Réf: {article.reference}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-500">{article.quantite}</p>
                      <p className="text-xs text-slate-400">/ {article.seuil_alerte}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent Interventions */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">Dernières interventions</h3>
              <button
                onClick={() => router.push('/interventions')}
                className="text-sm text-emerald-600 font-medium flex items-center gap-1"
              >
                Voir tout
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {recentInterventions.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Aucune intervention</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentInterventions.map((intervention) => (
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
                          <p className="font-medium text-slate-900 truncate">
                            {intervention.sites?.clients?.nom || 'Client'}
                          </p>
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
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-2">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(intervention.date_intervention).toLocaleDateString('fr-FR')}
                        {intervention.type_rapport === 'portable' && (
                          <span className="ml-2 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-medium">
                            Portable
                          </span>
                        )}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions - Mobile */}
          <div className="lg:hidden grid grid-cols-2 gap-3">
            <button
              onClick={() => router.push('/select-rapport-type')}
              className="bg-emerald-500 text-white rounded-xl p-4 text-left hover:bg-emerald-600 transition-colors active:scale-[0.98]"
            >
              <ClipboardList className="w-6 h-6 mb-2" />
              <p className="font-semibold">Nouveau rapport</p>
              <p className="text-sm text-emerald-100 mt-0.5">Créer une intervention</p>
            </button>
            <button
              onClick={() => router.push('/stock/scanner')}
              className="bg-slate-900 text-white rounded-xl p-4 text-left hover:bg-slate-800 transition-colors active:scale-[0.98]"
            >
              <Package className="w-6 h-6 mb-2" />
              <p className="font-semibold">Scanner QR</p>
              <p className="text-sm text-slate-400 mt-0.5">Mouvement de stock</p>
            </button>
          </div>
        </div>
      </main>

      <BottomNav userRole="admin" />
    </div>
  )
}
