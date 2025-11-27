'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft,
  Building2,
  MapPin,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Phone,
  Mail,
  Calendar,
  X,
  Search,
  FileText,
  Download,
  Loader2
} from 'lucide-react'
import { generateInterventionPDF } from '@/lib/pdf/generateInterventionPDF'
import { generateInterventionPortablePDF } from '@/lib/pdf/generateInterventionPortablePDF'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface Client {
  id: string
  nom: string
  adresse_siege: string
  ville: string
  code_postal: string
  telephone: string
  email: string
  created_at: string
}

interface Site {
  id: string
  client_id: string
  nom: string
  adresse: string
  ville: string
  code_postal: string
}

interface Intervention {
  id: string
  date_intervention: string
  type: string
  statut: string
  type_rapport?: string
}

export default function ClientsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [clients, setClients] = useState<Client[]>([])
  const [sites, setSites] = useState<{ [key: string]: Site[] }>({})
  const [interventions, setInterventions] = useState<{ [key: string]: Intervention[] }>({})
  const [loading, setLoading] = useState(true)
  const [showClientModal, setShowClientModal] = useState(false)
  const [showSiteModal, setShowSiteModal] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set())
  const [expandedSites, setExpandedSites] = useState<Set<string>>(new Set())
  const [userRole, setUserRole] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [generatingPDFId, setGeneratingPDFId] = useState<string | null>(null)

  const [clientForm, setClientForm] = useState({
    nom: '',
    adresse_siege: '',
    ville: '',
    code_postal: '',
    telephone: '',
    email: '',
  })

  const [siteForm, setSiteForm] = useState({
    nom: '',
    adresse: '',
    ville: '',
    code_postal: '',
  })

  useEffect(() => {
    checkAuth()
    loadClients()
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

    if (profileData) {
      setUserRole(profileData.role)
      setProfile(profileData)
    }
  }

  async function loadClients() {
    setLoading(true)
    const { data } = await supabase
      .from('clients')
      .select('*')
      .order('nom')

    if (data) {
      setClients(data)
      data.forEach(client => loadSites(client.id))
    }
    setLoading(false)
  }

  async function loadSites(clientId: string) {
    const { data } = await supabase
      .from('sites')
      .select('*')
      .eq('client_id', clientId)
      .order('nom')

    if (data) {
      setSites(prev => ({ ...prev, [clientId]: data }))
      data.forEach(site => loadInterventions(site.id))
    }
  }

  async function loadInterventions(siteId: string) {
    const { data } = await supabase
      .from('interventions')
      .select('id, date_intervention, type, statut, type_rapport')
      .eq('site_id', siteId)
      .order('date_intervention', { ascending: false })

    if (data) {
      setInterventions(prev => ({ ...prev, [siteId]: data }))
    }
  }

  function toggleClient(clientId: string) {
    const newExpanded = new Set(expandedClients)
    if (newExpanded.has(clientId)) {
      newExpanded.delete(clientId)
    } else {
      newExpanded.add(clientId)
    }
    setExpandedClients(newExpanded)
  }

  function toggleSite(siteId: string) {
    const newExpanded = new Set(expandedSites)
    if (newExpanded.has(siteId)) {
      newExpanded.delete(siteId)
    } else {
      newExpanded.add(siteId)
    }
    setExpandedSites(newExpanded)
  }

  async function handleSaveClient() {
    if (!clientForm.nom) return

    const { error } = await supabase
      .from('clients')
      .insert([clientForm])

    if (error) {
      console.error('Erreur lors de la création du client:', error)
      alert('Erreur: ' + error.message)
    } else {
      setShowClientModal(false)
      setClientForm({ nom: '', adresse_siege: '', ville: '', code_postal: '', telephone: '', email: '' })
      loadClients()
    }
  }

  async function handleSaveSite() {
    if (!siteForm.nom || !selectedClientId) return

    const { error } = await supabase
      .from('sites')
      .insert([{ ...siteForm, client_id: selectedClientId }])

    if (error) {
      console.error('Erreur lors de la création du site:', error)
      alert('Erreur: ' + error.message)
    } else {
      setShowSiteModal(false)
      setSiteForm({ nom: '', adresse: '', ville: '', code_postal: '' })
      loadSites(selectedClientId)
      setSelectedClientId(null)
    }
  }

  async function handleDeleteClient(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce client et tous ses sites ?')) return

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)

    if (!error) {
      loadClients()
    }
  }

  async function handleDeleteSite(id: string, clientId: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce site ?')) return

    const { error } = await supabase
      .from('sites')
      .delete()
      .eq('id', id)

    if (!error) {
      loadSites(clientId)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function handleGeneratePDF(interventionId: string, typeRapport?: string) {
    try {
      setGeneratingPDFId(interventionId)

      // Charger l'intervention complète
      const { data: interventionData } = await supabase
        .from('interventions')
        .select(`
          *,
          sites (
            nom,
            adresse,
            ville,
            client_id,
            clients (nom)
          )
        `)
        .eq('id', interventionId)
        .single()

      if (!interventionData) {
        alert('Intervention non trouvée')
        return
      }

      if (typeRapport === 'portable') {
        // Générer PDF portable
        const { data: portablesData } = await supabase
          .from('portables')
          .select(`
            *,
            portables_gaz (*),
            portables_verifications (*)
          `)
          .eq('intervention_id', interventionId)

        await generateInterventionPortablePDF({
          intervention: interventionData,
          portables: portablesData || [],
          site: interventionData.sites,
          client: interventionData.sites?.clients,
        })
      } else {
        // Générer PDF fixe
        const { data: centralesData } = await supabase
          .from('centrales')
          .select('*')
          .eq('intervention_id', interventionId)

        const centralesAvecDetecteurs = []

        for (const centrale of centralesData || []) {
          const { data: detecteursGaz } = await supabase
            .from('detecteurs_gaz')
            .select('*')
            .eq('centrale_id', centrale.id)

          const detecteursGazAvecSeuils = []
          for (const detecteur of detecteursGaz || []) {
            const { data: seuils } = await supabase
              .from('seuils_alarme')
              .select('*')
              .eq('detecteur_gaz_id', detecteur.id)

            detecteursGazAvecSeuils.push({
              ...detecteur,
              seuils: seuils || []
            })
          }

          const { data: detecteursFlamme } = await supabase
            .from('detecteurs_flamme')
            .select('*')
            .eq('centrale_id', centrale.id)

          const { data: observations } = await supabase
            .from('observations_centrales')
            .select('*')
            .eq('centrale_id', centrale.id)
            .single()

          centralesAvecDetecteurs.push({
            ...centrale,
            detecteurs_gaz: detecteursGazAvecSeuils,
            detecteurs_flamme: detecteursFlamme || [],
            travaux_effectues: observations?.travaux_effectues,
            anomalies: observations?.anomalies_constatees,
            recommandations: observations?.recommandations,
            pieces_remplacees: observations?.pieces_remplacees,
          })
        }

        const { data: photosData } = await supabase
          .from('photos')
          .select('*')
          .eq('intervention_id', interventionId)

        await generateInterventionPDF({
          intervention: interventionData,
          centrales: centralesAvecDetecteurs,
          site: interventionData.sites,
          client: interventionData.sites?.clients,
          photos: photosData || [],
        })
      }

    } catch (error) {
      console.error('Erreur génération PDF:', error)
      alert('Erreur lors de la génération du PDF')
    } finally {
      setGeneratingPDFId(null)
    }
  }

  // Filter clients
  const filteredClients = clients.filter(client => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      client.nom.toLowerCase().includes(query) ||
      client.ville?.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query)
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
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push(userRole === 'admin' ? '/admin' : '/technicien')}
                  className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100"
                >
                  <ArrowLeft className="w-5 h-5 text-slate-600" />
                </button>
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold text-slate-900">Clients</h1>
                  <p className="text-sm text-slate-500 hidden lg:block">{clients.length} client(s)</p>
                </div>
              </div>
              <button
                onClick={() => setShowClientModal(true)}
                className="h-10 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Nouveau client</span>
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>
        </header>

        <div className="px-4 py-4 lg:px-8 lg:py-6">
          {filteredClients.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucun client</h3>
              <p className="text-slate-500 mb-6">
                {searchQuery ? 'Aucun résultat pour votre recherche' : 'Créez votre premier client'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowClientModal(true)}
                  className="inline-flex items-center gap-2 h-10 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Nouveau client
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredClients.map(client => (
                <div key={client.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  {/* Client Header */}
                  <div
                    onClick={() => toggleClient(client.id)}
                    className="w-full flex items-center gap-3 px-4 py-4 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  >
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center transition-transform',
                      expandedClients.has(client.id) ? 'bg-emerald-50' : 'bg-slate-100'
                    )}>
                      {expandedClients.has(client.id) ? (
                        <ChevronDown className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-emerald-500" />
                        <h3 className="font-semibold text-slate-900 truncate">{client.nom}</h3>
                      </div>
                      <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5" />
                        {client.adresse_siege ? `${client.adresse_siege}, ` : ''}{client.code_postal} {client.ville}
                      </p>
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Badge variant="info" size="sm">
                        {sites[client.id]?.length || 0} site(s)
                      </Badge>
                      <button
                        onClick={() => {
                          setSelectedClientId(client.id)
                          setShowSiteModal(true)
                        }}
                        className="h-8 w-8 flex items-center justify-center text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      {userRole === 'admin' && (
                        <button
                          onClick={() => handleDeleteClient(client.id)}
                          className="h-8 w-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Client Contact Info */}
                  {expandedClients.has(client.id) && (
                    <div className="px-4 pb-2">
                      <div className="flex flex-wrap gap-4 text-sm text-slate-500 pl-13">
                        {client.telephone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" />
                            {client.telephone}
                          </span>
                        )}
                        {client.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5" />
                            {client.email}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Sites */}
                  {expandedClients.has(client.id) && sites[client.id] && (
                    <div className="border-t border-slate-100 bg-slate-50/50">
                      {sites[client.id].length === 0 ? (
                        <div className="px-4 py-6 text-center text-slate-500 text-sm">
                          Aucun site pour ce client
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {sites[client.id].map(site => (
                            <div key={site.id}>
                              <button
                                onClick={() => toggleSite(site.id)}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white transition-colors text-left"
                              >
                                <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center ml-6">
                                  {expandedSites.has(site.id) ? (
                                    <ChevronDown className="w-4 h-4 text-slate-400" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-slate-400" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-slate-900">{site.nom}</p>
                                  <p className="text-sm text-slate-500">
                                    {site.adresse}, {site.code_postal} {site.ville}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                  <span className="text-xs text-slate-400">
                                    {interventions[site.id]?.length || 0} intervention(s)
                                  </span>
                                  {userRole === 'admin' && (
                                    <button
                                      onClick={() => handleDeleteSite(site.id, client.id)}
                                      className="h-7 w-7 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </button>

                              {/* Interventions */}
                              {expandedSites.has(site.id) && interventions[site.id] && (
                                <div className="bg-white border-t border-slate-100 px-4 py-3 ml-14">
                                  {interventions[site.id].length === 0 ? (
                                    <p className="text-sm text-slate-400">Aucune intervention</p>
                                  ) : (
                                    <div className="space-y-2">
                                      {interventions[site.id].map(intervention => (
                                        <div
                                          key={intervention.id}
                                          className="flex items-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                                        >
                                          <button
                                            onClick={() => {
                                              const path = intervention.type_rapport === 'portable'
                                                ? `/intervention-portable/${intervention.id}`
                                                : `/intervention/${intervention.id}`
                                              router.push(path)
                                            }}
                                            className="flex-1 flex items-center justify-between text-left"
                                          >
                                            <div className="flex items-center gap-2">
                                              <FileText className="w-4 h-4 text-slate-400" />
                                              <div>
                                                <p className="text-sm font-medium text-slate-900">
                                                  {new Date(intervention.date_intervention).toLocaleDateString('fr-FR')}
                                                </p>
                                                <p className="text-xs text-slate-500 capitalize">
                                                  {intervention.type?.replace(/_/g, ' ')}
                                                </p>
                                              </div>
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
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleGeneratePDF(intervention.id, intervention.type_rapport)
                                            }}
                                            disabled={generatingPDFId === intervention.id}
                                            className="h-8 w-8 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                                            title="Télécharger le PDF"
                                          >
                                            {generatingPDFId === intervention.id ? (
                                              <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                              <Download className="w-4 h-4" />
                                            )}
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNav userRole={userRole as any} />

      {/* Modal Nouveau Client */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Nouveau client</h2>
              <button
                onClick={() => {
                  setShowClientModal(false)
                  setClientForm({ nom: '', adresse_siege: '', ville: '', code_postal: '', telephone: '', email: '' })
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom *</label>
                <input
                  type="text"
                  value={clientForm.nom}
                  onChange={e => setClientForm({ ...clientForm, nom: e.target.value })}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Adresse</label>
                <input
                  type="text"
                  value={clientForm.adresse_siege}
                  onChange={e => setClientForm({ ...clientForm, adresse_siege: e.target.value })}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Code postal</label>
                  <input
                    type="text"
                    value={clientForm.code_postal}
                    onChange={e => setClientForm({ ...clientForm, code_postal: e.target.value })}
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ville</label>
                  <input
                    type="text"
                    value={clientForm.ville}
                    onChange={e => setClientForm({ ...clientForm, ville: e.target.value })}
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={clientForm.telephone}
                  onChange={e => setClientForm({ ...clientForm, telephone: e.target.value })}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={clientForm.email}
                  onChange={e => setClientForm({ ...clientForm, email: e.target.value })}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-slate-200">
              <button
                onClick={() => {
                  setShowClientModal(false)
                  setClientForm({ nom: '', adresse_siege: '', ville: '', code_postal: '', telephone: '', email: '' })
                }}
                className="flex-1 h-11 border border-slate-200 rounded-lg font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveClient}
                className="flex-1 h-11 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nouveau Site */}
      {showSiteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Nouveau site</h2>
              <button
                onClick={() => {
                  setShowSiteModal(false)
                  setSiteForm({ nom: '', adresse: '', ville: '', code_postal: '' })
                  setSelectedClientId(null)
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom du site *</label>
                <input
                  type="text"
                  value={siteForm.nom}
                  onChange={e => setSiteForm({ ...siteForm, nom: e.target.value })}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Adresse</label>
                <input
                  type="text"
                  value={siteForm.adresse}
                  onChange={e => setSiteForm({ ...siteForm, adresse: e.target.value })}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Code postal</label>
                  <input
                    type="text"
                    value={siteForm.code_postal}
                    onChange={e => setSiteForm({ ...siteForm, code_postal: e.target.value })}
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ville</label>
                  <input
                    type="text"
                    value={siteForm.ville}
                    onChange={e => setSiteForm({ ...siteForm, ville: e.target.value })}
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-slate-200">
              <button
                onClick={() => {
                  setShowSiteModal(false)
                  setSiteForm({ nom: '', adresse: '', ville: '', code_postal: '' })
                  setSelectedClientId(null)
                }}
                className="flex-1 h-11 border border-slate-200 rounded-lg font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveSite}
                className="flex-1 h-11 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
