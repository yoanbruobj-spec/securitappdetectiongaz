'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft,
  Plus,
  FileText,
  Trash2,
  Eye,
  Search,
  Filter,
  MapPin,
  Calendar,
  Clock,
  User,
  ChevronRight,
  X
} from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

export default function InterventionsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [interventions, setInterventions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [userRole, setUserRole] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [profile, setProfile] = useState<any>(null)

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

    if (profileData) {
      setUserRole(profileData.role)
      setProfile(profileData)
    }
    setLoading(false)
  }

  async function loadInterventions() {
    let query = supabase
      .from('interventions')
      .select(`
        *,
        sites (
          nom,
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
    }
  }

  async function handleDelete(interventionId: string, event: React.MouseEvent) {
    event.stopPropagation()

    if (!confirm('Êtes-vous sûr de vouloir supprimer cette intervention ?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('interventions')
        .delete()
        .eq('id', interventionId)

      if (error) throw error

      loadInterventions()
    } catch (error: any) {
      console.error('Erreur suppression:', error)
      alert('Erreur lors de la suppression')
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Filter interventions by search query
  const filteredInterventions = interventions.filter(intervention => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      intervention.sites?.clients?.nom?.toLowerCase().includes(query) ||
      intervention.sites?.nom?.toLowerCase().includes(query) ||
      intervention.technicien?.toLowerCase().includes(query)
    )
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <Sidebar userRole={userRole as any} userName={profile?.full_name} onLogout={handleLogout} />

      <main className="flex-1 pb-24 lg:pb-0">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="px-4 py-4 lg:px-8">
            {/* Title row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push(userRole === 'admin' ? '/admin' : '/technicien')}
                  className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100"
                >
                  <ArrowLeft className="w-5 h-5 text-slate-600" />
                </button>
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold text-slate-900">Interventions</h1>
                  <p className="text-sm text-slate-500 hidden lg:block">{filteredInterventions.length} intervention(s)</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/select-rapport-type')}
                className="hidden lg:flex items-center gap-2 h-10 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                Nouvelle intervention
              </button>
            </div>

            {/* Search bar */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher un client, site..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  'h-11 px-4 border rounded-lg font-medium flex items-center gap-2 transition-colors',
                  showFilters || filter !== 'all'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                )}
              >
                <Filter className="w-5 h-5" />
                <span className="hidden sm:inline">Filtrer</span>
              </button>
            </div>

            {/* Filter pills */}
            {showFilters && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {[
                  { key: 'all', label: 'Toutes' },
                  { key: 'planifiee', label: 'Planifiées' },
                  { key: 'en_cours', label: 'En cours' },
                  { key: 'terminee', label: 'Terminées' }
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setFilter(item.key)}
                    className={cn(
                      'h-9 px-4 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                      filter === item.key
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        <div className="px-4 py-4 lg:px-8 lg:py-6">
          {/* Active filter indicator */}
          {filter !== 'all' && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-slate-500">Filtre actif :</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-sm font-medium">
                {filter === 'planifiee' ? 'Planifiées' : filter === 'en_cours' ? 'En cours' : 'Terminées'}
                <button onClick={() => setFilter('all')} className="hover:bg-emerald-100 rounded-full p-0.5">
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            </div>
          )}

          {filteredInterventions.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucune intervention</h3>
              <p className="text-slate-500 mb-6">
                {searchQuery
                  ? 'Aucun résultat pour votre recherche'
                  : filter !== 'all'
                    ? `Aucune intervention ${filter === 'en_cours' ? 'en cours' : filter === 'terminee' ? 'terminée' : 'planifiée'}`
                    : 'Créez votre première intervention'
                }
              </p>
              <button
                onClick={() => router.push('/select-rapport-type')}
                className="inline-flex items-center gap-2 h-10 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                Nouvelle intervention
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="divide-y divide-slate-100">
                {filteredInterventions.map((intervention) => (
                  <div
                    key={intervention.id}
                    onClick={() => {
                      const path = intervention.type_rapport === 'portable'
                        ? `/intervention-portable/${intervention.id}`
                        : `/intervention/${intervention.id}`
                      router.push(path)
                    }}
                    className="w-full flex items-start gap-3 px-4 py-4 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  >
                    <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-emerald-500" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900 truncate">
                              {intervention.sites?.clients?.nom || 'Client'}
                            </p>
                            {intervention.type_rapport === 'portable' && (
                              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-medium flex-shrink-0">
                                Portable
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
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

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(intervention.date_intervention).toLocaleDateString('fr-FR')}
                        </span>
                        {intervention.heure_debut && intervention.heure_fin && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {intervention.heure_debut} - {intervention.heure_fin}
                          </span>
                        )}
                        {intervention.technicien && (
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            {intervention.technicien}
                          </span>
                        )}
                      </div>

                      {/* Actions - Desktop */}
                      <div className="hidden lg:flex items-center gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            const path = intervention.type_rapport === 'portable'
                              ? `/intervention-portable/${intervention.id}`
                              : `/intervention/${intervention.id}`
                            router.push(path)
                          }}
                          className="h-8 px-3 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          Voir
                        </button>
                        {userRole === 'admin' && (
                          <button
                            onClick={(e) => handleDelete(intervention.id, e)}
                            className="h-8 px-3 text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1.5 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Supprimer
                          </button>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0 lg:hidden" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* FAB Mobile */}
        <button
          onClick={() => router.push('/select-rapport-type')}
          className="lg:hidden fixed bottom-24 right-4 w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-lg shadow-emerald-500/30 flex items-center justify-center active:scale-95 transition-transform z-40"
        >
          <Plus className="w-6 h-6" />
        </button>
      </main>

      <BottomNav userRole={userRole as any} />
    </div>
  )
}
