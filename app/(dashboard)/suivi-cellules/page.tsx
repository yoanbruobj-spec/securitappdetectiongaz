'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  AlertTriangle,
  Package,
  CheckCircle2,
  Clock,
  ShoppingCart,
  Filter,
  Search,
  Building2,
  MapPin,
  Cpu,
  ArrowLeft,
  X
} from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface CommandeCellule {
  id: string
  detecteur_gaz_id?: string
  portable_gaz_id?: string
  client_id: string
  site_id: string
  centrale_id?: string
  modele_detecteur?: string
  gaz: string
  gamme_mesure?: string
  numero_serie_detecteur?: string
  date_remplacement_theorique: string
  date_alerte: string
  date_commande?: string
  date_reception?: string
  date_remplacement_effectif?: string
  statut: 'attente_commande' | 'commandé' | 'reçu' | 'remplacé'
  fournisseur?: string
  reference_commande?: string
  quantite: number
  prix_unitaire?: number
  notes?: string
  created_at: string
  updated_at: string
  clients?: { nom: string }
  sites?: { nom: string }
  centrales?: { modele: string; numero: number; type_equipement?: string }
  detecteurs_gaz?: { numero: number; ligne?: string }
  portables_gaz?: { gaz: string }
}

interface Stats {
  total: number
  attente_commande: number
  commandé: number
  reçu: number
  alertes_2_mois: number
  alertes_1_mois: number
}

export default function SuiviCellulesPage() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [commandes, setCommandes] = useState<CommandeCellule[]>([])
  const [stats, setStats] = useState<Stats>({
    total: 0,
    attente_commande: 0,
    commandé: 0,
    reçu: 0,
    alertes_2_mois: 0,
    alertes_1_mois: 0
  })

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatut, setFilterStatut] = useState<string>('all')
  const [filterUrgence, setFilterUrgence] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
    loadCommandes()
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

  async function loadCommandes() {
    const { data, error } = await supabase
      .from('commandes_cellules')
      .select(`
        *,
        clients (nom),
        sites (nom),
        centrales (modele, numero, type_equipement),
        detecteurs_gaz (numero, ligne),
        portables_gaz (gaz)
      `)
      .order('date_remplacement_theorique', { ascending: true })

    if (error) {
      console.error('Erreur chargement commandes:', error)
      return
    }

    setCommandes(data || [])
    calculateStats(data || [])
  }

  function calculateStats(data: CommandeCellule[]) {
    const now = new Date()
    const twoMonthsFromNow = new Date()
    twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2)
    const oneMonthFromNow = new Date()
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1)

    const stats: Stats = {
      total: data.length,
      attente_commande: data.filter(c => c.statut === 'attente_commande').length,
      commandé: data.filter(c => c.statut === 'commandé').length,
      reçu: data.filter(c => c.statut === 'reçu').length,
      alertes_2_mois: data.filter(c => {
        const dateRemplacement = new Date(c.date_remplacement_theorique)
        return dateRemplacement <= twoMonthsFromNow && c.statut !== 'remplacé'
      }).length,
      alertes_1_mois: data.filter(c => {
        const dateRemplacement = new Date(c.date_remplacement_theorique)
        return dateRemplacement <= oneMonthFromNow && c.statut !== 'remplacé'
      }).length
    }

    setStats(stats)
  }

  async function updateStatut(id: string, newStatut: CommandeCellule['statut']) {
    const updates: any = { statut: newStatut }

    if (newStatut === 'commandé' && !commandes.find(c => c.id === id)?.date_commande) {
      updates.date_commande = new Date().toISOString().split('T')[0]
    }
    if (newStatut === 'reçu' && !commandes.find(c => c.id === id)?.date_reception) {
      updates.date_reception = new Date().toISOString().split('T')[0]
    }
    if (newStatut === 'remplacé' && !commandes.find(c => c.id === id)?.date_remplacement_effectif) {
      updates.date_remplacement_effectif = new Date().toISOString().split('T')[0]
    }

    const { error } = await supabase
      .from('commandes_cellules')
      .update(updates)
      .eq('id', id)

    if (error) {
      alert('Erreur lors de la mise à jour')
      return
    }

    loadCommandes()
  }

  function getUrgenceLevel(dateRemplacement: string): 'critique' | 'urgent' | 'attention' | 'normal' {
    const now = new Date()
    const date = new Date(dateRemplacement)
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return 'critique'
    if (diffDays <= 30) return 'urgent'
    if (diffDays <= 60) return 'attention'
    return 'normal'
  }

  function getUrgenceBadge(urgence: ReturnType<typeof getUrgenceLevel>) {
    switch (urgence) {
      case 'critique':
        return <Badge variant="danger" size="sm">Dépassé</Badge>
      case 'urgent':
        return <Badge variant="danger" size="sm">&lt; 1 mois</Badge>
      case 'attention':
        return <Badge variant="warning" size="sm">&lt; 2 mois</Badge>
      default:
        return <Badge variant="success" size="sm">OK</Badge>
    }
  }

  function getStatutBadge(statut: CommandeCellule['statut']) {
    switch (statut) {
      case 'attente_commande':
        return <Badge variant="warning" size="sm">En attente</Badge>
      case 'commandé':
        return <Badge variant="info" size="sm">Commandé</Badge>
      case 'reçu':
        return <Badge variant="success" size="sm">Reçu</Badge>
      case 'remplacé':
        return <Badge variant="default" size="sm">Remplacé</Badge>
    }
  }

  const commandesFiltrees = commandes.filter(commande => {
    const matchSearch = searchTerm === '' ||
      commande.clients?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      commande.sites?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      commande.gaz?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      commande.modele_detecteur?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchStatut = filterStatut === 'all' || commande.statut === filterStatut

    let matchUrgence = true
    if (filterUrgence !== 'all') {
      const urgence = getUrgenceLevel(commande.date_remplacement_theorique)
      matchUrgence = urgence === filterUrgence
    }

    return matchSearch && matchStatut && matchUrgence
  })

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
                  <h1 className="text-xl lg:text-2xl font-bold text-slate-900">Suivi Cellules</h1>
                  <p className="text-sm text-slate-500 hidden lg:block">{commandesFiltrees.length} commande(s)</p>
                </div>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  'h-10 px-4 border rounded-lg font-medium flex items-center gap-2 transition-colors',
                  showFilters || filterStatut !== 'all' || filterUrgence !== 'all'
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
              <div className="grid grid-cols-2 gap-3 mt-4">
                <select
                  value={filterStatut}
                  onChange={(e) => setFilterStatut(e.target.value)}
                  className="h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="attente_commande">En attente</option>
                  <option value="commandé">Commandé</option>
                  <option value="reçu">Reçu</option>
                  <option value="remplacé">Remplacé</option>
                </select>

                <select
                  value={filterUrgence}
                  onChange={(e) => setFilterUrgence(e.target.value)}
                  className="h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">Toutes urgences</option>
                  <option value="critique">Dépassé</option>
                  <option value="urgent">&lt; 1 mois</option>
                  <option value="attention">&lt; 2 mois</option>
                  <option value="normal">OK</option>
                </select>
              </div>
            )}
          </div>
        </header>

        <div className="px-4 py-4 lg:px-8 lg:py-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-3">
                <Package className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              <p className="text-sm text-slate-500">Total</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center mb-3">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats.attente_commande}</p>
              <p className="text-sm text-slate-500">En attente</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="w-10 h-10 bg-cyan-50 rounded-lg flex items-center justify-center mb-3">
                <ShoppingCart className="w-5 h-5 text-cyan-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats.commandé}</p>
              <p className="text-sm text-slate-500">Commandé</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center mb-3">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats.alertes_2_mois}</p>
              <p className="text-sm text-slate-500">&lt; 2 mois</p>
            </div>

            <div className="bg-white rounded-xl border border-red-200 p-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mb-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-600">{stats.alertes_1_mois}</p>
              <p className="text-sm text-slate-500">Critique</p>
            </div>
          </div>

          {/* Active filters */}
          {(filterStatut !== 'all' || filterUrgence !== 'all') && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-slate-500">Filtres actifs :</span>
              {filterStatut !== 'all' && (
                <button
                  onClick={() => setFilterStatut('all')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-sm font-medium"
                >
                  {filterStatut}
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              {filterUrgence !== 'all' && (
                <button
                  onClick={() => setFilterUrgence('all')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-sm font-medium"
                >
                  Urgence: {filterUrgence}
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* List */}
          {commandesFiltrees.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucune commande</h3>
              <p className="text-slate-500">Les commandes de cellules apparaîtront ici</p>
            </div>
          ) : (
            <div className="space-y-3">
              {commandesFiltrees.map((commande) => {
                const urgence = getUrgenceLevel(commande.date_remplacement_theorique)
                return (
                  <div
                    key={commande.id}
                    className={cn(
                      "bg-white rounded-xl border p-4",
                      urgence === 'critique' ? 'border-red-200' :
                      urgence === 'urgent' ? 'border-orange-200' :
                      'border-slate-200'
                    )}
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span className="font-semibold text-slate-900 truncate">{commande.clients?.nom}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{commande.sites?.nom}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {getUrgenceBadge(urgence)}
                        {getStatutBadge(commande.statut)}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-sm">
                      {commande.centrales && (
                        <div>
                          <p className="text-slate-400 text-xs">Centrale</p>
                          <p className="text-slate-700">
                            {commande.centrales.type_equipement === 'automate' ? 'Auto.' : 'Cent.'} {commande.centrales.numero}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-slate-400 text-xs">Gaz</p>
                        <p className="text-slate-700 font-medium">{commande.gaz}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs">Modèle</p>
                        <p className="text-slate-700">{commande.modele_detecteur || '-'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs">Date théorique</p>
                        <p className={cn(
                          "font-medium",
                          urgence === 'critique' ? 'text-red-600' :
                          urgence === 'urgent' ? 'text-orange-600' :
                          'text-slate-700'
                        )}>
                          {new Date(commande.date_remplacement_theorique).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t border-slate-100">
                      {commande.statut === 'attente_commande' && (
                        <button
                          onClick={() => updateStatut(commande.id, 'commandé')}
                          className="h-9 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          Commander
                        </button>
                      )}
                      {commande.statut === 'commandé' && (
                        <button
                          onClick={() => updateStatut(commande.id, 'reçu')}
                          className="h-9 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          Réceptionner
                        </button>
                      )}
                      {commande.statut === 'reçu' && (
                        <button
                          onClick={() => updateStatut(commande.id, 'remplacé')}
                          className="h-9 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          Marquer remplacé
                        </button>
                      )}
                      {commande.statut === 'remplacé' && (
                        <span className="h-9 px-4 bg-slate-100 text-slate-500 rounded-lg text-sm font-medium flex items-center">
                          Terminé
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      <BottomNav userRole={profile?.role || 'technicien'} />
    </div>
  )
}
