'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile) {
      setUserRole(profile.role)
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
      .select('id, date_intervention, type, statut')
      .eq('site_id', siteId)
      .order('date_intervention', { ascending: false })
    
    if (data) {
      setInterventions(prev => ({ ...prev, [siteId]: data }))
    }
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

    const { data, error } = await supabase
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

    const { data, error } = await supabase
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

  function toggleClient(clientId: string) {
    const newExpanded = new Set(expandedClients)
    if (newExpanded.has(clientId)) {
      newExpanded.delete(clientId)
    } else {
      newExpanded.add(clientId)
    }
    setExpandedClients(newExpanded)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-slate-800">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-slate-800">
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin')}
              className="text-slate-600 hover:text-slate-800"
            >
              ← Retour
            </button>
            <h1 className="text-xl font-bold">Gestion des clients</h1>
          </div>
          <button
            onClick={() => setShowClientModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg"
          >
            + Nouveau client
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {clients.length === 0 ? (
          <div className="text-center py-12 text-slate-600">
            Aucun client. Cliquez sur "Nouveau client" pour commencer.
          </div>
        ) : (
          <div className="space-y-4">
            {clients.map(client => (
              <div key={client.id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <button
                      onClick={() => toggleClient(client.id)}
                      className="text-slate-600 hover:text-slate-800"
                    >
                      <svg className={`w-5 h-5 transition-transform ${expandedClients.has(client.id) ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{client.nom}</h3>
                      <p className="text-sm text-slate-600">
                        {client.adresse_siege}, {client.code_postal} {client.ville}
                      </p>
                      <p className="text-sm text-slate-600">
                        {client.telephone} • {client.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedClientId(client.id)
                        setShowSiteModal(true)
                      }}
                      className="px-3 py-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded text-sm"
                    >
                      + Ajouter site
                    </button>
                    {userRole === 'admin' && (
                      <button
                        onClick={() => handleDeleteClient(client.id)}
                        className="px-3 py-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded text-sm"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>

                {expandedClients.has(client.id) && sites[client.id] && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <h4 className="font-semibold mb-3">Sites ({sites[client.id]?.length || 0})</h4>
                    {sites[client.id]?.length === 0 ? (
                      <p className="text-slate-600 text-sm">Aucun site</p>
                    ) : (
                      <div className="space-y-2">
                        {sites[client.id]?.map(site => (
                          <div key={site.id} className="bg-white border border-gray-200 rounded">
                            <div className="p-3 flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                <button
                                  onClick={() => toggleSite(site.id)}
                                  className="text-slate-600 hover:text-slate-800"
                                >
                                  <svg className={`w-4 h-4 transition-transform ${expandedSites.has(site.id) ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                                <div>
                                  <p className="font-medium">{site.nom}</p>
                                  <p className="text-sm text-slate-600">
                                    {site.adresse}, {site.code_postal} {site.ville}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-600">
                                  {interventions[site.id]?.length || 0} intervention(s)
                                </span>
                                {userRole === 'admin' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteSite(site.id, client.id)
                                    }}
                                    className="px-3 py-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded text-sm"
                                  >
                                    Supprimer
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            {expandedSites.has(site.id) && interventions[site.id] && (
                              <div className="border-t border-gray-200 p-3 bg-gray-50">
                                <h5 className="text-sm font-semibold mb-2">Interventions</h5>
                                {interventions[site.id]?.length === 0 ? (
                                  <p className="text-slate-600 text-xs">Aucune intervention</p>
                                ) : (
                                  <div className="space-y-2">
                                    {interventions[site.id]?.map(intervention => (
                                      <div 
                                        key={intervention.id} 
                                        className="bg-white border border-gray-200 rounded p-2 cursor-pointer hover:bg-gray-50 transition"
                                        onClick={() => router.push(`/intervention/${intervention.id}`)}
                                      >
                                        <div className="flex justify-between items-center">
                                          <div>
                                            <p className="text-sm">{new Date(intervention.date_intervention).toLocaleDateString('fr-FR')}</p>
                                            <p className="text-xs text-slate-600 capitalize">{intervention.type?.replace(/_/g, ' ')}</p>
                                          </div>
                                          <span className={`px-2 py-1 rounded text-xs ${
                                            intervention.statut === 'terminee' ? 'bg-green-100 text-green-700 border border-green-200' :
                                            intervention.statut === 'en_cours' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                            intervention.statut === 'planifiee' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                                            'bg-gray-100 text-gray-700 border border-gray-200'
                                          }`}>
                                            {intervention.statut}
                                          </span>
                                        </div>
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
      </main>

      {showClientModal && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Nouveau client</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Nom *</label>
                <input
                  type="text"
                  value={clientForm.nom}
                  onChange={e => setClientForm({ ...clientForm, nom: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Adresse</label>
                <input
                  type="text"
                  value={clientForm.adresse_siege}
                  onChange={e => setClientForm({ ...clientForm, adresse_siege: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">Code postal</label>
                  <input
                    type="text"
                    value={clientForm.code_postal}
                    onChange={e => setClientForm({ ...clientForm, code_postal: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Ville</label>
                  <input
                    type="text"
                    value={clientForm.ville}
                    onChange={e => setClientForm({ ...clientForm, ville: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={clientForm.telephone}
                  onChange={e => setClientForm({ ...clientForm, telephone: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Email</label>
                <input
                  type="email"
                  value={clientForm.email}
                  onChange={e => setClientForm({ ...clientForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-slate-800"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowClientModal(false)
                  setClientForm({ nom: '', adresse_siege: '', ville: '', code_postal: '', telephone: '', email: '' })
                }}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-slate-800 rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveClient}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {showSiteModal && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Nouveau site</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Nom du site *</label>
                <input
                  type="text"
                  value={siteForm.nom}
                  onChange={e => setSiteForm({ ...siteForm, nom: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Adresse</label>
                <input
                  type="text"
                  value={siteForm.adresse}
                  onChange={e => setSiteForm({ ...siteForm, adresse: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">Code postal</label>
                  <input
                    type="text"
                    value={siteForm.code_postal}
                    onChange={e => setSiteForm({ ...siteForm, code_postal: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Ville</label>
                  <input
                    type="text"
                    value={siteForm.ville}
                    onChange={e => setSiteForm({ ...siteForm, ville: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowSiteModal(false)
                  setSiteForm({ nom: '', adresse: '', ville: '', code_postal: '' })
                  setSelectedClientId(null)
                }}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-slate-800 rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveSite}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg"
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