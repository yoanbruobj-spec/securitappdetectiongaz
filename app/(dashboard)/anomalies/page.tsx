'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
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
  Plus,
  Eye,
  Edit,
  X,
  Search
} from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { TextArea } from '@/components/ui/TextArea'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'
import { AnimatedBackground } from '@/components/backgrounds/AnimatedBackground'
import { EditAnomalieModal } from '@/components/anomalies/EditAnomalieModal'

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
  // Relations
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

  const [showModal, setShowModal] = useState(false)
  const [selectedAnomalie, setSelectedAnomalie] = useState<Anomalie | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  // Filtres
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatut, setFilterStatut] = useState<string>('all')
  const [filterClient, setFilterClient] = useState<string>('all')
  const [filterPriorite, setFilterPriorite] = useState<string>('all')

  const router = useRouter()
  const supabase = createClient()
  const { success, error: showError } = useToast()

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
      showError('Erreur lors du chargement')
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
      showError('Erreur lors de la mise à jour')
      return
    }

    success('Statut mis à jour')
    loadAnomalies()
  }

  function getStatutBadge(statut: Anomalie['statut']) {
    const badges = {
      devis_attente: <Badge variant="warning">En attente de devis</Badge>,
      devis_etabli: <Badge variant="info">Devis établi</Badge>,
      devis_soumis: <Badge variant="info">Devis soumis</Badge>,
      attente_commande: <Badge variant="warning">Attente commande</Badge>,
      commandé: <Badge variant="primary">Commandé</Badge>,
      travaux_planifies: <Badge variant="success">Travaux planifiés</Badge>,
      travaux_effectues: <Badge variant="default">Travaux effectués</Badge>
    }
    return badges[statut]
  }

  function getPrioriteBadge(priorite: Anomalie['priorite']) {
    const badges = {
      basse: <Badge variant="default" size="sm">Basse</Badge>,
      moyenne: <Badge variant="info" size="sm">Moyenne</Badge>,
      haute: <Badge variant="warning" size="sm">Haute</Badge>,
      critique: <Badge variant="danger" size="sm">🔴 Critique</Badge>
    }
    return badges[priorite]
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
      anomalie.clients?.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      anomalie.sites?.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      anomalie.description_anomalie.toLowerCase().includes(searchTerm.toLowerCase())

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
                <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10" />
                Suivi des Anomalies
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-gray-700 mt-0.5 sm:mt-2 font-medium">
                Gestion complète du workflow des anomalies
              </p>
            </div>
          </motion.div>
        </header>

        <main className="flex-1 overflow-y-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-10">
          {/* Stats Cards - Workflow complet */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-strong rounded-2xl p-4 shadow-xl ring-2 ring-orange-300/30 cursor-pointer"
              onClick={() => setFilterStatut('devis_attente')}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-xs text-gray-600 mb-1">Devis en attente</p>
              <p className="text-2xl font-black text-gray-900">{stats.devis_attente}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-strong rounded-2xl p-4 shadow-xl ring-2 ring-blue-300/30 cursor-pointer"
              onClick={() => setFilterStatut('devis_etabli')}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-xs text-gray-600 mb-1">Devis établi</p>
              <p className="text-2xl font-black text-gray-900">{stats.devis_etabli}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-strong rounded-2xl p-4 shadow-xl ring-2 ring-cyan-300/30 cursor-pointer"
              onClick={() => setFilterStatut('commandé')}
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
              className="glass-strong rounded-2xl p-4 shadow-xl ring-2 ring-emerald-300/30 cursor-pointer"
              onClick={() => setFilterStatut('travaux_effectues')}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-xs text-gray-600 mb-1">Travaux effectués</p>
              <p className="text-2xl font-black text-gray-900">{stats.travaux_effectues}</p>
            </motion.div>
          </div>

          {/* Filtres */}
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
                    placeholder="Rechercher..."
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
                <option value="devis_attente">Devis en attente</option>
                <option value="devis_etabli">Devis établi</option>
                <option value="devis_soumis">Devis soumis</option>
                <option value="attente_commande">Attente commande</option>
                <option value="commandé">Commandé</option>
                <option value="travaux_planifies">Travaux planifiés</option>
                <option value="travaux_effectues">Travaux effectués</option>
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
                value={filterPriorite}
                onChange={(e) => setFilterPriorite(e.target.value)}
              >
                <option value="all">Toutes priorités</option>
                <option value="critique">🔴 Critique</option>
                <option value="haute">Haute</option>
                <option value="moyenne">Moyenne</option>
                <option value="basse">Basse</option>
              </Select>
            </div>
          </motion.div>

          {/* Liste des anomalies */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-strong rounded-2xl p-4 sm:p-6 shadow-xl"
          >
            {anomaliesFiltrees.length === 0 ? (
              <EmptyState
                icon={AlertTriangle}
                title="Aucune anomalie"
                description="Les anomalies signalées apparaîtront ici"
              />
            ) : (
              <div className="space-y-4">
                {anomaliesFiltrees.map((anomalie, index) => (
                  <motion.div
                    key={anomalie.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="glass rounded-xl p-4 sm:p-6 ring-1 ring-gray-300/30 hover:ring-emerald-400/50 hover:shadow-xl transition-all"
                  >
                    {/* En-tête */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span className="font-bold text-lg">{anomalie.clients?.nom}</span>
                          <MapPin className="w-4 h-4 text-gray-400 ml-2" />
                          <span className="text-gray-600">{anomalie.sites?.nom}</span>
                        </div>
                        {anomalie.centrales && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Cpu className="w-4 h-4" />
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
                    <p className="text-gray-700 mb-4 line-clamp-2">
                      {anomalie.description_anomalie}
                    </p>

                    {/* Infos et actions */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          📅 {new Date(anomalie.date_constat).toLocaleDateString('fr-FR')}
                        </span>
                        {anomalie.montant_devis && (
                          <span className="flex items-center gap-1 font-semibold text-emerald-600">
                            <DollarSign className="w-4 h-4" />
                            {anomalie.montant_devis.toLocaleString('fr-FR')} €
                          </span>
                        )}
                        {anomalie.reference_devis && (
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            Réf: {anomalie.reference_devis}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2 items-center">
                        <div className="flex-1">
                          <select
                            value={anomalie.statut}
                            onChange={(e) => updateStatut(anomalie.id, e.target.value as Anomalie['statut'])}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                          >
                            {getAllStatuts().map(statut => (
                              <option key={statut.value} value={statut.value}>
                                {statut.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => {
                            setSelectedAnomalie(anomalie)
                            setShowModal(true)
                          }}
                          title="Modifier l'anomalie"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setSelectedAnomalie(anomalie)
                            setShowHistory(true)
                          }}
                          title="Voir l'historique"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </main>
      </div>

      {/* Modal Historique */}
      <AnimatePresence>
        {showHistory && selectedAnomalie && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowHistory(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-black text-gradient">Détail de l'anomalie</h2>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Client / Site</p>
                  <p className="text-lg font-bold">{selectedAnomalie.clients?.nom} - {selectedAnomalie.sites?.nom}</p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Description</p>
                  <p className="text-gray-700">{selectedAnomalie.description_anomalie}</p>
                </div>

                {selectedAnomalie.notes && (
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Notes</p>
                    <p className="text-gray-700">{selectedAnomalie.notes}</p>
                  </div>
                )}

                {selectedAnomalie.historique && selectedAnomalie.historique.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-3">Historique</p>
                    <div className="space-y-2">
                      {selectedAnomalie.historique.map((entry: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5"></div>
                          <div className="flex-1">
                            <p className="text-sm">
                              <span className="font-semibold">{entry.ancien_statut}</span>
                              {' → '}
                              <span className="font-semibold text-emerald-600">{entry.nouveau_statut}</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(entry.date).toLocaleString('fr-FR')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Édition */}
      <EditAnomalieModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        anomalie={selectedAnomalie}
        onSuccess={loadAnomalies}
      />
    </div>
  )
}
