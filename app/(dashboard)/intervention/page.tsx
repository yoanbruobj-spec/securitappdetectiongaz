'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  CENTRALES_DATA,
  DETECTEURS_GAZ_DATA,
  DETECTEURS_FLAMME_DATA,
  ALL_GAZ,
  MODELES_BATTERIES,
  TYPES_CONNEXION,
  GAZ_ETALON_ZERO,
  UNITES_MESURE,
} from '@/lib/data/equipements'
import { StepIndicator } from '@/components/rapport/StepIndicator'
import { FormSection } from '@/components/rapport/FormSection'
import { FormField } from '@/components/rapport/FormField'
import { ValidationBadge } from '@/components/rapport/ValidationBadge'

type Section = 'info' | 'client' | 'centrale' | 'conclusion'

interface Seuil {
  id: string
  nom: string
  valeur: string
  unite: string
  asservissements: string
  asserv_operationnel: string // 'operationnel' | 'partiel' | 'non_operationnel'
  operationnel: boolean
  supervision: boolean
  non_teste: boolean
}

interface DetecteurGaz {
  id: string
  ligne: string
  marque: string
  modele: string
  numero_serie: string
  type_gaz: string
  type_connexion: string
  connexion_autre: string
  gamme_mesure: string
  temps_reponse: string
  valeur_avant: string
  valeur_apres: string
  gaz_zero: string
  statut_zero: string
  gaz_sensi: string
  valeur_avant_reglage: string
  valeur_apres_reglage: string
  unite_etal: string
  coefficient: string
  statut_sensi: string
  operationnel: boolean
  non_teste: boolean
  date_remplacement: string
  date_prochain_remplacement: string
  seuils: Seuil[]
}

interface DetecteurFlamme {
  id: string
  ligne: string
  marque: string
  modele: string
  numero_serie: string
  type_connexion: string
  connexion_autre: string
  gamme_mesure: string
  distance_test: string
  temps_reponse: string
  statut_test: string
  asservissements: string
  asserv_operationnel: string // 'operationnel' | 'partiel' | 'non_operationnel'
  operationnel: boolean
  non_teste: boolean
}

interface Centrale {
  id: string
  type_equipement: 'centrale' | 'automate'
  marque: string
  marque_personnalisee: string
  modele: string
  numero_serie: string
  firmware: string
  etat_general: string
  aes_presente: boolean
  aes_modele: string
  aes_statut: string
  aes_ondulee: boolean
  aes_date_remplacement: string
  aes_prochaine_echeance: string
  detecteurs_gaz: DetecteurGaz[]
  detecteurs_flamme: DetecteurFlamme[]
  observations: string
  travaux_effectues: string
  anomalies: string
  recommandations: string
  pieces_remplacees: string
}

export default function InterventionPage() {
  const router = useRouter()
  const supabase = createClient()
  const [currentSection, setCurrentSection] = useState<Section>('info')
  const [currentCentraleIndex, setCurrentCentraleIndex] = useState(0)
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

  const [centrales, setCentrales] = useState<Centrale[]>([{
    id: '1',
    marque: '',
    modele: '',
    numero_serie: '',
    firmware: '',
    etat_general: 'Bon',
    aes_presente: false,
    aes_modele: '',
    aes_statut: 'Bon',
    aes_ondulee: false,
    aes_date_remplacement: '',
    aes_prochaine_echeance: '',
    detecteurs_gaz: [],
    detecteurs_flamme: [],
    observations: '',
    travaux_effectues: '',
    anomalies: '',
    recommandations: '',
    pieces_remplacees: '',
  }])

  const [observationsGenerales, setObservationsGenerales] = useState('')
  const [conclusion, setConclusion] = useState('')
  const [photos, setPhotos] = useState<string[]>([])

  const [clients, setClients] = useState<any[]>([])
  const [sites, setSites] = useState<any[]>([])
  const [availableTechniciens, setAvailableTechniciens] = useState<any[]>([])
  const [planningInterventionId, setPlanningInterventionId] = useState<string | null>(null)

  useEffect(() => {
    loadClients()
    loadTechniciens()

    const params = new URLSearchParams(window.location.search)
    const planningId = params.get('planning_id')
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
    }
  }

  function addCentrale() {
    const newCentrale: Centrale = {
      id: Date.now().toString(),
      type_equipement: 'centrale',
      marque: '',
      marque_personnalisee: '',
      modele: '',
      numero_serie: '',
      firmware: '',
      etat_general: 'Bon',
      aes_presente: false,
      aes_modele: '',
      aes_statut: 'Bon',
      aes_ondulee: false,
      aes_date_remplacement: '',
      aes_prochaine_echeance: '',
      detecteurs_gaz: [],
      detecteurs_flamme: [],
      observations: '',
      travaux_effectues: '',
      anomalies: '',
      recommandations: '',
      pieces_remplacees: '',
    }
    setCentrales([...centrales, newCentrale])
    setCurrentCentraleIndex(centrales.length)
    setCurrentSection('centrale')
  }

  function removeCentrale(index: number) {
    const newCentrales = centrales.filter((_, i) => i !== index)
    setCentrales(newCentrales)
    if (currentCentraleIndex >= newCentrales.length) {
      setCurrentCentraleIndex(Math.max(0, newCentrales.length - 1))
    }
  }

  function updateCentrale(index: number, field: keyof Centrale, value: any) {
    setCentrales(centrales.map((c, i) => i === index ? { ...c, [field]: value } : c))
  }

  function addDetecteurGaz(centraleIndex: number) {
    setCentrales(centrales.map((c, i) => {
      if (i === centraleIndex) {
        return {
          ...c,
          detecteurs_gaz: [...c.detecteurs_gaz, {
            id: Date.now().toString(),
            ligne: '',
            marque: '',
            modele: '',
            numero_serie: '',
            type_gaz: '',
            type_connexion: '4-20mA',
            connexion_autre: '',
            gamme_mesure: '',
            temps_reponse: '',
            valeur_avant: '',
            valeur_apres: '',
            gaz_zero: 'Air synthétique 20,9%vol O2',
            statut_zero: 'OK',
            gaz_sensi: '',
            valeur_avant_reglage: '',
            valeur_apres_reglage: '',
            unite_etal: 'ppm',
            coefficient: '',
            statut_sensi: 'OK',
            operationnel: true,
            non_teste: false,
            date_remplacement: '',
            date_prochain_remplacement: '',
            seuils: [],
          }]
        }
      }
      return c
    }))
  }

  function removeDetecteurGaz(centraleIndex: number, detecteurIndex: number) {
    setCentrales(centrales.map((c, i) => {
      if (i === centraleIndex) {
        return { ...c, detecteurs_gaz: c.detecteurs_gaz.filter((_, di) => di !== detecteurIndex) }
      }
      return c
    }))
  }

  function updateDetecteurGaz(centraleIndex: number, detecteurIndex: number, field: keyof DetecteurGaz, value: any) {
    setCentrales(centrales.map((c, i) => {
      if (i === centraleIndex) {
        return {
          ...c,
          detecteurs_gaz: c.detecteurs_gaz.map((d, di) => di === detecteurIndex ? { ...d, [field]: value } : d)
        }
      }
      return c
    }))
  }

  function addSeuil(centraleIndex: number, detecteurIndex: number) {
    setCentrales(centrales.map((c, i) => {
      if (i === centraleIndex) {
        return {
          ...c,
          detecteurs_gaz: c.detecteurs_gaz.map((d, di) => {
            if (di === detecteurIndex) {
              return {
                ...d,
                seuils: [...d.seuils, {
                  id: Date.now().toString(),
                  nom: `Seuil ${d.seuils.length + 1}`,
                  valeur: '',
                  unite: 'ppm',
                  asservissements: '',
                  asserv_operationnel: 'operationnel',
                  operationnel: true,
                  supervision: false,
                  non_teste: false,
                }]
              }
            }
            return d
          })
        }
      }
      return c
    }))
  }

  function removeSeuil(centraleIndex: number, detecteurIndex: number, seuilIndex: number) {
    setCentrales(centrales.map((c, i) => {
      if (i === centraleIndex) {
        return {
          ...c,
          detecteurs_gaz: c.detecteurs_gaz.map((d, di) => {
            if (di === detecteurIndex) {
              return { ...d, seuils: d.seuils.filter((_, si) => si !== seuilIndex) }
            }
            return d
          })
        }
      }
      return c
    }))
  }

  function updateSeuil(centraleIndex: number, detecteurIndex: number, seuilIndex: number, field: keyof Seuil, value: any) {
    setCentrales(centrales.map((c, i) => {
      if (i === centraleIndex) {
        return {
          ...c,
          detecteurs_gaz: c.detecteurs_gaz.map((d, di) => {
            if (di === detecteurIndex) {
              return {
                ...d,
                seuils: d.seuils.map((s, si) => si === seuilIndex ? { ...s, [field]: value } : s)
              }
            }
            return d
          })
        }
      }
      return c
    }))
  }

  function addDetecteurFlamme(centraleIndex: number) {
    setCentrales(centrales.map((c, i) => {
      if (i === centraleIndex) {
        return {
          ...c,
          detecteurs_flamme: [...c.detecteurs_flamme, {
            id: Date.now().toString(),
            ligne: '',
            marque: '',
            modele: '',
            numero_serie: '',
            type_connexion: '4-20mA',
            connexion_autre: '',
            gamme_mesure: '',
            distance_test: '',
            temps_reponse: '',
            statut_test: 'OK',
            asservissements: '',
            asserv_operationnel: 'operationnel',
            operationnel: true,
            non_teste: false,
          }]
        }
      }
      return c
    }))
  }

  function removeDetecteurFlamme(centraleIndex: number, detecteurIndex: number) {
    setCentrales(centrales.map((c, i) => {
      if (i === centraleIndex) {
        return { ...c, detecteurs_flamme: c.detecteurs_flamme.filter((_, di) => di !== detecteurIndex) }
      }
      return c
    }))
  }

  function updateDetecteurFlamme(centraleIndex: number, detecteurIndex: number, field: keyof DetecteurFlamme, value: any) {
    setCentrales(centrales.map((c, i) => {
      if (i === centraleIndex) {
        return {
          ...c,
          detecteurs_flamme: c.detecteurs_flamme.map((d, di) => di === detecteurIndex ? { ...d, [field]: value } : d)
        }
      }
      return c
    }))
  }

  function calculateCoefficient(centraleIndex: number, detecteurIndex: number) {
    const detecteur = centrales[centraleIndex]?.detecteurs_gaz[detecteurIndex]
    if (!detecteur) return

    const theorique = parseFloat(detecteur.valeur_avant_reglage.replace(',', '.'))
    const mesuree = parseFloat(detecteur.valeur_apres_reglage.replace(',', '.'))

    if (!isNaN(theorique) && !isNaN(mesuree) && mesuree !== 0) {
      const coef = (theorique / mesuree).toFixed(3)
      updateDetecteurGaz(centraleIndex, detecteurIndex, 'coefficient', coef)
    }
  }

  async function handleSave() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const typeMapping: { [key: string]: string } = {
        'Maintenance préventive': 'maintenance_preventive',
        'Maintenance corrective': 'maintenance_corrective',
        'Installation': 'installation',
        'Mise en service': 'mise_en_service',
        'Dépannage': 'depannage',
        'Autre': 'etalonnage'
      }

      const typeDb = typeIntervention.length > 0 ? (typeMapping[typeIntervention[0]] || 'maintenance_preventive') : 'maintenance_preventive'

      const { data: intervention, error: interventionError } = await supabase
        .from('interventions')
        .insert({
          date_intervention: dateIntervention,
          heure_debut: heureDebut,
          heure_fin: heureFin,
          technicien: technicien,
          technicien_id: user.id,
          type: typeDb,
          site_id: siteId,
          local: local,
          contact_site: contactSite,
          tel_contact: telContact,
          email_rapport: emailRapport,
          observations_generales: observationsGenerales + (conclusion ? '\n\nCONCLUSION:\n' + conclusion : ''),
          statut: 'planifiee',
          planning_intervention_id: planningInterventionId,
        })
        .select()
        .single()

      if (interventionError) throw interventionError

      for (const centrale of centrales) {
        if (!centrale.marque) continue

        const { data: centraleData, error: centraleError } = await supabase
          .from('centrales')
          .insert({
            intervention_id: intervention.id,
            type_equipement: centrale.type_equipement,
            marque: centrale.marque,
            marque_personnalisee: centrale.marque_personnalisee || null,
            modele: centrale.modele,
            numero_serie: centrale.numero_serie,
            firmware: centrale.firmware,
            etat_general: centrale.etat_general,
          })
          .select()
          .single()

        if (centraleError) throw centraleError

        if (centrale.aes_presente) {
          await supabase.from('aes').insert({
            centrale_id: centraleData.id,
            presente: true,
            modele: centrale.aes_modele,
            statut: centrale.aes_statut,
            ondulee: centrale.aes_ondulee,
            date_remplacement: centrale.aes_date_remplacement || null,
            prochaine_echeance: centrale.aes_prochaine_echeance || null,
          })
        }

        if (centrale.observations || centrale.travaux_effectues || centrale.anomalies || centrale.recommandations) {
          await supabase.from('observations_centrales').insert({
            intervention_id: intervention.id,
            centrale_id: centraleData.id,
            travaux_effectues: centrale.travaux_effectues,
            anomalies_constatees: centrale.anomalies,
            recommandations: centrale.recommandations,
            pieces_remplacees: centrale.pieces_remplacees,
          })
        }

        for (const detecteur of centrale.detecteurs_gaz) {
          if (!detecteur.marque) continue

          const { data: detecteurData, error: detecteurError } = await supabase
            .from('detecteurs_gaz')
            .insert({
              centrale_id: centraleData.id,
              intervention_id: intervention.id,
              ligne: detecteur.ligne,
              marque: detecteur.marque,
              modele: detecteur.modele,
              numero_serie: detecteur.numero_serie,
              gaz: detecteur.type_gaz,
              type_connexion: detecteur.type_connexion,
              connexion_autre: detecteur.connexion_autre,
              gamme_mesure: detecteur.gamme_mesure,
              temps_reponse: detecteur.temps_reponse,
              valeur_avant: detecteur.valeur_avant ? parseFloat(detecteur.valeur_avant.replace(',', '.')) : null,
              valeur_apres: detecteur.valeur_apres ? parseFloat(detecteur.valeur_apres.replace(',', '.')) : null,
              gaz_zero: detecteur.gaz_zero,
              statut_zero: detecteur.statut_zero,
              gaz_sensi: detecteur.gaz_sensi,
              valeur_avant_reglage: detecteur.valeur_avant_reglage ? parseFloat(detecteur.valeur_avant_reglage.replace(',', '.')) : null,
              valeur_apres_reglage: detecteur.valeur_apres_reglage ? parseFloat(detecteur.valeur_apres_reglage.replace(',', '.')) : null,
              unite_etal: detecteur.unite_etal,
              coefficient: detecteur.coefficient ? parseFloat(detecteur.coefficient.replace(',', '.')) : null,
              statut_sensi: detecteur.statut_sensi,
              operationnel: detecteur.operationnel,
              non_teste: detecteur.non_teste,
              date_remplacement: detecteur.date_remplacement || null,
              date_prochain_remplacement: detecteur.date_prochain_remplacement || null,
            })
            .select()
            .single()

          if (detecteurError) throw detecteurError

          for (const seuil of detecteur.seuils) {
            if (!seuil.valeur) continue

            await supabase.from('seuils_alarme').insert({
              detecteur_gaz_id: detecteurData.id,
              niveau: parseInt(seuil.nom.match(/\d+/)?.[0] || '1'),
              valeur: seuil.valeur,
              unite: seuil.unite,
              asservissements: seuil.asservissements,
              asserv_operationnel: seuil.asserv_operationnel,
              operationnel: seuil.operationnel,
              supervision: seuil.supervision,
              non_teste: seuil.non_teste,
            })
          }
        }

        for (const detecteur of centrale.detecteurs_flamme) {
          if (!detecteur.marque) continue

          await supabase.from('detecteurs_flamme').insert({
            centrale_id: centraleData.id,
            intervention_id: intervention.id,
            ligne: detecteur.ligne,
            marque: detecteur.marque,
            modele: detecteur.modele,
            numero_serie: detecteur.numero_serie,
            type_connexion: detecteur.type_connexion,
            connexion_autre: detecteur.connexion_autre,
            asservissements: detecteur.asservissements,
            asserv_operationnel: detecteur.asserv_operationnel,
            non_teste: detecteur.non_teste,
          })
        }
      }

      // Sauvegarder les photos
      for (let i = 0; i < photos.length; i++) {
        const { error: photoError } = await supabase.from('photos').insert({
          intervention_id: intervention.id,
          url: photos[i],
          ordre: i,
          uploaded_by: user.id,
        })

        if (photoError) {
          console.error('Erreur sauvegarde photo', i, ':', photoError)
        }
      }

      alert('Intervention enregistrée avec succès !')
      router.push('/admin')
    } catch (error: any) {
      console.error('Erreur complète:', error)
      alert('Erreur lors de l\'enregistrement : ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const currentCentrale = centrales[currentCentraleIndex]

  // Définir les étapes pour le Step Indicator
  const steps = [
    { id: 'info', label: 'Informations' },
    { id: 'client', label: 'Client & Site' },
    { id: 'centrale', label: `Centrale${centrales.length > 1 ? 's' : ''} (${centrales.length})` },
    { id: 'conclusion', label: 'Conclusion' },
  ]

  const handleStepClick = (stepId: string) => {
    if (stepId === 'centrale' && currentSection !== 'centrale') {
      setCurrentCentraleIndex(0)
    }
    setCurrentSection(stepId as Section)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24 lg:pb-8">
      {/* Header avec titre et infos */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3 lg:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 lg:gap-4">
            <button
              onClick={() => router.push('/admin')}
              className="flex items-center gap-1 lg:gap-2 text-slate-600 hover:text-slate-800 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">Retour</span>
            </button>
            <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
            <h1 className="text-lg lg:text-2xl font-bold text-slate-800">
              <span className="hidden sm:inline">Nouveau Rapport - </span>Détection Fixe
            </h1>
          </div>
          {planningInterventionId && (
            <div className="flex items-center gap-2 px-2 lg:px-3 py-1 lg:py-1.5 bg-green-50 border border-green-200 rounded-lg text-xs lg:text-sm text-green-700">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <span className="hidden sm:inline">Lié au planning</span>
              <span className="sm:hidden">Planning</span>
            </div>
          )}
        </div>
      </div>

      {/* Step Indicator */}
      <StepIndicator steps={steps} currentStep={currentSection} onStepClick={handleStepClick} />

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-4 lg:py-8">
        {/* Gestion des centrales */}
        {currentSection === 'centrale' && (
          <div className="mb-4 lg:mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-3 lg:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 lg:gap-3 overflow-x-auto">
                {centrales.length > 1 ? (
                  <>
                    <span className="text-xs lg:text-sm font-medium text-slate-700 whitespace-nowrap">Centrale :</span>
                    <div className="flex gap-2">
                      {centrales.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentCentraleIndex(index)}
                          className={`px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                            currentCentraleIndex === index
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-gray-100 text-slate-700 hover:bg-gray-200'
                          }`}
                        >
                          {index + 1}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-slate-700">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium text-sm lg:text-base">Configuration de la centrale</span>
                  </div>
                )}
              </div>
              <button
                onClick={addCentrale}
                className="flex items-center justify-center gap-2 px-3 lg:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                <span className="hidden sm:inline">Ajouter une centrale</span>
                <span className="sm:hidden">Ajouter</span>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FormField label="Date d'intervention" required error={!dateIntervention ? 'Date requise' : ''}>
                    <input
                      type="date"
                      value={dateIntervention}
                      onChange={e => setDateIntervention(e.target.value)}
                      className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 transition ${
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
                      onChange={e => setHeureDebut(e.target.value)}
                      className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 transition ${
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
                      onChange={e => setHeureFin(e.target.value)}
                      className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 transition ${
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
                    onChange={e => setTechnicien(e.target.value)}
                    className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 transition ${
                      !technicien
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    } text-slate-800`}
                  >
                    <option value="">Sélectionner un technicien</option>
                    {availableTechniciens.map(tech => (
                      <option key={tech.id} value={tech.full_name}>
                        {tech.full_name}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField
                  label="Type d'intervention"
                  required
                  error={typeIntervention.length === 0 ? 'Au moins un type requis' : ''}
                >
                  <div className="grid grid-cols-2 gap-3">
                    {['Maintenance préventive', 'Maintenance corrective', 'Installation', 'Mise en service', 'Dépannage', 'Autre'].map(type => (
                      <label
                        key={type}
                        className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition ${
                          typeIntervention.includes(type)
                            ? 'bg-blue-50 border-blue-300'
                            : 'bg-white border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={typeIntervention.includes(type)}
                          onChange={e => {
                            if (e.target.checked) {
                              setTypeIntervention([...typeIntervention, type])
                            } else {
                              setTypeIntervention(typeIntervention.filter(t => t !== type))
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-slate-800 font-medium">{type}</span>
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
                  onClick={() => setCurrentSection('client')}
                  disabled={!(dateIntervention && heureDebut && heureFin && technicien && typeIntervention.length > 0)}
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
                    onChange={e => setClientId(e.target.value)}
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
                    onChange={e => setSiteId(e.target.value)}
                    disabled={!clientId}
                    className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 transition ${
                      !siteId && clientId
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    } text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <option value="">Sélectionner un site</option>
                    {sites.map(site => (
                      <option key={site.id} value={site.id}>{site.nom} - {site.ville}</option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Local" help="Zone ou local spécifique de l'intervention">
                  <input
                    type="text"
                    value={local}
                    onChange={e => setLocal(e.target.value)}
                    placeholder="Ex: Chaufferie, Local technique, Atelier..."
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  />
                </FormField>

                <div className="grid grid-cols-3 gap-4">
                  <FormField label="Contact sur site">
                    <input
                      type="text"
                      value={contactSite}
                      onChange={e => setContactSite(e.target.value)}
                      placeholder="Nom du contact"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                    />
                  </FormField>
                  <FormField label="Téléphone">
                    <input
                      type="tel"
                      value={telContact}
                      onChange={e => setTelContact(e.target.value)}
                      placeholder="06 12 34 56 78"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                    />
                  </FormField>
                  <FormField label="Email rapport">
                    <input
                      type="email"
                      value={emailRapport}
                      onChange={e => setEmailRapport(e.target.value)}
                      placeholder="email@exemple.fr"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                    />
                  </FormField>
                </div>
              </FormSection>

              {/* Boutons de navigation */}
              <div className="max-w-4xl mx-auto flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setCurrentSection('info')}
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
                    onClick={() => setCurrentSection('centrale')}
                    disabled={!(clientId && siteId)}
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

          {currentSection === 'centrale' && currentCentrale && (
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-slate-800">Centrale {currentCentraleIndex + 1}</h1>
                {centrales.length > 1 && (
                  <button
                    onClick={() => removeCentrale(currentCentraleIndex)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm text-white"
                  >
                    Supprimer cette centrale
                  </button>
                )}
              </div>

              <div className="bg-white border border-gray-300 rounded-lg p-6 space-y-8 shadow-sm">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 mb-4">Informations {currentCentrale.type_equipement === 'automate' ? 'automate' : 'centrale'}</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Type d'équipement</label>
                      <select
                        value={currentCentrale.type_equipement}
                        onChange={e => updateCentrale(currentCentraleIndex, 'type_equipement', e.target.value)}
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                      >
                        <option value="centrale">Centrale</option>
                        <option value="automate">Automate</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Marque</label>
                        <select
                          value={currentCentrale.marque}
                          onChange={e => updateCentrale(currentCentraleIndex, 'marque', e.target.value)}
                          className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                        >
                          <option value="">Sélectionner une marque</option>
                          {Object.keys(CENTRALES_DATA).map(marque => (
                            <option key={marque} value={marque}>{marque}</option>
                          ))}
                          <option value="Autre">Autre (saisie libre)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Modèle</label>
                        {currentCentrale.marque === 'Autre' ? (
                          <input
                            type="text"
                            value={currentCentrale.modele}
                            onChange={e => updateCentrale(currentCentraleIndex, 'modele', e.target.value)}
                            placeholder="Saisir le modèle"
                            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                          />
                        ) : (
                          <select
                            value={currentCentrale.modele}
                            onChange={e => updateCentrale(currentCentraleIndex, 'modele', e.target.value)}
                            disabled={!currentCentrale.marque}
                            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 disabled:opacity-50"
                          >
                            <option value="">Sélectionner un modèle</option>
                            {currentCentrale.marque && CENTRALES_DATA[currentCentrale.marque as keyof typeof CENTRALES_DATA]?.map(modele => (
                              <option key={modele} value={modele}>{modele}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>

                    {currentCentrale.marque === 'Autre' && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Marque personnalisée</label>
                        <input
                          type="text"
                          value={currentCentrale.marque_personnalisee || ''}
                          onChange={e => updateCentrale(currentCentraleIndex, 'marque_personnalisee', e.target.value)}
                          placeholder="Saisir la marque..."
                          className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">N° de série</label>
                        <input
                          type="text"
                          value={currentCentrale.numero_serie}
                          onChange={e => updateCentrale(currentCentraleIndex, 'numero_serie', e.target.value)}
                          className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Firmware</label>
                        <input
                          type="text"
                          value={currentCentrale.firmware}
                          onChange={e => updateCentrale(currentCentraleIndex, 'firmware', e.target.value)}
                          className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">État général</label>
                        <select
                          value={currentCentrale.etat_general}
                          onChange={e => updateCentrale(currentCentraleIndex, 'etat_general', e.target.value)}
                          className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                        >
                          <option value="Bon">Bon</option>
                          <option value="Acceptable">Acceptable</option>
                          <option value="À surveiller">À surveiller</option>
                          <option value="Défaillant">Défaillant</option>
                        </select>
                      </div>
                    </div>

                    <div className="border-t border-gray-300 pt-4 mt-4">
                      <label className="flex items-center space-x-2 mb-4 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentCentrale.aes_presente}
                          onChange={e => updateCentrale(currentCentraleIndex, 'aes_presente', e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="font-medium text-slate-800">AES (Alimentation de secours) présente</span>
                      </label>

                      {currentCentrale.aes_presente && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">Modèle</label>
                              <select
                                value={currentCentrale.aes_modele}
                                onChange={e => updateCentrale(currentCentraleIndex, 'aes_modele', e.target.value)}
                                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                              >
                                <option value="">Sélectionner</option>
                                {MODELES_BATTERIES.map(modele => (
                                  <option key={modele} value={modele}>{modele}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">Statut</label>
                              <select
                                value={currentCentrale.aes_statut}
                                onChange={e => updateCentrale(currentCentraleIndex, 'aes_statut', e.target.value)}
                                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                              >
                                <option value="Bon">Bon</option>
                                <option value="À surveiller">À surveiller</option>
                                <option value="Vieillissantes">Vieillissantes</option>
                                <option value="À remplacer">À remplacer</option>
                                <option value="Défaillant">Défaillant</option>
                              </select>
                            </div>
                          </div>

                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={currentCentrale.aes_ondulee}
                              onChange={e => updateCentrale(currentCentraleIndex, 'aes_ondulee', e.target.checked)}
                              className="w-4 h-4"
                            />
                            <span className="text-sm text-slate-800">Ondulée</span>
                          </label>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">Date remplacement</label>
                              <input
                                type="date"
                                value={currentCentrale.aes_date_remplacement}
                                onChange={e => updateCentrale(currentCentraleIndex, 'aes_date_remplacement', e.target.value)}
                                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">Prochaine échéance</label>
                              <input
                                type="date"
                                value={currentCentrale.aes_prochaine_echeance}
                                onChange={e => updateCentrale(currentCentraleIndex, 'aes_prochaine_echeance', e.target.value)}
                                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-300 pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-800">Détecteurs Gaz</h2>
                    <button
                      onClick={() => addDetecteurGaz(currentCentraleIndex)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white"
                    >
                      + Ajouter détecteur gaz
                    </button>
                  </div>

                  {currentCentrale.detecteurs_gaz.length === 0 ? (
                    <p className="text-slate-600 text-sm">Aucun détecteur gaz. Cliquez sur "+ Ajouter détecteur gaz" pour commencer.</p>
                  ) : (
                    <div className="space-y-4">
                      {currentCentrale.detecteurs_gaz.map((detecteur, detecteurIndex) => (
                        <div key={detecteur.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-3">
                            <h3 className="font-bold text-slate-800">Détecteur Gaz {detecteurIndex + 1}</h3>
                            {currentCentrale.detecteurs_gaz.length > 1 && (
                            <button
                              onClick={() => removeDetecteurGaz(currentCentraleIndex, detecteurIndex)}
                              className="text-red-600 hover:text-red-700 text-sm"
                            >
                              Supprimer
                            </button>
                          )}
                        </div>

                        <div className="space-y-4">
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            <div>
                              <label className="block text-xs text-slate-700 mb-1">Ligne</label>
                              <input
                                type="text"
                                value={detecteur.ligne}
                                onChange={e => updateDetecteurGaz(currentCentraleIndex, detecteurIndex, 'ligne', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-700 mb-1">Marque</label>
                              <select
                                value={detecteur.marque}
                                onChange={e => updateDetecteurGaz(currentCentraleIndex, detecteurIndex, 'marque', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                              >
                                <option value="">Sélectionner</option>
                                {Object.keys(DETECTEURS_GAZ_DATA).map(marque => (
                                  <option key={marque} value={marque}>{marque}</option>
                                ))}
                                <option value="Autre">Autre</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-slate-700 mb-1">Modèle</label>
                              {detecteur.marque === 'Autre' ? (
                                <input
                                  type="text"
                                  value={detecteur.modele}
                                  onChange={e => updateDetecteurGaz(currentCentraleIndex, detecteurIndex, 'modele', e.target.value)}
                                  placeholder="Saisir le modèle"
                                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                                />
                              ) : (
                                <select
                                  value={detecteur.modele}
                                  onChange={e => updateDetecteurGaz(currentCentraleIndex, detecteurIndex, 'modele', e.target.value)}
                                  disabled={!detecteur.marque}
                                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 disabled:opacity-50"
                                >
                                  <option value="">Sélectionner</option>
                                  {detecteur.marque && DETECTEURS_GAZ_DATA[detecteur.marque as keyof typeof DETECTEURS_GAZ_DATA]?.map(modele => (
                                    <option key={modele} value={modele}>{modele}</option>
                                  ))}
                                </select>
                              )}
                            </div>
                            <div>
                              <label className="block text-xs text-slate-700 mb-1">N° série</label>
                              <input
                                type="text"
                                value={detecteur.numero_serie}
                                onChange={e => updateDetecteurGaz(currentCentraleIndex, detecteurIndex, 'numero_serie', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-slate-700 mb-1">Type de gaz</label>
                              <select
                                value={detecteur.type_gaz}
                                onChange={e => updateDetecteurGaz(currentCentraleIndex, detecteurIndex, 'type_gaz', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                              >
                                <option value="">Sélectionner</option>
                                {ALL_GAZ.map(gaz => (
                                  <option key={gaz.value} value={gaz.value}>{gaz.label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-slate-700 mb-1">Type connexion</label>
                              <select
                                value={detecteur.type_connexion}
                                onChange={e => updateDetecteurGaz(currentCentraleIndex, detecteurIndex, 'type_connexion', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                              >
                                {TYPES_CONNEXION.map(type => (
                                  <option key={type} value={type}>{type}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {detecteur.type_connexion === 'Autre' && (
                            <div>
                              <label className="block text-xs text-slate-700 mb-1">Préciser connexion</label>
                              <input
                                type="text"
                                value={detecteur.connexion_autre}
                                onChange={e => updateDetecteurGaz(currentCentraleIndex, detecteurIndex, 'connexion_autre', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                              />
                            </div>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-slate-700 mb-1">Gamme de mesure</label>
                              <input
                                type="text"
                                value={detecteur.gamme_mesure}
                                onChange={e => updateDetecteurGaz(currentCentraleIndex, detecteurIndex, 'gamme_mesure', e.target.value)}
                                placeholder="Ex: 0-100 ppm"
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-700 mb-1">Temps de réponse</label>
                              <input
                                type="text"
                                value={detecteur.temps_reponse}
                                onChange={e => updateDetecteurGaz(currentCentraleIndex, detecteurIndex, 'temps_reponse', e.target.value)}
                                placeholder="Ex: T90 < 30s"
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-slate-700 mb-1">Date de remplacement</label>
                              <input
                                type="date"
                                value={detecteur.date_remplacement || ''}
                                onChange={e => updateDetecteurGaz(currentCentraleIndex, detecteurIndex, 'date_remplacement', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-700 mb-1">Date prochain remplacement théorique</label>
                              <input
                                type="date"
                                value={detecteur.date_prochain_remplacement || ''}
                                onChange={e => updateDetecteurGaz(currentCentraleIndex, detecteurIndex, 'date_prochain_remplacement', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                              />
                            </div>
                          </div>

                          <div className="border-t border-gray-300 pt-3">
                            <h4 className="text-sm font-semibold text-slate-800 mb-2">Test zéro</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                              <div>
                                <label className="block text-xs text-slate-700 mb-1">Gaz zéro</label>
                                <select
                                  value={detecteur.gaz_zero}
                                  onChange={e => updateDetecteurGaz(currentCentraleIndex, detecteurIndex, 'gaz_zero', e.target.value)}
                                  className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-xs text-slate-800"
                                >
                                  {GAZ_ETALON_ZERO.map(gaz => (
                                    <option key={gaz} value={gaz}>{gaz}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs text-slate-700 mb-1">Valeur avant</label>
                                <input
                                  type="text"
                                  value={detecteur.valeur_avant}
                                  onChange={e => updateDetecteurGaz(currentCentraleIndex, detecteurIndex, 'valeur_avant', e.target.value)}
                                  placeholder="0,0"
                                  className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-xs text-slate-800"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-slate-700 mb-1">Valeur après</label>
                                <input
                                  type="text"
                                  value={detecteur.valeur_apres}
                                  onChange={e => updateDetecteurGaz(currentCentraleIndex, detecteurIndex, 'valeur_apres', e.target.value)}
                                  placeholder="0,0"
                                  className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-xs text-slate-800"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-slate-700 mb-1">Statut</label>
                                <select
                                  value={detecteur.statut_zero}
                                  onChange={e => updateDetecteurGaz(currentCentraleIndex, detecteurIndex, 'statut_zero', e.target.value)}
                                  className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-xs text-slate-800"
                                >
                                  <option value="OK">OK</option>
                                  <option value="Dérive">Dérive</option>
                                  <option value="HS">HS</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-gray-300 pt-3">
                            <h4 className="text-sm font-semibold text-slate-800 mb-2">Étalonnage sensibilité</h4>
                            <div className="grid grid-cols-6 gap-2">
                              <div>
                                <label className="block text-xs text-slate-700 mb-1">Gaz étalonnage</label>
                                <input
                                  type="text"
                                  value={detecteur.gaz_sensi}
                                  onChange={e => updateDetecteurGaz(currentCentraleIndex, detecteurIndex, 'gaz_sensi', e.target.value)}
                                  placeholder="Ex: CO"
                                  className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-xs text-slate-800"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-slate-700 mb-1">Valeur avant réglage</label>
                                <input
                                  type="text"
                                  value={detecteur.valeur_avant_reglage}
                                  onChange={e => updateDetecteurGaz(currentCentraleIndex, detecteurIndex, 'valeur_avant_reglage', e.target.value)}
                                  placeholder="100"
                                  className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-xs text-slate-800"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-slate-700 mb-1">Valeur après réglage</label>
                                <input
                                  type="text"
                                  value={detecteur.valeur_apres_reglage}
                                  onChange={e => updateDetecteurGaz(currentCentraleIndex, detecteurIndex, 'valeur_apres_reglage', e.target.value)}
                                  onBlur={() => calculateCoefficient(currentCentraleIndex, detecteurIndex)}
                                  placeholder="98"
                                  className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-xs text-slate-800"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-slate-700 mb-1">Unité</label>
                                <select
                                  value={detecteur.unite_etal}
                                  onChange={e => updateDetecteurGaz(currentCentraleIndex, detecteurIndex, 'unite_etal', e.target.value)}
                                  className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-xs text-slate-800"
                                >
                                  {UNITES_MESURE.map(unite => (
                                    <option key={unite} value={unite}>{unite}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs text-slate-700 mb-1">Coefficient</label>
                                <input
                                  type="text"
                                  value={detecteur.coefficient}
                                  onChange={e => updateDetecteurGaz(currentCentraleIndex, detecteurIndex, 'coefficient', e.target.value)}
                                  className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-xs text-slate-800"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-slate-700 mb-1">Statut</label>
                                <select
                                  value={detecteur.statut_sensi}
                                  onChange={e => updateDetecteurGaz(currentCentraleIndex, detecteurIndex, 'statut_sensi', e.target.value)}
                                  className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-xs text-slate-800"
                                >
                                  <option value="OK">OK</option>
                                  <option value="Dérive acceptable">Dérive acceptable</option>
                                  <option value="Dérive limite">Dérive limite</option>
                                  <option value="HS">HS</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-gray-300 pt-3">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="text-sm font-semibold text-slate-800">Seuils d'alarme</h4>
                              <button
                                onClick={() => addSeuil(currentCentraleIndex, detecteurIndex)}
                                className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white"
                              >
                                + Ajouter seuil
                              </button>
                            </div>

                            {detecteur.seuils.length === 0 ? (
                              <p className="text-xs text-slate-600">Aucun seuil configuré</p>
                            ) : (
                              <div className="space-y-2">
                                {detecteur.seuils.map((seuil, seuilIndex) => (
                                  <div key={seuil.id} className="bg-white border border-gray-300 rounded p-3">
                                    <div className="flex justify-between items-start mb-2">
                                      <input
                                        type="text"
                                        value={seuil.nom}
                                        onChange={e => updateSeuil(currentCentraleIndex, detecteurIndex, seuilIndex, 'nom', e.target.value)}
                                        className="font-medium bg-transparent border-b border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                                        placeholder="Nom du seuil"
                                      />
                                      <button
                                        onClick={() => removeSeuil(currentCentraleIndex, detecteurIndex, seuilIndex)}
                                        className="text-red-600 hover:text-red-700 text-xs"
                                      >
                                        Supprimer
                                      </button>
                                    </div>
                                    <div className="grid grid-cols-6 gap-2">
                                      <div>
                                        <label className="block text-xs text-slate-700 mb-1">Valeur</label>
                                        <input
                                          type="text"
                                          value={seuil.valeur}
                                          onChange={e => updateSeuil(currentCentraleIndex, detecteurIndex, seuilIndex, 'valeur', e.target.value)}
                                          className="w-full px-2 py-1 bg-white border border-gray-200 rounded text-xs text-slate-800"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs text-slate-700 mb-1">Unité</label>
                                        <select
                                          value={seuil.unite}
                                          onChange={e => updateSeuil(currentCentraleIndex, detecteurIndex, seuilIndex, 'unite', e.target.value)}
                                          className="w-full px-2 py-1 bg-white border border-gray-200 rounded text-xs text-slate-800"
                                        >
                                          {UNITES_MESURE.map(unite => (
                                            <option key={unite} value={unite}>{unite}</option>
                                          ))}
                                        </select>
                                      </div>
                                      <div className="col-span-2">
                                        <label className="block text-xs text-slate-700 mb-1">Asservissements</label>
                                        <input
                                          type="text"
                                          value={seuil.asservissements}
                                          onChange={e => updateSeuil(currentCentraleIndex, detecteurIndex, seuilIndex, 'asservissements', e.target.value)}
                                          placeholder="Ex: Ventilation, Sirène..."
                                          className="w-full px-2 py-1 bg-white border border-gray-200 rounded text-xs text-slate-800"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs text-slate-700 mb-1">Asserv.</label>
                                        <select
                                          value={seuil.asserv_operationnel}
                                          onChange={e => updateSeuil(currentCentraleIndex, detecteurIndex, seuilIndex, 'asserv_operationnel', e.target.value)}
                                          className="w-full px-2 py-1 bg-white border border-gray-200 rounded text-xs text-slate-800"
                                        >
                                          <option value="operationnel">Opérationnel</option>
                                          <option value="partiel">Partiel</option>
                                          <option value="non_operationnel">Non opérationnel</option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="block text-xs text-slate-700 mb-1">Flags</label>
                                        <div className="flex gap-2 mt-1">
                                          <label className="flex items-center space-x-1 cursor-pointer" title="Opérationnel">
                                            <input
                                              type="checkbox"
                                              checked={seuil.operationnel}
                                              onChange={e => updateSeuil(currentCentraleIndex, detecteurIndex, seuilIndex, 'operationnel', e.target.checked)}
                                              className="w-3 h-3"
                                            />
                                            <span className="text-xs text-slate-800">OP</span>
                                          </label>
                                          <label className="flex items-center space-x-1 cursor-pointer" title="Supervision">
                                            <input
                                              type="checkbox"
                                              checked={seuil.supervision}
                                              onChange={e => updateSeuil(currentCentraleIndex, detecteurIndex, seuilIndex, 'supervision', e.target.checked)}
                                              className="w-3 h-3"
                                            />
                                            <span className="text-xs text-slate-800">SUP</span>
                                          </label>
                                          <label className="flex items-center space-x-1 cursor-pointer" title="Non testé">
                                            <input
                                              type="checkbox"
                                              checked={seuil.non_teste}
                                              onChange={e => updateSeuil(currentCentraleIndex, detecteurIndex, seuilIndex, 'non_teste', e.target.checked)}
                                              className="w-3 h-3"
                                            />
                                            <span className="text-xs text-slate-800">NT</span>
                                          </label>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="border-t border-gray-300 pt-3">
                            <div className="flex gap-4">
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={detecteur.operationnel}
                                  onChange={e => updateDetecteurGaz(currentCentraleIndex, detecteurIndex, 'operationnel', e.target.checked)}
                                  className="w-4 h-4"
                                />
                                <span className="text-sm text-slate-800">Opérationnel</span>
                              </label>
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={detecteur.non_teste}
                                  onChange={e => updateDetecteurGaz(currentCentraleIndex, detecteurIndex, 'non_teste', e.target.checked)}
                                  className="w-4 h-4"
                                />
                                <span className="text-sm text-slate-800">Non testé</span>
                              </label>
                            </div>
                          </div>
                        </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-300 pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-800">Détecteurs Flamme</h2>
                    <button
                      onClick={() => addDetecteurFlamme(currentCentraleIndex)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white"
                    >
                      + Ajouter détecteur flamme
                    </button>
                  </div>

                  {currentCentrale.detecteurs_flamme.length === 0 ? (
                    <p className="text-slate-600 text-sm">Aucun détecteur flamme. Cliquez sur "+ Ajouter détecteur flamme" pour commencer.</p>
                  ) : (
                    <div className="space-y-4">
                      {currentCentrale.detecteurs_flamme.map((detecteur, detecteurIndex) => (
                        <div key={detecteur.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-3">
                            <h3 className="font-bold text-slate-800">Détecteur Flamme {detecteurIndex + 1}</h3>
                            {currentCentrale.detecteurs_flamme.length > 1 && (
                            <button
                              onClick={() => removeDetecteurFlamme(currentCentraleIndex, detecteurIndex)}
                              className="text-red-600 hover:text-red-700 text-sm"
                            >
                              Supprimer
                            </button>
                          )}
                        </div>

                        <div className="space-y-4">
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            <div>
                              <label className="block text-xs text-slate-700 mb-1">Ligne</label>
                              <input
                                type="text"
                                value={detecteur.ligne}
                                onChange={e => updateDetecteurFlamme(currentCentraleIndex, detecteurIndex, 'ligne', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-700 mb-1">Marque</label>
                              <select
                                value={detecteur.marque}
                                onChange={e => updateDetecteurFlamme(currentCentraleIndex, detecteurIndex, 'marque', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                              >
                                <option value="">Sélectionner</option>
                                {Object.keys(DETECTEURS_FLAMME_DATA).map(marque => (
                                  <option key={marque} value={marque}>{marque}</option>
                                ))}
                                <option value="Autre">Autre</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-slate-700 mb-1">Modèle</label>
                              {detecteur.marque === 'Autre' ? (
                                <input
                                  type="text"
                                  value={detecteur.modele}
                                  onChange={e => updateDetecteurFlamme(currentCentraleIndex, detecteurIndex, 'modele', e.target.value)}
                                  placeholder="Saisir le modèle"
                                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                                />
                              ) : (
                                <select
                                  value={detecteur.modele}
                                  onChange={e => updateDetecteurFlamme(currentCentraleIndex, detecteurIndex, 'modele', e.target.value)}
                                  disabled={!detecteur.marque}
                                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 disabled:opacity-50"
                                >
                                  <option value="">Sélectionner</option>
                                  {detecteur.marque && DETECTEURS_FLAMME_DATA[detecteur.marque as keyof typeof DETECTEURS_FLAMME_DATA]?.map(modele => (
                                    <option key={modele} value={modele}>{modele}</option>
                                  ))}
                                </select>
                              )}
                            </div>
                            <div>
                              <label className="block text-xs text-slate-700 mb-1">N° série</label>
                              <input
                                type="text"
                                value={detecteur.numero_serie}
                                onChange={e => updateDetecteurFlamme(currentCentraleIndex, detecteurIndex, 'numero_serie', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-slate-700 mb-1">Type connexion</label>
                              <select
                                value={detecteur.type_connexion}
                                onChange={e => updateDetecteurFlamme(currentCentraleIndex, detecteurIndex, 'type_connexion', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                              >
                                <option value="">Sélectionner</option>
                                {TYPES_CONNEXION.map(type => (
                                  <option key={type} value={type}>{type}</option>
                                ))}
                              </select>
                            </div>
                            {detecteur.type_connexion === 'Autre' && (
                              <div>
                                <label className="block text-xs text-slate-700 mb-1">Préciser type connexion</label>
                                <input
                                  type="text"
                                  value={detecteur.type_connexion_autre || ''}
                                  onChange={e => updateDetecteurFlamme(currentCentraleIndex, detecteurIndex, 'type_connexion_autre', e.target.value)}
                                  placeholder="Préciser..."
                                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                                />
                              </div>
                            )}
                          </div>

                          <div className="border-t border-gray-300 pt-3">
                            <h4 className="text-sm font-semibold text-slate-800 mb-2">Test flamme</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              <div>
                                <label className="block text-xs text-slate-700 mb-1">Distance test</label>
                                <input
                                  type="text"
                                  value={detecteur.distance_test}
                                  onChange={e => updateDetecteurFlamme(currentCentraleIndex, detecteurIndex, 'distance_test', e.target.value)}
                                  placeholder="Ex: 3m"
                                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-slate-700 mb-1">Temps de réponse</label>
                                <input
                                  type="text"
                                  value={detecteur.temps_reponse}
                                  onChange={e => updateDetecteurFlamme(currentCentraleIndex, detecteurIndex, 'temps_reponse', e.target.value)}
                                  placeholder="Ex: < 5s"
                                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-slate-700 mb-1">Statut</label>
                                <select
                                  value={detecteur.statut_test}
                                  onChange={e => updateDetecteurFlamme(currentCentraleIndex, detecteurIndex, 'statut_test', e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                                >
                                  <option value="OK">OK</option>
                                  <option value="Dérive">Dérive</option>
                                  <option value="HS">HS</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-gray-300 pt-3">
                            <h4 className="text-sm font-semibold text-slate-800 mb-2">Asservissements</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs text-slate-700 mb-1">Asservissements</label>
                                <input
                                  type="text"
                                  value={detecteur.asservissements}
                                  onChange={e => updateDetecteurFlamme(currentCentraleIndex, detecteurIndex, 'asservissements', e.target.value)}
                                  placeholder="Ex: Ventilation, Sirène..."
                                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-slate-700 mb-1">Asservissements</label>
                                <select
                                  value={detecteur.asserv_operationnel}
                                  onChange={e => updateDetecteurFlamme(currentCentraleIndex, detecteurIndex, 'asserv_operationnel', e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                                >
                                  <option value="operationnel">Opérationnel</option>
                                  <option value="partiel">Partiellement opérationnel</option>
                                  <option value="non_operationnel">Non opérationnel</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-gray-300 pt-3">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={detecteur.operationnel}
                                onChange={e => updateDetecteurFlamme(currentCentraleIndex, detecteurIndex, 'operationnel', e.target.checked)}
                                className="w-4 h-4"
                              />
                              <span className="text-sm text-slate-800">Opérationnel</span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={detecteur.non_teste}
                                onChange={e => updateDetecteurFlamme(currentCentraleIndex, detecteurIndex, 'non_teste', e.target.checked)}
                                className="w-4 h-4"
                              />
                              <span className="text-sm text-slate-800">Non testé</span>
                            </label>
                          </div>
                        </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-300 pt-6">
                  <h2 className="text-xl font-bold text-slate-800 mb-4">Conclusion Centrale {currentCentraleIndex + 1}</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-700 mb-2">Travaux effectués</label>
                      <textarea
                        value={currentCentrale.travaux_effectues}
                        onChange={e => updateCentrale(currentCentraleIndex, 'travaux_effectues', e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-700 mb-2">Anomalies constatées</label>
                      <textarea
                        value={currentCentrale.anomalies}
                        onChange={e => updateCentrale(currentCentraleIndex, 'anomalies', e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-700 mb-2">Recommandations</label>
                      <textarea
                        value={currentCentrale.recommandations}
                        onChange={e => updateCentrale(currentCentraleIndex, 'recommandations', e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-700 mb-2">Pièces remplacées</label>
                      <textarea
                        value={currentCentrale.pieces_remplacees}
                        onChange={e => updateCentrale(currentCentraleIndex, 'pieces_remplacees', e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentSection === 'conclusion' && (
            <div className="max-w-4xl mx-auto">
              <h1 className="text-3xl font-bold text-slate-800 mb-6">Conclusion Finale</h1>
              <div className="bg-white border border-gray-300 rounded-lg p-6 space-y-6 shadow-sm">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Observations générales</label>
                  <textarea
                    value={observationsGenerales}
                    onChange={e => setObservationsGenerales(e.target.value)}
                    rows={4}
                    placeholder="Observations générales sur l'intervention..."
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Conclusion</label>
                  <textarea
                    value={conclusion}
                    onChange={e => setConclusion(e.target.value)}
                    rows={4}
                    placeholder="Conclusion de l'intervention..."
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  />
                </div>

                <div className="border-t border-gray-300 pt-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Photos</h3>
                  <div>
                    <label className="block">
                      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors">
                        <svg className="w-12 h-12 text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className="text-slate-600 text-sm mb-1">Cliquer pour ajouter des photos</p>
                        <p className="text-slate-600 text-xs">PNG, JPG jusqu'à 10MB</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={e => {
                          const files = Array.from(e.target.files || [])
                          files.forEach(file => {
                            const reader = new FileReader()
                            reader.onload = () => {
                              setPhotos(prev => [...prev, reader.result as string])
                            }
                            reader.readAsDataURL(file)
                          })
                        }}
                      />
                    </label>
                    {photos.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
                        {photos.map((photo, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={photo}
                              alt={`Photo ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <button
                              onClick={() => setPhotos(photos.filter((_, i) => i !== index))}
                              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-300 pt-6">
                  <button
                    onClick={handleSave}
                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                  >
                    Enregistrer l'intervention
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer fixe avec boutons d'action */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
          <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
            <button
              onClick={() => router.push('/admin')}
              className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-slate-700 rounded-lg font-medium transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Annuler
            </button>

            <div className="flex items-center gap-3">
              <div className="text-sm text-slate-600">
                {centrales.length} centrale{centrales.length > 1 ? 's' : ''} configurée{centrales.length > 1 ? 's' : ''}
              </div>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 px-8 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition shadow-md"
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