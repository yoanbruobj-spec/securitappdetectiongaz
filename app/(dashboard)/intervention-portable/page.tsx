'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { ALL_GAZ, TECHNICIENS } from '@/lib/data/equipements'

type Section = 'info' | 'client' | 'portable' | 'conclusion'

interface PortableGaz {
  id: string
  gaz: string
  gamme_mesure: string
  date_remplacement: string
  date_prochain_remplacement: string
  calibration_gaz_zero: string
  calibration_valeur_avant: string
  calibration_valeur_apres: string
  calibration_statut: string
  etalonnage_gaz: string
  etalonnage_valeur_avant_reglage: string
  etalonnage_valeur_apres_reglage: string
  etalonnage_unite: string
  etalonnage_coefficient: string
  etalonnage_statut: string
  seuil_1: string
  seuil_2: string
  seuil_3: string
  vme: string
  vle: string
}

interface Portable {
  id: string
  marque: string
  modele: string
  numero_serie: string
  etat_general: string
  alarme_sonore: boolean
  alarme_visuelle: boolean
  alarme_vibrante: boolean
  gaz: PortableGaz[]
  pieces_remplacees: string
}

export default function InterventionPortablePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [currentSection, setCurrentSection] = useState<Section>('info')
  const [currentPortableIndex, setCurrentPortableIndex] = useState(0)
  const [loading, setLoading] = useState(false)

  const [dateIntervention, setDateIntervention] = useState('')
  const [heureDebut, setHeureDebut] = useState('')
  const [heureFin, setHeureFin] = useState('')
  const [technicien, setTechnicien] = useState('')
  const [typeIntervention, setTypeIntervention] = useState<string[]>([])

  const [clientId, setClientId] = useState('')
  const [siteId, setSiteId] = useState('')
  const [local, setLocal] = useState('')
  const [contactSite, setContactSite] = useState('')
  const [telContact, setTelContact] = useState('')
  const [emailRapport, setEmailRapport] = useState('')

  const [portables, setPortables] = useState<Portable[]>([{
    id: '1',
    marque: '',
    modele: '',
    numero_serie: '',
    etat_general: 'Bon',
    alarme_sonore: false,
    alarme_visuelle: false,
    alarme_vibrante: false,
    gaz: [],
    pieces_remplacees: '',
  }])

  const [observationsGenerales, setObservationsGenerales] = useState('')
  const [conclusion, setConclusion] = useState('')
  const [photosConclusion, setPhotosConclusion] = useState<File[]>([])

  const [clients, setClients] = useState<any[]>([])
  const [sites, setSites] = useState<any[]>([])
  const [availableTechniciens, setAvailableTechniciens] = useState<any[]>([])
  const [planningInterventionId, setPlanningInterventionId] = useState<string | null>(null)

  useEffect(() => {
    loadClients()
    loadTechniciens()

    const planningId = searchParams.get('planning_id')
    if (planningId) {
      setPlanningInterventionId(planningId)
      loadPlanningData(planningId)
    }
  }, [])

  useEffect(() => {
    if (clientId) {
      loadSites(clientId)
      setSiteId('')
    } else {
      setSites([])
      setSiteId('')
    }
  }, [clientId])

  async function loadClients() {
    const { data } = await supabase.from('clients').select('*').order('nom')
    if (data) setClients(data)
  }

  async function loadSites(clientId: string) {
    const { data } = await supabase
      .from('sites')
      .select('*')
      .eq('client_id', clientId)
      .order('nom')
    if (data) setSites(data)
  }

  async function loadTechniciens() {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('role', ['technicien', 'admin'])
      .order('full_name')
    if (data) setAvailableTechniciens(data)
  }

  async function loadPlanningData(planningId: string) {
    try {
      const { data: planning, error } = await supabase
        .from('planning_interventions')
        .select(`
          *,
          sites (
            id,
            client_id,
            clients (nom)
          )
        `)
        .eq('id', planningId)
        .single()

      if (error) throw error

      if (planning) {
        setDateIntervention(planning.date_intervention)
        setHeureDebut(planning.heure_debut || '')
        setHeureFin(planning.heure_fin || '')

        const typeMap: { [key: string]: string } = {
          'verification_periodique': 'Vérification périodique',
          'maintenance_preventive': 'Maintenance préventive',
          'reparation': 'Réparation',
          'mise_en_service': 'Mise en service',
          'diagnostic': 'Diagnostic',
          'formation': 'Formation'
        }

        if (planning.type && typeMap[planning.type]) {
          setTypeIntervention([typeMap[planning.type]])
        }

        if (planning.sites) {
          setClientId(planning.sites.client_id)
          setSiteId(planning.site_id)
          await loadSites(planning.sites.client_id)
        }

        if (planning.notes) {
          setObservationsGenerales(planning.notes)
        }

        const { data: techAssignments } = await supabase
          .from('planning_techniciens')
          .select('technicien_id, profiles:technicien_id(full_name)')
          .eq('planning_intervention_id', planningId)

        if (techAssignments && techAssignments.length > 0) {
          const techNames = techAssignments
            .map((t: any) => t.profiles?.full_name)
            .filter(Boolean)
            .join(', ')
          setTechnicien(techNames)
        }
      }
    } catch (error) {
      console.error('Erreur chargement planning:', error)
      alert('Erreur lors du chargement des données du planning')
    }
  }

  function addPortable() {
    setPortables([...portables, {
      id: Date.now().toString(),
      marque: '',
      modele: '',
      numero_serie: '',
      etat_general: 'Bon',
      alarme_sonore: false,
      alarme_visuelle: false,
      alarme_vibrante: false,
      gaz: [],
      pieces_remplacees: '',
    }])
  }

  function removePortable(index: number) {
    if (portables.length === 1) {
      alert('Vous devez avoir au moins un détecteur portable')
      return
    }
    const newPortables = portables.filter((_, i) => i !== index)
    setPortables(newPortables)
    if (currentPortableIndex >= newPortables.length) {
      setCurrentPortableIndex(newPortables.length - 1)
    }
  }

  function updatePortable(index: number, field: keyof Portable, value: any) {
    const newPortables = [...portables]
    newPortables[index] = { ...newPortables[index], [field]: value }
    setPortables(newPortables)
  }

  function addGaz(portableIndex: number) {
    const newPortables = [...portables]
    newPortables[portableIndex].gaz.push({
      id: Date.now().toString(),
      gaz: '',
      gamme_mesure: '',
      date_remplacement: '',
      date_prochain_remplacement: '',
      calibration_gaz_zero: '',
      calibration_valeur_avant: '',
      calibration_valeur_apres: '',
      calibration_statut: 'OK',
      etalonnage_gaz: '',
      etalonnage_valeur_avant_reglage: '',
      etalonnage_valeur_apres_reglage: '',
      etalonnage_unite: '%LIE',
      etalonnage_coefficient: '',
      etalonnage_statut: 'OK',
      seuil_1: '',
      seuil_2: '',
      seuil_3: '',
      vme: '',
      vle: '',
    })
    setPortables(newPortables)
  }

  function removeGaz(portableIndex: number, gazIndex: number) {
    const newPortables = [...portables]
    newPortables[portableIndex].gaz = newPortables[portableIndex].gaz.filter((_, i) => i !== gazIndex)
    setPortables(newPortables)
  }

  function updateGaz(portableIndex: number, gazIndex: number, field: keyof PortableGaz, value: any) {
    const newPortables = [...portables]
    newPortables[portableIndex].gaz[gazIndex] = {
      ...newPortables[portableIndex].gaz[gazIndex],
      [field]: value
    }
    setPortables(newPortables)
  }

  function canGoNext() {
    if (currentSection === 'info') {
      return dateIntervention && heureDebut && heureFin && technicien && typeIntervention.length > 0
    }
    if (currentSection === 'client') {
      return clientId && siteId
    }
    if (currentSection === 'portable') {
      const portable = portables[currentPortableIndex]
      return portable.marque && portable.modele && portable.numero_serie
    }
    return true
  }

  function goNext() {
    if (!canGoNext()) {
      alert('Veuillez remplir tous les champs obligatoires')
      return
    }

    if (currentSection === 'info') {
      setCurrentSection('client')
    } else if (currentSection === 'client') {
      setCurrentSection('portable')
    } else if (currentSection === 'portable') {
      if (currentPortableIndex < portables.length - 1) {
        setCurrentPortableIndex(currentPortableIndex + 1)
      } else {
        setCurrentSection('conclusion')
      }
    }
  }

  function goBack() {
    if (currentSection === 'client') {
      setCurrentSection('info')
    } else if (currentSection === 'portable') {
      if (currentPortableIndex > 0) {
        setCurrentPortableIndex(currentPortableIndex - 1)
      } else {
        setCurrentSection('client')
      }
    } else if (currentSection === 'conclusion') {
      setCurrentSection('portable')
      setCurrentPortableIndex(portables.length - 1)
    }
  }

  async function handleSubmit() {
    if (!canGoNext()) {
      alert('Veuillez remplir tous les champs obligatoires')
      return
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const typeReverseMap: { [key: string]: string } = {
        'Vérification périodique': 'verification_periodique',
        'Maintenance préventive': 'maintenance_preventive',
        'Réparation': 'reparation',
        'Mise en service': 'mise_en_service',
        'Diagnostic': 'diagnostic',
        'Formation': 'formation'
      }

      const dbType = typeIntervention.length > 0 && typeReverseMap[typeIntervention[0]]
        ? typeReverseMap[typeIntervention[0]]
        : 'maintenance_preventive'

      const { data: interventionData, error: interventionError } = await supabase
        .from('interventions')
        .insert({
          site_id: siteId,
          technicien_id: user.id,
          date_intervention: dateIntervention,
          heure_debut: heureDebut,
          heure_fin: heureFin,
          technicien: technicien,
          type: dbType,
          statut: 'terminee',
          local: local || null,
          contact_site: contactSite || null,
          tel_contact: telContact || null,
          email_rapport: emailRapport || null,
          observations_generales: observationsGenerales || null,
          conclusion_generale: conclusion || null,
          planning_intervention_id: planningInterventionId || null,
          type_rapport: 'portable',
          created_by: user.id,
        })
        .select()
        .single()

      if (interventionError) throw interventionError

      for (const portable of portables) {
        const { data: portableData, error: portableError } = await supabase
          .from('portables')
          .insert({
            site_id: siteId,
            marque: portable.marque,
            modele: portable.modele,
            numero_serie: portable.numero_serie,
            etat_general: portable.etat_general,
            pieces_remplacees: portable.pieces_remplacees || null,
          })
          .select()
          .single()

        if (portableError) throw portableError

        const { error: verifError } = await supabase
          .from('portables_verifications')
          .insert({
            portable_id: portableData.id,
            intervention_id: interventionData.id,
            alarme_sonore: portable.alarme_sonore,
            alarme_visuelle: portable.alarme_visuelle,
            alarme_vibrante: portable.alarme_vibrante,
          })

        if (verifError) throw verifError

        for (const gaz of portable.gaz) {
          const parseFloatSafe = (val: string) => {
            if (!val || val.trim() === '') return null
            const parsed = parseFloat(val)
            return isNaN(parsed) ? null : parsed
          }

          const { error: gazError } = await supabase
            .from('portables_gaz')
            .insert({
              portable_id: portableData.id,
              intervention_id: interventionData.id,
              gaz: gaz.gaz,
              gamme_mesure: gaz.gamme_mesure || null,
              date_remplacement: gaz.date_remplacement || null,
              date_prochain_remplacement: gaz.date_prochain_remplacement || null,
              calibration_gaz_zero: gaz.calibration_gaz_zero || null,
              calibration_valeur_avant: parseFloatSafe(gaz.calibration_valeur_avant),
              calibration_valeur_apres: parseFloatSafe(gaz.calibration_valeur_apres),
              calibration_statut: gaz.calibration_statut || null,
              etalonnage_gaz: gaz.etalonnage_gaz || null,
              etalonnage_valeur_avant_reglage: parseFloatSafe(gaz.etalonnage_valeur_avant_reglage),
              etalonnage_valeur_apres_reglage: parseFloatSafe(gaz.etalonnage_valeur_apres_reglage),
              etalonnage_unite: gaz.etalonnage_unite || null,
              etalonnage_coefficient: parseFloatSafe(gaz.etalonnage_coefficient),
              etalonnage_statut: gaz.etalonnage_statut || null,
              seuil_1: gaz.seuil_1 || null,
              seuil_2: gaz.seuil_2 || null,
              seuil_3: gaz.seuil_3 || null,
              vme: gaz.vme || null,
              vle: gaz.vle || null,
            })

          if (gazError) throw gazError
        }
      }

      if (photosConclusion.length > 0) {
        for (const photo of photosConclusion) {
          const fileExt = photo.name.split('.').pop()
          const fileName = `${interventionData.id}/${Date.now()}.${fileExt}`

          const { error: uploadError } = await supabase.storage
            .from('intervention-photos')
            .upload(fileName, photo)

          if (uploadError) {
            console.error('Erreur upload photo:', uploadError)
          } else {
            await supabase.from('intervention_photos').insert({
              intervention_id: interventionData.id,
              photo_url: fileName,
              type: 'conclusion'
            })
          }
        }
      }

      alert('Intervention portable enregistrée avec succès !')
      router.push(`/intervention-portable/${interventionData.id}`)
    } catch (error: any) {
      console.error('Erreur complète:', error)
      console.error('Type:', typeof error)
      console.error('Message:', error?.message)
      console.error('Code:', error?.code)
      console.error('Details:', error?.details)
      console.error('Hint:', error?.hint)
      console.error('Stack:', error?.stack)

      const errorMessage = error?.message || error?.error_description || error?.hint || error?.details || JSON.stringify(error) || 'Erreur inconnue'
      alert('Erreur lors de l\'enregistrement: ' + errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const selectedClient = clients.find(c => c.id === clientId)
  const selectedSite = sites.find(s => s.id === siteId)

  return (
    <div className="min-h-screen bg-[#0A0E1A] flex flex-col">
      <header className="bg-[#141B2D]/80 backdrop-blur-xl border-b border-[#2D3B52] sticky top-0 z-50">
        <div className="px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.back()}
              variant="ghost"
              size="sm"
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Retour
            </Button>
            <h1 className="text-xl font-bold text-slate-100">Nouveau Rapport - Détection Portable</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="info">Section {currentSection === 'info' ? '1' : currentSection === 'client' ? '2' : currentSection === 'portable' ? '3' : '4'}/4</Badge>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-5xl mx-auto">
          {currentSection === 'info' && (
            <Card variant="glass" padding="lg">
              <h2 className="text-2xl font-bold text-slate-100 mb-6">Informations intervention</h2>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Date intervention *</label>
                  <input
                    type="date"
                    value={dateIntervention}
                    onChange={(e) => setDateIntervention(e.target.value)}
                    className="w-full px-4 py-3 bg-[#141B2D] border border-[#2D3B52] rounded-lg text-slate-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Technicien *</label>
                  <select
                    value={technicien}
                    onChange={(e) => setTechnicien(e.target.value)}
                    className="w-full px-4 py-3 bg-[#141B2D] border border-[#2D3B52] rounded-lg text-slate-100"
                    required
                  >
                    <option value="">Sélectionner un technicien</option>
                    {availableTechniciens.map(tech => (
                      <option key={tech.id} value={tech.full_name}>{tech.full_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Heure début *</label>
                  <input
                    type="time"
                    value={heureDebut}
                    onChange={(e) => setHeureDebut(e.target.value)}
                    className="w-full px-4 py-3 bg-[#141B2D] border border-[#2D3B52] rounded-lg text-slate-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Heure fin *</label>
                  <input
                    type="time"
                    value={heureFin}
                    onChange={(e) => setHeureFin(e.target.value)}
                    className="w-full px-4 py-3 bg-[#141B2D] border border-[#2D3B52] rounded-lg text-slate-100"
                    required
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-slate-300 mb-3">Type d'intervention *</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Vérification périodique', 'Maintenance préventive', 'Réparation', 'Mise en service', 'Diagnostic', 'Formation'].map(type => (
                    <label key={type} className="flex items-center gap-3 p-3 bg-[#141B2D] border border-[#2D3B52] rounded-lg cursor-pointer hover:bg-[#1E2A3F]">
                      <input
                        type="checkbox"
                        checked={typeIntervention.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTypeIntervention([...typeIntervention, type])
                          } else {
                            setTypeIntervention(typeIntervention.filter(t => t !== type))
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-slate-100">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <Button onClick={goNext} variant="primary" disabled={!canGoNext()}>
                  Suivant
                </Button>
              </div>
            </Card>
          )}

          {currentSection === 'client' && (
            <Card variant="glass" padding="lg">
              <h2 className="text-2xl font-bold text-slate-100 mb-6">Client & Site</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Client *</label>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full px-4 py-3 bg-[#141B2D] border border-[#2D3B52] rounded-lg text-slate-100"
                    required
                  >
                    <option value="">Sélectionner un client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.nom}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Site *</label>
                  <select
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value)}
                    className="w-full px-4 py-3 bg-[#141B2D] border border-[#2D3B52] rounded-lg text-slate-100"
                    required
                    disabled={!clientId}
                  >
                    <option value="">Sélectionner un site</option>
                    {sites.map(site => (
                      <option key={site.id} value={site.id}>{site.nom}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Local / Zone</label>
                  <input
                    type="text"
                    value={local}
                    onChange={(e) => setLocal(e.target.value)}
                    placeholder="Ex: Atelier, Zone de stockage..."
                    className="w-full px-4 py-3 bg-[#141B2D] border border-[#2D3B52] rounded-lg text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Contact sur site</label>
                    <input
                      type="text"
                      value={contactSite}
                      onChange={(e) => setContactSite(e.target.value)}
                      placeholder="Nom du contact"
                      className="w-full px-4 py-3 bg-[#141B2D] border border-[#2D3B52] rounded-lg text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Téléphone contact</label>
                    <input
                      type="tel"
                      value={telContact}
                      onChange={(e) => setTelContact(e.target.value)}
                      placeholder="06 12 34 56 78"
                      className="w-full px-4 py-3 bg-[#141B2D] border border-[#2D3B52] rounded-lg text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email pour envoi du rapport</label>
                  <input
                    type="email"
                    value={emailRapport}
                    onChange={(e) => setEmailRapport(e.target.value)}
                    placeholder="email@exemple.fr"
                    className="w-full px-4 py-3 bg-[#141B2D] border border-[#2D3B52] rounded-lg text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <Button onClick={goBack} variant="secondary">
                  Retour
                </Button>
                <Button onClick={goNext} variant="primary" disabled={!canGoNext()}>
                  Suivant
                </Button>
              </div>
            </Card>
          )}

          {currentSection === 'portable' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-100">
                  Détecteur Portable {currentPortableIndex + 1}/{portables.length}
                </h2>
                <div className="flex gap-2">
                  <Button onClick={addPortable} variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
                    Ajouter un portable
                  </Button>
                  {portables.length > 1 && (
                    <Button
                      onClick={() => removePortable(currentPortableIndex)}
                      variant="danger"
                      size="sm"
                      icon={<Trash2 className="w-4 h-4" />}
                    >
                      Supprimer
                    </Button>
                  )}
                </div>
              </div>

              <Card variant="glass" padding="lg">
                <h3 className="text-lg font-semibold text-slate-100 mb-4">Informations générales</h3>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Marque *</label>
                    <input
                      type="text"
                      value={portables[currentPortableIndex].marque}
                      onChange={(e) => updatePortable(currentPortableIndex, 'marque', e.target.value)}
                      className="w-full px-4 py-3 bg-[#141B2D] border border-[#2D3B52] rounded-lg text-slate-100"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Modèle *</label>
                    <input
                      type="text"
                      value={portables[currentPortableIndex].modele}
                      onChange={(e) => updatePortable(currentPortableIndex, 'modele', e.target.value)}
                      className="w-full px-4 py-3 bg-[#141B2D] border border-[#2D3B52] rounded-lg text-slate-100"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">N° de série *</label>
                    <input
                      type="text"
                      value={portables[currentPortableIndex].numero_serie}
                      onChange={(e) => updatePortable(currentPortableIndex, 'numero_serie', e.target.value)}
                      className="w-full px-4 py-3 bg-[#141B2D] border border-[#2D3B52] rounded-lg text-slate-100"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">État général</label>
                    <select
                      value={portables[currentPortableIndex].etat_general}
                      onChange={(e) => updatePortable(currentPortableIndex, 'etat_general', e.target.value)}
                      className="w-full px-4 py-3 bg-[#141B2D] border border-[#2D3B52] rounded-lg text-slate-100"
                    >
                      <option value="Bon">Bon</option>
                      <option value="Moyen">Moyen</option>
                      <option value="Mauvais">Mauvais</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-sm font-medium text-slate-300 mb-3">Vérifications fonctionnelles</h4>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={portables[currentPortableIndex].alarme_sonore}
                        onChange={(e) => updatePortable(currentPortableIndex, 'alarme_sonore', e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-slate-100">Alarme sonore</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={portables[currentPortableIndex].alarme_visuelle}
                        onChange={(e) => updatePortable(currentPortableIndex, 'alarme_visuelle', e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-slate-100">Alarme visuelle</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={portables[currentPortableIndex].alarme_vibrante}
                        onChange={(e) => updatePortable(currentPortableIndex, 'alarme_vibrante', e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-slate-100">Alarme vibrante</span>
                    </label>
                  </div>
                </div>
              </Card>

              <Card variant="glass" padding="lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-100">Gaz détectés</h3>
                  <Button
                    onClick={() => addGaz(currentPortableIndex)}
                    variant="primary"
                    size="sm"
                    icon={<Plus className="w-4 h-4" />}
                  >
                    Ajouter un gaz
                  </Button>
                </div>

                {portables[currentPortableIndex].gaz.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">Aucun gaz ajouté</p>
                ) : (
                  <div className="space-y-6">
                    {portables[currentPortableIndex].gaz.map((gaz, gazIndex) => (
                      <Card key={gaz.id} variant="elevated" padding="md">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-slate-100">Gaz {gazIndex + 1}</h4>
                          <Button
                            onClick={() => removeGaz(currentPortableIndex, gazIndex)}
                            variant="ghost"
                            size="sm"
                            icon={<Trash2 className="w-4 h-4" />}
                          >
                            Supprimer
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Type de gaz</label>
                            <select
                              value={gaz.gaz}
                              onChange={(e) => updateGaz(currentPortableIndex, gazIndex, 'gaz', e.target.value)}
                              className="w-full px-4 py-2 bg-[#141B2D] border border-[#2D3B52] rounded-lg text-slate-100"
                            >
                              <option value="">Sélectionner</option>
                              {ALL_GAZ.map(g => (
                                <option key={g.value} value={g.value}>{g.label}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Gamme de mesure</label>
                            <input
                              type="text"
                              value={gaz.gamme_mesure}
                              onChange={(e) => updateGaz(currentPortableIndex, gazIndex, 'gamme_mesure', e.target.value)}
                              placeholder="Ex: 0-100 ppm"
                              className="w-full px-4 py-2 bg-[#141B2D] border border-[#2D3B52] rounded-lg text-slate-100"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Date remplacement cellule</label>
                            <input
                              type="date"
                              value={gaz.date_remplacement}
                              onChange={(e) => updateGaz(currentPortableIndex, gazIndex, 'date_remplacement', e.target.value)}
                              className="w-full px-4 py-2 bg-[#141B2D] border border-[#2D3B52] rounded-lg text-slate-100"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Prochain remplacement</label>
                            <input
                              type="date"
                              value={gaz.date_prochain_remplacement}
                              onChange={(e) => updateGaz(currentPortableIndex, gazIndex, 'date_prochain_remplacement', e.target.value)}
                              className="w-full px-4 py-2 bg-[#141B2D] border border-[#2D3B52] rounded-lg text-slate-100"
                            />
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-[#2D3B52]">
                          <h5 className="text-sm font-semibold text-slate-300 mb-3">Calibration zéro</h5>
                          <div className="grid grid-cols-4 gap-4">
                            <div>
                              <label className="block text-xs text-slate-400 mb-1">Gaz zéro</label>
                              <input
                                type="text"
                                value={gaz.calibration_gaz_zero}
                                onChange={(e) => updateGaz(currentPortableIndex, gazIndex, 'calibration_gaz_zero', e.target.value)}
                                placeholder="Air ou N2"
                                className="w-full px-3 py-2 bg-[#141B2D] border border-[#2D3B52] rounded-lg text-slate-100 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-400 mb-1">Valeur avant</label>
                              <input
                                type="text"
                                value={gaz.calibration_valeur_avant}
                                onChange={(e) => updateGaz(currentPortableIndex, gazIndex, 'calibration_valeur_avant', e.target.value)}
                                placeholder="0.00"
                                className="w-full px-3 py-2 bg-[#141B2D] border border-[#2D3B52] rounded-lg text-slate-100 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-400 mb-1">Valeur après</label>
                              <input
                                type="text"
                                value={gaz.calibration_valeur_apres}
                                onChange={(e) => updateGaz(currentPortableIndex, gazIndex, 'calibration_valeur_apres', e.target.value)}
                                placeholder="0.00"
                                className="w-full px-3 py-2 bg-[#141B2D] border border-[#2D3B52] rounded-lg text-slate-100 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-400 mb-1">Statut</label>
                              <select
                                value={gaz.calibration_statut}
                                onChange={(e) => updateGaz(currentPortableIndex, gazIndex, 'calibration_statut', e.target.value)}
                                className="w-full px-3 py-2 bg-[#141B2D] border border-[#2D3B52] rounded-lg text-slate-100 text-sm"
                              >
                                <option value="OK">OK</option>
                                <option value="Dérive">Dérive</option>
                                <option value="HS">HS</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-[#2D3B52]">
                          <h5 className="text-sm font-semibold text-slate-300 mb-3">Étalonnage sensibilité</h5>
                          <div className="grid grid-cols-3 gap-4 mb-3">
                            <div>
                              <label className="block text-xs text-slate-400 mb-1">Gaz</label>
                              <input
                                type="text"
                                value={gaz.etalonnage_gaz}
                                onChange={(e) => updateGaz(currentPortableIndex, gazIndex, 'etalonnage_gaz', e.target.value)}
                                placeholder="Ex: CH4"
                                className="w-full px-3 py-2 bg-[#141B2D] border border-[#2D3B52] rounded-lg text-slate-100 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-400 mb-1">Valeur avant réglage</label>
                              <input
                                type="text"
                                value={gaz.etalonnage_valeur_avant_reglage}
                                onChange={(e) => updateGaz(currentPortableIndex, gazIndex, 'etalonnage_valeur_avant_reglage', e.target.value)}
                                placeholder="50.0"
                                className="w-full px-3 py-2 bg-[#141B2D] border border-[#2D3B52] rounded-lg text-slate-100 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-400 mb-1">Valeur après réglage</label>
                              <input
                                type="text"
                                value={gaz.etalonnage_valeur_apres_reglage}
                                onChange={(e) => updateGaz(currentPortableIndex, gazIndex, 'etalonnage_valeur_apres_reglage', e.target.value)}
                                placeholder="50.0"
                                className="w-full px-3 py-2 bg-[#141B2D] border border-[#2D3B52] rounded-lg text-slate-100 text-sm"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs text-slate-400 mb-1">Unité</label>
                              <select
                                value={gaz.etalonnage_unite}
                                onChange={(e) => updateGaz(currentPortableIndex, gazIndex, 'etalonnage_unite', e.target.value)}
                                className="w-full px-3 py-2 bg-[#141B2D] border border-[#2D3B52] rounded-lg text-slate-100 text-sm"
                              >
                                <option value="%LIE">%LIE</option>
                                <option value="ppm">ppm</option>
                                <option value="%Vol">%Vol</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-slate-400 mb-1">Coefficient</label>
                              <input
                                type="text"
                                value={gaz.etalonnage_coefficient}
                                onChange={(e) => updateGaz(currentPortableIndex, gazIndex, 'etalonnage_coefficient', e.target.value)}
                                placeholder="1.00"
                                className="w-full px-3 py-2 bg-[#141B2D] border border-[#2D3B52] rounded-lg text-slate-100 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-400 mb-1">Statut</label>
                              <select
                                value={gaz.etalonnage_statut}
                                onChange={(e) => updateGaz(currentPortableIndex, gazIndex, 'etalonnage_statut', e.target.value)}
                                className="w-full px-3 py-2 bg-[#141B2D] border border-[#2D3B52] rounded-lg text-slate-100 text-sm"
                              >
                                <option value="OK">OK</option>
                                <option value="Dérive acceptable">Dérive acceptable</option>
                                <option value="Dérive limite">Dérive limite</option>
                                <option value="HS">HS</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-[#2D3B52]">
                          <h5 className="text-sm font-semibold text-slate-300 mb-3">Seuils d'alarme</h5>
                          <div className="grid grid-cols-5 gap-4">
                            <div>
                              <label className="block text-xs text-slate-400 mb-1">Seuil 1</label>
                              <input
                                type="text"
                                value={gaz.seuil_1}
                                onChange={(e) => updateGaz(currentPortableIndex, gazIndex, 'seuil_1', e.target.value)}
                                placeholder="Ex: 10 ppm"
                                className="w-full px-3 py-2 bg-[#141B2D] border border-[#2D3B52] rounded-lg text-slate-100 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-400 mb-1">Seuil 2</label>
                              <input
                                type="text"
                                value={gaz.seuil_2}
                                onChange={(e) => updateGaz(currentPortableIndex, gazIndex, 'seuil_2', e.target.value)}
                                placeholder="Ex: 20 ppm"
                                className="w-full px-3 py-2 bg-[#141B2D] border border-[#2D3B52] rounded-lg text-slate-100 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-400 mb-1">Seuil 3</label>
                              <input
                                type="text"
                                value={gaz.seuil_3}
                                onChange={(e) => updateGaz(currentPortableIndex, gazIndex, 'seuil_3', e.target.value)}
                                placeholder="Ex: 50 ppm"
                                className="w-full px-3 py-2 bg-[#141B2D] border border-[#2D3B52] rounded-lg text-slate-100 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-400 mb-1">VME</label>
                              <input
                                type="text"
                                value={gaz.vme}
                                onChange={(e) => updateGaz(currentPortableIndex, gazIndex, 'vme', e.target.value)}
                                placeholder="Ex: 100 ppm"
                                className="w-full px-3 py-2 bg-[#141B2D] border border-[#2D3B52] rounded-lg text-slate-100 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-400 mb-1">VLE</label>
                              <input
                                type="text"
                                value={gaz.vle}
                                onChange={(e) => updateGaz(currentPortableIndex, gazIndex, 'vle', e.target.value)}
                                placeholder="Ex: 200 ppm"
                                className="w-full px-3 py-2 bg-[#141B2D] border border-[#2D3B52] rounded-lg text-slate-100 text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                <div className="mt-6">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Pièces remplacées</label>
                  <textarea
                    value={portables[currentPortableIndex].pieces_remplacees}
                    onChange={(e) => updatePortable(currentPortableIndex, 'pieces_remplacees', e.target.value)}
                    placeholder="Cellule O2, batterie..."
                    rows={3}
                    className="w-full px-4 py-3 bg-[#141B2D] border border-[#2D3B52] rounded-lg text-slate-100"
                  />
                </div>
              </Card>

              <div className="flex justify-between">
                <Button onClick={goBack} variant="secondary">
                  Retour
                </Button>
                <Button onClick={goNext} variant="primary" disabled={!canGoNext()}>
                  {currentPortableIndex < portables.length - 1 ? 'Portable suivant' : 'Conclusion'}
                </Button>
              </div>
            </div>
          )}

          {currentSection === 'conclusion' && (
            <Card variant="glass" padding="lg">
              <h2 className="text-2xl font-bold text-slate-100 mb-6">Conclusion</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Observations générales</label>
                  <textarea
                    value={observationsGenerales}
                    onChange={(e) => setObservationsGenerales(e.target.value)}
                    placeholder="Remarques générales sur l'intervention..."
                    rows={4}
                    className="w-full px-4 py-3 bg-[#141B2D] border border-[#2D3B52] rounded-lg text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Conclusion finale</label>
                  <textarea
                    value={conclusion}
                    onChange={(e) => setConclusion(e.target.value)}
                    placeholder="Conclusion de l'intervention..."
                    rows={4}
                    className="w-full px-4 py-3 bg-[#141B2D] border border-[#2D3B52] rounded-lg text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Photos de conclusion</label>
                  <div className="border-2 border-dashed border-[#2D3B52] rounded-lg p-6 text-center bg-[#141B2D]">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        if (e.target.files) {
                          setPhotosConclusion(Array.from(e.target.files))
                        }
                      }}
                      className="hidden"
                      id="photos-conclusion"
                    />
                    <label
                      htmlFor="photos-conclusion"
                      className="cursor-pointer text-[#3B82F6] hover:text-[#60A5FA] font-medium"
                    >
                      📷 Cliquer pour ajouter des photos
                    </label>
                    {photosConclusion.length > 0 && (
                      <div className="mt-4 text-slate-300">
                        {photosConclusion.length} photo(s) sélectionnée(s)
                        <div className="mt-2 flex flex-wrap gap-2 justify-center">
                          {photosConclusion.map((photo, index) => (
                            <div key={index} className="text-sm text-slate-400">
                              {photo.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Card variant="elevated" padding="md">
                  <h3 className="font-semibold text-slate-100 mb-3">Récapitulatif</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Client:</span>
                      <span className="text-slate-100">{selectedClient?.nom}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Site:</span>
                      <span className="text-slate-100">{selectedSite?.nom}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Date:</span>
                      <span className="text-slate-100">{dateIntervention}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Détecteurs portables:</span>
                      <span className="text-slate-100">{portables.length}</span>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="flex justify-between mt-8">
                <Button onClick={goBack} variant="secondary">
                  Retour
                </Button>
                <Button
                  onClick={handleSubmit}
                  variant="primary"
                  icon={<Save className="w-4 h-4" />}
                  disabled={loading}
                >
                  {loading ? 'Enregistrement...' : 'Enregistrer l\'intervention'}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}