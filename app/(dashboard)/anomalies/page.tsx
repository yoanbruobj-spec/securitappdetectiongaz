'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  AlertTriangle,
  FileText,
  CheckCircle2,
  Clock,
  ShoppingCart,
  DollarSign,
  Building2,
  MapPin,
  Cpu,
  Filter,
  Eye,
  Edit,
  X,
  Search,
  ArrowLeft,
  ChevronRight
} from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface Anomalie {
  id: string
  intervention_id: string
  client_id: string
  site_id: string
  centrale_id?: string
  detecteur_gaz_id?: string
  detecteur_flamme_id?: string
  portable_id?: string
  type_equipement?: string
  description_anomalie: string
  priorite: 'basse' | 'moyenne' | 'haute' | 'critique'
  statut: 'devis_attente' | 'devis_etabli' | 'devis_soumis' | 'attente_commande' | 'commandé' | 'travaux_planifies' | 'travaux_effectues'
  montant_devis?: number
  reference_devis?: string
  date_constat: string
  date_devis?: string
  date_soumission?: string
  date_commande?: string
  date_travaux_planifies?: string
  date_travaux_effectues?: string
  historique?: any[]
  notes?: string
  created_at: string
  updated_at: string
  clients?: { nom: string }
  sites?: { nom: string }
  centrales?: { modele: string; numero: number; type_equipement?: string }
  interventions?: { date_intervention: string; type: string }
}

interface Stats {
  total: number
  devis_attente: number
  devis_etabli: number
  devis_soumis: number
  attente_commande: number
  commandé: number
  travaux_planifies: number
  travaux_effectues: number
}

export default function AnomaliesPage() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [anomalies, setAnomalies] = useState<Anomalie[]>([])
  const [stats, setStats] = useState<Stats>({
    total: 0,
    devis_attente: 0,
    devis_etabli: 0,
    devis_soumis: 0,
    attente_commande: 0,
    commandé: 0,
    travaux_planifies: 0,
    travaux_effectues: 0
  })

  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedAnomalie, setSelectedAnomalie] = useState<Anomalie | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Filtres
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatut, setFilterStatut] = useState<string>('all')
  const [filterClient, setFilterClient] = useState<string>('all')
  const [filterPriorite, setFilterPriorite] = useState<string>('all')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
    loadAnomalies()
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

    setProfile(profileData)
    setLoading(false)
  }

  async function loadAnomalies() {
    const { data, error } = await supabase
      .from('suivi_anomalies')
      .select(`
        *,
        clients (nom),
        sites (nom),
        centrales (modele, numero, type_equipement),
        interventions (date_intervention, type)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur chargement anomalies:', error)
      return
    }

    setAnomalies(data || [])
    calculateStats(data || [])
  }

  function calculateStats(data: Anomalie[]) {
    const stats: Stats = {
      total: data.length,
      devis_attente: data.filter(a => a.statut === 'devis_attente').length,
      devis_etabli: data.filter(a => a.statut === 'devis_etabli').length,
      devis_soumis: data.filter(a => a.statut === 'devis_soumis').length,
      attente_commande: data.filter(a => a.statut === 'attente_commande').length,
      commandé: data.filter(a => a.statut === 'commandé').length,
      travaux_planifies: data.filter(a => a.statut === 'travaux_planifies').length,
      travaux_effectues: data.filter(a => a.statut === 'travaux_effectues').length
    }

    setStats(stats)
  }

  async function updateStatut(id: string, newStatut: Anomalie['statut']) {
    const { error } = await supabase
      .from('suivi_anomalies')
      .update({ statut: newStatut })
      .eq('id', id)

    if (error) {
      alert('Erreur lors de la mise à jour')
      return
    }

    loadAnomalies()
  }

  function getStatutBadge(statut: Anomalie['statut']) {
    const config: Record<string, { variant: 'warning' | 'info' | 'success' | 'default' | 'danger'; label: string }> = {
      devis_attente: { variant: 'warning', label: 'Devis en attente' },
      devis_etabli: { variant: 'info', label: 'Devis établi' },
      devis_soumis: { variant: 'info', label: 'Devis soumis' },
      attente_commande: { variant: 'warning', label: 'Attente commande' },
      commandé: { variant: 'info', label: 'Commandé' },
      travaux_planifies: { variant: 'success', label: 'Travaux planifiés' },
      travaux_effectues: { variant: 'default', label: 'Travaux effectués' }
    }
    const { variant, label } = config[statut] || { variant: 'default', label: statut }
    return <Badge variant={variant} size="sm">{label}</Badge>
  }

  function getPrioriteBadge(priorite: Anomalie['priorite']) {
    const config: Record<string, { variant: 'default' | 'info' | 'warning' | 'danger'; label: string }> = {
      basse: { variant: 'default', label: 'Basse' },
      moyenne: { variant: 'info', label: 'Moyenne' },
      haute: { variant: 'warning', label: 'Haute' },
      critique: { variant: 'danger', label: 'Critique' }
    }
    const { variant, label } = config[priorite] || { variant: 'default', label: priorite }
    return <Badge variant={variant} size="sm">{label}</Badge>
  }

  function getAllStatuts() {
    return [
      { value: 'devis_attente', label: 'En attente de devis' },
      { value: 'devis_etabli', label: 'Devis établi' },
      { value: 'devis_soumis', label: 'Devis soumis' },
      { value: 'attente_commande', label: 'Attente commande' },
      { value: 'commandé', label: 'Commandé' },
      { value: 'travaux_planifies', label: 'Travaux planifiés' },
      { value: 'travaux_effectues', label: 'Travaux effectués' }
    ]
  }

  // Filtrage
  const anomaliesFiltrees = anomalies.filter(anomalie => {
    const matchSearch = searchTerm === '' ||
      anomalie.clients?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      anomalie.sites?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      anomalie.description_anomalie?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchStatut = filterStatut === 'all' || anomalie.statut === filterStatut
    const matchClient = filterClient === 'all' || anomalie.clients?.nom === filterClient
    const matchPriorite = filterPriorite === 'all' || anomalie.priorite === filterPriorite

    return matchSearch && matchStatut && matchClient && matchPriorite
  })

  // Liste unique des clients
  const clients = Array.from(new Set(anomalies.map(a => a.clients?.nom).filter(Boolean)))

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
      <Sidebar
        userRole={profile?.role || 'technicien'}
        userName={profile?.full_name}
        onLogout={handleLogout}
      />

      <main className="flex-1 pb-24 lg:pb-0">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="px-4 py-4 lg:px-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push(profile?.role === 'admin' ? '/admin' : '/technicien')}
                  className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100"
                >
                  <ArrowLeft className="w-5 h-5 text-slate-600" />
                </button>
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold text-slate-900">Suivi des Anomalies</h1>
                  <p className="text-sm text-slate-500 hidden lg:block">{anomaliesFiltrees.length} anomalie(s)</p>
                </div>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  'h-10 px-4 border rounded-lg font-medium flex items-center gap-2 transition-colors',
                  showFilters || filterStatut !== 'all' || filterPriorite !== 'all'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                )}
              >
                <Filter className="w-5 h-5" />
                <span className="hidden sm:inline">Filtrer</span>
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                <select
                  value={filterStatut}
                  onChange={(e) => setFilterStatut(e.target.value)}
                  className="h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">Tous les statuts</option>
                  {getAllStatuts().map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>

                <select
                  value={filterClient}
                  onChange={(e) => setFilterClient(e.target.value)}
                  className="h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">Tous les clients</option>
                  {clients.map(client => (
                    <option key={client} value={client}>{client}</option>
                  ))}
                </select>

                <select
                  value={filterPriorite}
                  onChange={(e) => setFilterPriorite(e.target.value)}
                  className="h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">Toutes priorités</option>
                  <option value="critique">Critique</option>
                  <option value="haute">Haute</option>
                  <option value="moyenne">Moyenne</option>
                  <option value="basse">Basse</option>
                </select>
              </div>
            )}
          </div>
        </header>

        <div className="px-4 py-4 lg:px-8 lg:py-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              onClick={() => setFilterStatut('devis_attente')}
              className={cn(
                "bg-white rounded-xl border p-4 text-left transition-all",
                filterStatut === 'devis_attente'
                  ? 'border-amber-300 ring-2 ring-amber-100'
                  : 'border-slate-200 hover:border-slate-300'
              )}
            >
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center mb-3">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats.devis_attente}</p>
              <p className="text-sm text-slate-500">Devis en attente</p>
            </button>

            <button
              onClick={() => setFilterStatut('devis_etabli')}
              className={cn(
                "bg-white rounded-xl border p-4 text-left transition-all",
                filterStatut === 'devis_etabli'
                  ? 'border-blue-300 ring-2 ring-blue-100'
                  : 'border-slate-200 hover:border-slate-300'
              )}
            >
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-3">
                <FileText className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats.devis_etabli}</p>
              <p className="text-sm text-slate-500">Devis établi</p>
            </button>

            <button
              onClick={() => setFilterStatut('commandé')}
              className={cn(
                "bg-white rounded-xl border p-4 text-left transition-all",
                filterStatut === 'commandé'
                  ? 'border-cyan-300 ring-2 ring-cyan-100'
                  : 'border-slate-200 hover:border-slate-300'
              )}
            >
              <div className="w-10 h-10 bg-cyan-50 rounded-lg flex items-center justify-center mb-3">
                <ShoppingCart className="w-5 h-5 text-cyan-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats.commandé}</p>
              <p className="text-sm text-slate-500">Commandé</p>
            </button>

            <button
              onClick={() => setFilterStatut('travaux_effectues')}
              className={cn(
                "bg-white rounded-xl border p-4 text-left transition-all",
                filterStatut === 'travaux_effectues'
                  ? 'border-emerald-300 ring-2 ring-emerald-100'
                  : 'border-slate-200 hover:border-slate-300'
              )}
            >
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center mb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats.travaux_effectues}</p>
              <p className="text-sm text-slate-500">Terminé</p>
            </button>
          </div>

          {/* Active filter */}
          {(filterStatut !== 'all' || filterPriorite !== 'all' || filterClient !== 'all') && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-slate-500">Filtres actifs :</span>
              {filterStatut !== 'all' && (
                <button
                  onClick={() => setFilterStatut('all')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-sm font-medium"
                >
                  {getAllStatuts().find(s => s.value === filterStatut)?.label}
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              {filterPriorite !== 'all' && (
                <button
                  onClick={() => setFilterPriorite('all')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-sm font-medium"
                >
                  Priorité: {filterPriorite}
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              {filterClient !== 'all' && (
                <button
                  onClick={() => setFilterClient('all')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-sm font-medium"
                >
                  {filterClient}
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Anomalies List */}
          {anomaliesFiltrees.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucune anomalie</h3>
              <p className="text-slate-500">Les anomalies signalées apparaîtront ici</p>
            </div>
          ) : (
            <div className="space-y-3">
              {anomaliesFiltrees.map((anomalie) => (
                <div
                  key={anomalie.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition-colors"
                >
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="font-semibold text-slate-900 truncate">{anomalie.clients?.nom}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{anomalie.sites?.nom}</span>
                      </div>
                      {anomalie.centrales && (
                        <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                          <Cpu className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>
                            {anomalie.centrales.type_equipement === 'automate' ? 'Automate' : 'Centrale'} {anomalie.centrales.numero} - {anomalie.centrales.modele}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {getPrioriteBadge(anomalie.priorite)}
                      {getStatutBadge(anomalie.statut)}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-slate-700 text-sm mb-4 line-clamp-2">
                    {anomalie.description_anomalie}
                  </p>

                  {/* Info & Actions */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-3 border-t border-slate-100">
                    <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(anomalie.date_constat).toLocaleDateString('fr-FR')}
                      </span>
                      {anomalie.montant_devis && (
                        <span className="flex items-center gap-1 font-semibold text-emerald-600">
                          <DollarSign className="w-3.5 h-3.5" />
                          {anomalie.montant_devis.toLocaleString('fr-FR')} €
                        </span>
                      )}
                      {anomalie.reference_devis && (
                        <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                          Réf: {anomalie.reference_devis}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2 items-center w-full sm:w-auto">
                      <select
                        value={anomalie.statut}
                        onChange={(e) => updateStatut(anomalie.id, e.target.value as Anomalie['statut'])}
                        className="flex-1 sm:flex-none h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
                      >
                        {getAllStatuts().map(statut => (
                          <option key={statut.value} value={statut.value}>
                            {statut.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => {
                          setSelectedAnomalie(anomalie)
                          setShowDetailModal(true)
                        }}
                        className="h-9 w-9 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        title="Voir détails"
                      >
                        <Eye className="w-4 h-4 text-slate-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNav userRole={profile?.role || 'technicien'} />

      {/* Detail Modal */}
      {showDetailModal && selectedAnomalie && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-slate-900">Détail de l'anomalie</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Client / Site */}
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Client / Site</p>
                <p className="text-lg font-semibold text-slate-900">
                  {selectedAnomalie.clients?.nom} - {selectedAnomalie.sites?.nom}
                </p>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {getPrioriteBadge(selectedAnomalie.priorite)}
                {getStatutBadge(selectedAnomalie.statut)}
              </div>

              {/* Description */}
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Description</p>
                <p className="text-slate-700">{selectedAnomalie.description_anomalie}</p>
              </div>

              {/* Devis info */}
              {(selectedAnomalie.montant_devis || selectedAnomalie.reference_devis) && (
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-slate-500 mb-2">Informations devis</p>
                  {selectedAnomalie.reference_devis && (
                    <p className="text-slate-700">Référence: {selectedAnomalie.reference_devis}</p>
                  )}
                  {selectedAnomalie.montant_devis && (
                    <p className="text-lg font-bold text-emerald-600">{selectedAnomalie.montant_devis.toLocaleString('fr-FR')} €</p>
                  )}
                </div>
              )}

              {/* Notes */}
              {selectedAnomalie.notes && (
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Notes</p>
                  <p className="text-slate-700">{selectedAnomalie.notes}</p>
                </div>
              )}

              {/* Historique */}
              {selectedAnomalie.historique && selectedAnomalie.historique.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-3">Historique</p>
                  <div className="space-y-2">
                    {selectedAnomalie.historique.map((entry: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-700">
                            <span className="font-medium">{entry.ancien_statut}</span>
                            {' → '}
                            <span className="font-medium text-emerald-600">{entry.nouveau_statut}</span>
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(entry.date).toLocaleString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                <div>
                  <p className="text-xs text-slate-400">Date de constat</p>
                  <p className="text-sm font-medium text-slate-900">
                    {new Date(selectedAnomalie.date_constat).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                {selectedAnomalie.date_devis && (
                  <div>
                    <p className="text-xs text-slate-400">Date devis</p>
                    <p className="text-sm font-medium text-slate-900">
                      {new Date(selectedAnomalie.date_devis).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                )}
                {selectedAnomalie.date_commande && (
                  <div>
                    <p className="text-xs text-slate-400">Date commande</p>
                    <p className="text-sm font-medium text-slate-900">
                      {new Date(selectedAnomalie.date_commande).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                )}
                {selectedAnomalie.date_travaux_effectues && (
                  <div>
                    <p className="text-xs text-slate-400">Travaux effectués</p>
                    <p className="text-sm font-medium text-slate-900">
                      {new Date(selectedAnomalie.date_travaux_effectues).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200">
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
