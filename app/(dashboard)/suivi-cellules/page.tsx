'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  Package,
  CheckCircle2,
  Clock,
  ShoppingCart,
  Filter,
  Download,
  Search,
  Building2,
  MapPin,
  Cpu
} from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Table } from '@/components/ui/Table'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'
import { AnimatedBackground } from '@/components/backgrounds/AnimatedBackground'

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
  // Relations
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

  // Filtres
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatut, setFilterStatut] = useState<string>('all')
  const [filterClient, setFilterClient] = useState<string>('all')
  const [filterUrgence, setFilterUrgence] = useState<string>('all')

  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()

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
      showToast('Erreur lors du chargement', 'error')
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

    // Mettre à jour les dates selon le statut
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
      showToast('Erreur lors de la mise à jour', 'error')
      return
    }

    showToast('Statut mis à jour', 'success')
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
        return <Badge variant="danger" size="sm">🔴 Dépassé</Badge>
      case 'urgent':
        return <Badge variant="danger" size="sm">⚠️ &lt; 1 mois</Badge>
      case 'attention':
        return <Badge variant="warning" size="sm">⏰ &lt; 2 mois</Badge>
      default:
        return <Badge variant="default" size="sm">✓ OK</Badge>
    }
  }

  function getStatutBadge(statut: CommandeCellule['statut']) {
    switch (statut) {
      case 'attente_commande':
        return <Badge variant="warning">En attente</Badge>
      case 'commandé':
        return <Badge variant="info">Commandé</Badge>
      case 'reçu':
        return <Badge variant="success">Reçu</Badge>
      case 'remplacé':
        return <Badge variant="default">Remplacé</Badge>
    }
  }

  // Filtrage
  const commandesFiltrees = commandes.filter(commande => {
    // Filtre par recherche
    const matchSearch = searchTerm === '' ||
      commande.clients?.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      commande.sites?.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      commande.gaz.toLowerCase().includes(searchTerm.toLowerCase()) ||
      commande.modele_detecteur?.toLowerCase().includes(searchTerm.toLowerCase())

    // Filtre par statut
    const matchStatut = filterStatut === 'all' || commande.statut === filterStatut

    // Filtre par client
    const matchClient = filterClient === 'all' || commande.clients?.nom === filterClient

    // Filtre par urgence
    let matchUrgence = true
    if (filterUrgence !== 'all') {
      const urgence = getUrgenceLevel(commande.date_remplacement_theorique)
      matchUrgence = urgence === filterUrgence
    }

    return matchSearch && matchStatut && matchClient && matchUrgence
  })

  // Liste unique des clients pour le filtre
  const clients = Array.from(new Set(commandes.map(c => c.clients?.nom).filter(Boolean)))

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen lg:flex relative overflow-hidden">
      <AnimatedBackground />
      <Sidebar
        userRole={profile?.role || 'technicien'}
        userName={profile?.full_name}
        onLogout={handleLogout}
      />

      <div className="min-h-screen lg:flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="glass-strong border-b border-white/20 px-3 sm:px-4 lg:px-8 py-2 sm:py-3 lg:py-6 sticky top-0 z-20 shadow-lg mt-16 lg:mt-0">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0"
          >
            <div>
              <h1 className="text-base sm:text-2xl lg:text-4xl font-black text-gradient drop-shadow-lg flex items-center gap-3">
                <Package className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10" />
                Suivi des Cellules
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-gray-700 mt-0.5 sm:mt-2 font-medium">
                Gestion des commandes et remplacements de cellules
              </p>
            </div>
          </motion.div>
        </header>

        <main className="flex-1 overflow-y-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-10">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-strong rounded-2xl p-4 sm:p-6 shadow-xl ring-2 ring-gray-300/30"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-xs text-gray-600 mb-1">Total</p>
              <p className="text-2xl font-black text-gray-900">{stats.total}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-strong rounded-2xl p-4 sm:p-6 shadow-xl ring-2 ring-orange-300/30"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-xs text-gray-600 mb-1">En attente</p>
              <p className="text-2xl font-black text-gray-900">{stats.attente_commande}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-strong rounded-2xl p-4 sm:p-6 shadow-xl ring-2 ring-cyan-300/30"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-xs text-gray-600 mb-1">Commandé</p>
              <p className="text-2xl font-black text-gray-900">{stats.commandé}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-strong rounded-2xl p-4 sm:p-6 shadow-xl ring-2 ring-red-300/30"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-xs text-gray-600 mb-1">Alertes &lt; 2 mois</p>
              <p className="text-2xl font-black text-gray-900">{stats.alertes_2_mois}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-strong rounded-2xl p-4 sm:p-6 shadow-xl ring-2 ring-red-500/50"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center animate-pulse">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-xs text-gray-600 mb-1">Critique &lt; 1 mois</p>
              <p className="text-2xl font-black text-red-600">{stats.alertes_1_mois}</p>
            </motion.div>
          </div>

          {/* Filtres et recherche */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-strong rounded-2xl p-4 sm:p-6 shadow-xl mb-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Rechercher (client, site, gaz...)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select
                value={filterStatut}
                onChange={(e) => setFilterStatut(e.target.value)}
              >
                <option value="all">Tous les statuts</option>
                <option value="attente_commande">En attente</option>
                <option value="commandé">Commandé</option>
                <option value="reçu">Reçu</option>
                <option value="remplacé">Remplacé</option>
              </Select>

              <Select
                value={filterClient}
                onChange={(e) => setFilterClient(e.target.value)}
              >
                <option value="all">Tous les clients</option>
                {clients.map(client => (
                  <option key={client} value={client}>{client}</option>
                ))}
              </Select>

              <Select
                value={filterUrgence}
                onChange={(e) => setFilterUrgence(e.target.value)}
              >
                <option value="all">Toutes urgences</option>
                <option value="critique">🔴 Dépassé</option>
                <option value="urgent">⚠️ &lt; 1 mois</option>
                <option value="attention">⏰ &lt; 2 mois</option>
                <option value="normal">✓ OK</option>
              </Select>
            </div>
          </motion.div>

          {/* Tableau des commandes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-strong rounded-2xl p-4 sm:p-6 shadow-xl overflow-hidden"
          >
            {commandesFiltrees.length === 0 ? (
              <EmptyState
                icon={Package}
                title="Aucune commande"
                description="Les commandes de cellules apparaîtront ici"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-xs font-bold text-gray-700 uppercase">Urgence</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-gray-700 uppercase">Client</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-gray-700 uppercase">Site</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-gray-700 uppercase">Centrale</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-gray-700 uppercase">Détecteur</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-gray-700 uppercase">Gaz</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-gray-700 uppercase">Gamme</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-gray-700 uppercase">Date théorique</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-gray-700 uppercase">Statut</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-gray-700 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commandesFiltrees.map((commande, index) => {
                      const urgence = getUrgenceLevel(commande.date_remplacement_theorique)
                      return (
                        <motion.tr
                          key={commande.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className="border-b border-gray-100 hover:bg-gray-50/50 transition"
                        >
                          <td className="py-3 px-4">
                            {getUrgenceBadge(urgence)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-gray-400" />
                              <span className="font-medium text-sm">{commande.clients?.nom}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">{commande.sites?.nom}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {commande.centrales && (
                              <div className="flex items-center gap-2">
                                <Cpu className="w-4 h-4 text-gray-400" />
                                <span className="text-sm">
                                  {commande.centrales.type_equipement === 'automate' ? 'Auto.' : 'Cent.'} {commande.centrales.numero} - {commande.centrales.modele}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm font-medium">{commande.modele_detecteur}</span>
                            {commande.detecteurs_gaz && (
                              <span className="text-xs text-gray-500 block">
                                Dét. {commande.detecteurs_gaz.numero} {commande.detecteurs_gaz.ligne && `- ${commande.detecteurs_gaz.ligne}`}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="info" size="sm">{commande.gaz}</Badge>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm">{commande.gamme_mesure || '-'}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-sm font-medium ${
                              urgence === 'critique' ? 'text-red-600' :
                              urgence === 'urgent' ? 'text-orange-600' :
                              urgence === 'attention' ? 'text-yellow-600' :
                              'text-gray-600'
                            }`}>
                              {new Date(commande.date_remplacement_theorique).toLocaleDateString('fr-FR')}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {getStatutBadge(commande.statut)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              {commande.statut === 'attente_commande' && (
                                <Button
                                  size="sm"
                                  onClick={() => updateStatut(commande.id, 'commandé')}
                                >
                                  Commander
                                </Button>
                              )}
                              {commande.statut === 'commandé' && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => updateStatut(commande.id, 'reçu')}
                                >
                                  Réceptionner
                                </Button>
                              )}
                              {commande.statut === 'reçu' && (
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => updateStatut(commande.id, 'remplacé')}
                                >
                                  Marquer remplacé
                                </Button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
