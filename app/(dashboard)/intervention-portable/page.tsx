'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { ALL_GAZ, TECHNICIENS } from '@/lib/data/equipements'
import { StepIndicator } from '@/components/rapport/StepIndicator'
import { FormSection } from '@/components/rapport/FormSection'
import { FormField } from '@/components/rapport/FormField'
import { ValidationBadge } from '@/components/rapport/ValidationBadge'

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

function InterventionPortablePageContent() {
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

  // Définir les étapes pour le Step Indicator
  const steps = [
    { id: 'info', label: 'Informations' },
    { id: 'client', label: 'Client & Site' },
    { id: 'portable', label: `Portable${portables.length > 1 ? 's' : ''} (${portables.length})` },
    { id: 'conclusion', label: 'Conclusion' },
  ]

  const handleStepClick = (stepId: string) => {
    if (stepId === 'portable' && currentSection !== 'portable') {
      setCurrentPortableIndex(0)
    }
    setCurrentSection(stepId as Section)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24 lg:pb-8">
      {/* Header avec titre et infos */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition flex-shrink-0"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm sm:text-base">Retour</span>
            </button>
            <div className="h-5 sm:h-6 w-px bg-gray-300"></div>
            <h1 className="text-base sm:text-lg lg:text-2xl font-bold text-slate-800 truncate">Nouveau Rapport - Détection Portable</h1>
          </div>
          {planningInterventionId && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              Lié au planning
            </div>
          )}
        </div>
      </div>

      {/* Step Indicator */}
      <StepIndicator steps={steps} currentStep={currentSection} onStepClick={handleStepClick} />

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Gestion des portables */}
        {currentSection === 'portable' && (
          <div className="mb-4 sm:mb-6 bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                {portables.length > 1 ? (
                  <>
                    <span className="text-xs sm:text-sm font-medium text-slate-700">Détecteur portable sélectionné :</span>
                    <div className="flex flex-wrap gap-2">
                      {portables.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentPortableIndex(index)}
                          className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-sm font-medium transition ${
                            currentPortableIndex === index
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-gray-100 text-slate-700 hover:bg-gray-200'
                          }`}
                        >
                          Portable {index + 1}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-slate-700">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm sm:text-base font-medium">Configuration du détecteur portable</span>
                  </div>
                )}
              </div>
              <button
                onClick={addPortable}
                className="flex items-center justify-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm sm:text-base font-medium transition shadow-sm w-full sm:w-auto"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Ajouter un portable
              </button>
            </div>
          </div>
        )}

        {/* Contenus des sections */}
        <div className="space-y-6">
          {currentSection === 'info' && (
            <>
              <FormSection
                title="Informations d'intervention"
                description="Renseignez les informations principales de l'intervention"
                icon={
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                }
                className="max-w-4xl mx-auto"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <FormField label="Date d'intervention" required error={!dateIntervention ? 'Date requise' : ''}>
                    <input
                      type="date"
                      value={dateIntervention}
                      onChange={(e) => setDateIntervention(e.target.value)}
                      className={`w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base bg-white border rounded-lg focus:outline-none focus:ring-2 transition ${
                        !dateIntervention
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      } text-slate-800`}
                    />
                  </FormField>
                  <FormField label="Heure de début" required error={!heureDebut ? 'Heure requise' : ''}>
                    <input
                      type="time"
                      value={heureDebut}
                      onChange={(e) => setHeureDebut(e.target.value)}
                      className={`w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base bg-white border rounded-lg focus:outline-none focus:ring-2 transition ${
                        !heureDebut
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      } text-slate-800`}
                    />
                  </FormField>
                  <FormField label="Heure de fin" required error={!heureFin ? 'Heure requise' : ''}>
                    <input
                      type="time"
                      value={heureFin}
                      onChange={(e) => setHeureFin(e.target.value)}
                      className={`w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base bg-white border rounded-lg focus:outline-none focus:ring-2 transition ${
                        !heureFin
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      } text-slate-800`}
                    />
                  </FormField>
                </div>

                <FormField label="Technicien" required error={!technicien ? 'Technicien requis' : ''}>
                  <select
                    value={technicien}
                    onChange={(e) => setTechnicien(e.target.value)}
                    className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 transition ${
                      !technicien
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    } text-slate-800`}
                  >
                    <option value="">Sélectionner un technicien</option>
                    {availableTechniciens.map(tech => (
                      <option key={tech.id} value={tech.full_name}>{tech.full_name}</option>
                    ))}
                  </select>
                </FormField>

                <FormField
                  label="Type d'intervention"
                  required
                  error={typeIntervention.length === 0 ? 'Au moins un type requis' : ''}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    {['Vérification périodique', 'Maintenance préventive', 'Réparation', 'Mise en service', 'Diagnostic', 'Formation'].map(type => (
                      <label
                        key={type}
                        className={`flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 border rounded-lg cursor-pointer transition ${
                          typeIntervention.includes(type)
                            ? 'bg-blue-50 border-blue-300'
                            : 'bg-white border-gray-300 hover:border-gray-400'
                        }`}
                      >
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
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 flex-shrink-0"
                        />
                        <span className="text-slate-800 text-sm sm:text-base font-medium">{type}</span>
                      </label>
                    ))}
                  </div>
                </FormField>
              </FormSection>

              {/* Boutons de navigation */}
              <div className="max-w-4xl mx-auto flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                <ValidationBadge
                  isValid={!!(dateIntervention && heureDebut && heureFin && technicien && typeIntervention.length > 0)}
                  message={
                    dateIntervention && heureDebut && heureFin && technicien && typeIntervention.length > 0
                      ? 'Section complète'
                      : 'Veuillez remplir tous les champs requis'
                  }
                />
                <button
                  onClick={goNext}
                  disabled={!canGoNext()}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition shadow-sm"
                >
                  Suivant
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </>
          )}

          {currentSection === 'client' && (
            <>
              <FormSection
                title="Client & Site d'intervention"
                description="Sélectionnez le client et le site concernés par l'intervention"
                icon={
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                }
                className="max-w-4xl mx-auto"
              >
                <FormField label="Client" required error={!clientId ? 'Client requis' : ''}>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 transition ${
                      !clientId
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    } text-slate-800`}
                  >
                    <option value="">Sélectionner un client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.nom}</option>
                    ))}
                  </select>
                </FormField>

                <FormField
                  label="Site"
                  required
                  error={!siteId ? 'Site requis' : ''}
                  help={!clientId ? 'Veuillez d\'abord sélectionner un client' : ''}
                >
                  <select
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value)}
                    disabled={!clientId}
                    className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 transition ${
                      !siteId && clientId
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    } text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <option value="">Sélectionner un site</option>
                    {sites.map(site => (
                      <option key={site.id} value={site.id}>{site.nom}</option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Local / Zone" help="Zone ou local spécifique de l'intervention">
                  <input
                    type="text"
                    value={local}
                    onChange={(e) => setLocal(e.target.value)}
                    placeholder="Ex: Atelier, Zone de stockage, Local technique..."
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  />
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <FormField label="Contact sur site">
                    <input
                      type="text"
                      value={contactSite}
                      onChange={(e) => setContactSite(e.target.value)}
                      placeholder="Nom du contact"
                      className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                    />
                  </FormField>
                  <FormField label="Téléphone contact">
                    <input
                      type="tel"
                      value={telContact}
                      onChange={(e) => setTelContact(e.target.value)}
                      placeholder="06 12 34 56 78"
                      className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                    />
                  </FormField>
                </div>

                <FormField label="Email pour envoi du rapport">
                  <input
                    type="email"
                    value={emailRapport}
                    onChange={(e) => setEmailRapport(e.target.value)}
                    placeholder="email@exemple.fr"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  />
                </FormField>
              </FormSection>

              {/* Boutons de navigation */}
              <div className="max-w-4xl mx-auto flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={goBack}
                  className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-slate-700 rounded-lg font-medium transition"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Précédent
                </button>
                <div className="flex items-center gap-4">
                  <ValidationBadge
                    isValid={!!(clientId && siteId)}
                    message={
                      clientId && siteId
                        ? 'Section complète'
                        : 'Veuillez sélectionner un client et un site'
                    }
                  />
                  <button
                    onClick={goNext}
                    disabled={!canGoNext()}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition shadow-sm"
                  >
                    Suivant
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          )}

          {currentSection === 'portable' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800">
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
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Informations générales</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Marque *</label>
                    <input
                      type="text"
                      value={portables[currentPortableIndex].marque}
                      onChange={(e) => updatePortable(currentPortableIndex, 'marque', e.target.value)}
                      className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base bg-white border border-gray-200 rounded-lg text-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Modèle *</label>
                    <input
                      type="text"
                      value={portables[currentPortableIndex].modele}
                      onChange={(e) => updatePortable(currentPortableIndex, 'modele', e.target.value)}
                      className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base bg-white border border-gray-200 rounded-lg text-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">N° de série *</label>
                    <input
                      type="text"
                      value={portables[currentPortableIndex].numero_serie}
                      onChange={(e) => updatePortable(currentPortableIndex, 'numero_serie', e.target.value)}
                      className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base bg-white border border-gray-200 rounded-lg text-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">État général</label>
                    <select
                      value={portables[currentPortableIndex].etat_general}
                      onChange={(e) => updatePortable(currentPortableIndex, 'etat_general', e.target.value)}
                      className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base bg-white border border-gray-200 rounded-lg text-slate-800"
                    >
                      <option value="Bon">Bon</option>
                      <option value="Moyen">Moyen</option>
                      <option value="Mauvais">Mauvais</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-sm font-medium text-slate-700 mb-3">Vérifications fonctionnelles</h4>
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={portables[currentPortableIndex].alarme_sonore}
                        onChange={(e) => updatePortable(currentPortableIndex, 'alarme_sonore', e.target.checked)}
                        className="w-4 h-4 flex-shrink-0"
                      />
                      <span className="text-sm sm:text-base text-slate-800">Alarme sonore</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={portables[currentPortableIndex].alarme_visuelle}
                        onChange={(e) => updatePortable(currentPortableIndex, 'alarme_visuelle', e.target.checked)}
                        className="w-4 h-4 flex-shrink-0"
                      />
                      <span className="text-sm sm:text-base text-slate-800">Alarme visuelle</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={portables[currentPortableIndex].alarme_vibrante}
                        onChange={(e) => updatePortable(currentPortableIndex, 'alarme_vibrante', e.target.checked)}
                        className="w-4 h-4 flex-shrink-0"
                      />
                      <span className="text-sm sm:text-base text-slate-800">Alarme vibrante</span>
                    </label>
                  </div>
                </div>
              </Card>

              <Card variant="glass" padding="lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-800">Gaz détectés</h3>
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
                  <p className="text-slate-600 text-center py-8">Aucun gaz ajouté</p>
                ) : (
                  <div className="space-y-6">
                    {portables[currentPortableIndex].gaz.map((gaz, gazIndex) => (
                      <Card key={gaz.id} variant="elevated" padding="md">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-slate-800">Gaz {gazIndex + 1}</h4>
                          <Button
                            onClick={() => removeGaz(currentPortableIndex, gazIndex)}
                            variant="ghost"
                            size="sm"
                            icon={<Trash2 className="w-4 h-4" />}
                          >
                            Supprimer
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Type de gaz</label>
                            <select
                              value={gaz.gaz}
                              onChange={(e) => updateGaz(currentPortableIndex, gazIndex, 'gaz', e.target.value)}
                              className="w-full px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base bg-white border border-gray-200 rounded-lg text-slate-800"
                            >
                              <option value="">Sélectionner</option>
                              {ALL_GAZ.map(g => (
                                <option key={g.value} value={g.value}>{g.label}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Gamme de mesure</label>
                            <input
                              type="text"
                              value={gaz.gamme_mesure}
                              onChange={(e) => updateGaz(currentPortableIndex, gazIndex, 'gamme_mesure', e.target.value)}
                              placeholder="Ex: 0-100 ppm"
                              className="w-full px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base bg-white border border-gray-200 rounded-lg text-slate-800"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Date remplacement cellule</label>
                            <input
                              type="date"
                              value={gaz.date_remplacement}
                              onChange={(e) => updateGaz(currentPortableIndex, gazIndex, 'date_remplacement', e.target.value)}
                              className="w-full px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base bg-white border border-gray-200 rounded-lg text-slate-800"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Prochain remplacement</label>
                            <input
                              type="date"
                              value={gaz.date_prochain_remplacement}
                              onChange={(e) => updateGaz(currentPortableIndex, gazIndex, 'date_prochain_remplacement', e.target.value)}
                              className="w-full px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base bg-white border border-gray-200 rounded-lg text-slate-800"
                            />
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h5 className="text-sm font-semibold text-slate-700 mb-3">Calibration zéro</h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            <div>
                              <label className="block text-xs text-slate-600 mb-1">Gaz zéro</label>
                              <input
                                type="text"
                                value={gaz.calibration_gaz_zero}
                                onChange={(e) => updateGaz(currentPortableIndex, gazIndex, 'calibration_gaz_zero', e.target.value)}
                                placeholder="Air ou N2"
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-slate-800 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-600 mb-1">Valeur avant</label>
                              <input
                                type="text"
                                value={gaz.calibration_valeur_avant}
                                onChange={(e) => updateGaz(currentPortableIndex, gazIndex, 'calibration_valeur_avant', e.target.value)}
                                placeholder="0.00"
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-slate-800 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-600 mb-1">Valeur après</label>
                              <input
                                type="text"
                                value={gaz.calibration_valeur_apres}
                                onChange={(e) => updateGaz(currentPortableIndex, gazIndex, 'calibration_valeur_apres', e.target.value)}
                                placeholder="0.00"
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-slate-800 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-600 mb-1">Statut</label>
                              <select
                                value={gaz.calibration_statut}
                                onChange={(e) => updateGaz(currentPortableIndex, gazIndex, 'calibration_statut', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-slate-800 text-sm"
                              >
                                <option value="OK">OK</option>
                                <option value="Dérive">Dérive</option>
                                <option value="HS">HS</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h5 className="text-sm font-semibold text-slate-700 mb-3">Étalonnage sensibilité</h5>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-3">
                            <div>
                              <label className="block text-xs text-slate-600 mb-1">Gaz</label>
                              <input
                                type="text"
                                value={gaz.etalonnage_gaz}
                                onChange={(e) => updateGaz(currentPortableIndex, gazIndex, 'etalonnage_gaz', e.target.value)}
                                placeholder="Ex: CH4"
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-slate-800 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-600 mb-1">Valeur avant réglage</label>
                              <input
                                type="text"
                                value={gaz.etalonnage_valeur_avant_reglage}
                                onChange={(e) => updateGaz(currentPortableIndex, gazIndex, 'etalonnage_valeur_avant_reglage', e.target.value)}
                                placeholder="50.0"
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-slate-800 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-600 mb-1">Valeur après réglage</label>
                              <input
                                type="text"
                                value={gaz.etalonnage_valeur_apres_reglage}
                                onChange={(e) => updateGaz(currentPortableIndex, gazIndex, 'etalonnage_valeur_apres_reglage', e.target.value)}
                                placeholder="50.0"
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-slate-800 text-sm"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                            <div>
                              <label className="block text-xs text-slate-600 mb-1">Unité</label>
                              <select
                                value={gaz.etalonnage_unite}
                                onChange={(e) => updateGaz(currentPortableIndex, gazIndex, 'etalonnage_unite', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-slate-800 text-sm"
                              >
                                <option value="%LIE">%LIE</option>
                                <option value="ppm">ppm</option>
                                <option value="%Vol">%Vol</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-slate-600 mb-1">Coefficient</label>
                              <input
                                type="text"
                                value={gaz.etalonnage_coefficient}
                                onChange={(e) => updateGaz(currentPortableIndex, gazIndex, 'etalonnage_coefficient', e.target.value)}
                                placeholder="1.00"
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-slate-800 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-600 mb-1">Statut</label>
                              <select
                                value={gaz.etalonnage_statut}
                                onChange={(e) => updateGaz(currentPortableIndex, gazIndex, 'etalonnage_statut', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-slate-800 text-sm"
                              >
                                <option value="OK">OK</option>
                                <option value="Dérive acceptable">Dérive acceptable</option>
                                <option value="Dérive limite">Dérive limite</option>
                                <option value="HS">HS</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h5 className="text-sm font-semibold text-slate-700 mb-3">Seuils d'alarme</h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                            <div>
                              <label className="block text-xs text-slate-600 mb-1">Seuil 1</label>
                              <input
                                type="text"
                                value={gaz.seuil_1}
                                onChange={(e) => updateGaz(currentPortableIndex, gazIndex, 'seuil_1', e.target.value)}
                                placeholder="Ex: 10 ppm"
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-slate-800 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-600 mb-1">Seuil 2</label>
                              <input
                                type="text"
                                value={gaz.seuil_2}
                                onChange={(e) => updateGaz(currentPortableIndex, gazIndex, 'seuil_2', e.target.value)}
                                placeholder="Ex: 20 ppm"
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-slate-800 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-600 mb-1">Seuil 3</label>
                              <input
                                type="text"
                                value={gaz.seuil_3}
                                onChange={(e) => updateGaz(currentPortableIndex, gazIndex, 'seuil_3', e.target.value)}
                                placeholder="Ex: 50 ppm"
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-slate-800 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-600 mb-1">VME</label>
                              <input
                                type="text"
                                value={gaz.vme}
                                onChange={(e) => updateGaz(currentPortableIndex, gazIndex, 'vme', e.target.value)}
                                placeholder="Ex: 100 ppm"
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-slate-800 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-600 mb-1">VLE</label>
                              <input
                                type="text"
                                value={gaz.vle}
                                onChange={(e) => updateGaz(currentPortableIndex, gazIndex, 'vle', e.target.value)}
                                placeholder="Ex: 200 ppm"
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-slate-800 text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                <div className="mt-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Pièces remplacées</label>
                  <textarea
                    value={portables[currentPortableIndex].pieces_remplacees}
                    onChange={(e) => updatePortable(currentPortableIndex, 'pieces_remplacees', e.target.value)}
                    placeholder="Cellule O2, batterie..."
                    rows={3}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-slate-800"
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
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Conclusion</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Observations générales</label>
                  <textarea
                    value={observationsGenerales}
                    onChange={(e) => setObservationsGenerales(e.target.value)}
                    placeholder="Remarques générales sur l'intervention..."
                    rows={4}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Conclusion finale</label>
                  <textarea
                    value={conclusion}
                    onChange={(e) => setConclusion(e.target.value)}
                    placeholder="Conclusion de l'intervention..."
                    rows={4}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Photos de conclusion</label>
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center bg-white">
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
                      <div className="mt-4 text-slate-700">
                        {photosConclusion.length} photo(s) sélectionnée(s)
                        <div className="mt-2 flex flex-wrap gap-2 justify-center">
                          {photosConclusion.map((photo, index) => (
                            <div key={index} className="text-sm text-slate-600">
                              {photo.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Card variant="elevated" padding="md">
                  <h3 className="font-semibold text-slate-800 mb-3">Récapitulatif</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Client:</span>
                      <span className="text-slate-800">{selectedClient?.nom}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Site:</span>
                      <span className="text-slate-800">{selectedSite?.nom}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Date:</span>
                      <span className="text-slate-800">{dateIntervention}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Détecteurs portables:</span>
                      <span className="text-slate-800">{portables.length}</span>
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

        {/* Footer fixe avec boutons d'action */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0">
            <button
              onClick={() => router.push('/admin')}
              className="flex items-center justify-center gap-2 px-4 py-2 sm:px-6 sm:py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-slate-700 rounded-lg text-sm sm:text-base font-medium transition"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Annuler
            </button>

            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
              <div className="text-xs sm:text-sm text-slate-600 text-center">
                {portables.length} portable{portables.length > 1 ? 's' : ''} configuré{portables.length > 1 ? 's' : ''}
              </div>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-6 py-2 sm:px-8 sm:py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg text-sm sm:text-base font-semibold transition shadow-md w-full sm:w-auto min-h-[44px]"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                    </svg>
                    Enregistrer le rapport
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Padding en bas pour éviter que le contenu soit masqué par le footer */}
        <div className="h-24"></div>
      </main>
    </div>
  )
}

export default function InterventionPortablePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-slate-800">Chargement...</div></div>}>
      <InterventionPortablePageContent />
    </Suspense>
  )
}