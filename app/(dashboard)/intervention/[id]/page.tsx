'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { generateInterventionPDF } from '@/lib/pdf/generateInterventionPDF'

export default function InterventionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  
  const [intervention, setIntervention] = useState<any>(null)
  const [centrales, setCentrales] = useState<any[]>([])
  const [photos, setPhotos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingPDF, setGeneratingPDF] = useState(false)

  useEffect(() => {
    if (params.id) {
      loadIntervention()
    }
  }, [params.id])

  async function loadIntervention() {
    setLoading(true)

    const { data: interventionData } = await supabase
      .from('interventions')
      .select(`
        *,
        sites (
          nom,
          adresse,
          ville,
          clients (nom)
        )
      `)
      .eq('id', params.id)
      .single()

    if (interventionData) {
      if (interventionData.type_rapport === 'portable') {
        router.push(`/intervention-portable/${params.id}`)
        return
      }
      setIntervention(interventionData)
    }

    const { data: centralesData } = await supabase
      .from('centrales')
      .select('*')
      .eq('intervention_id', params.id)

    if (centralesData) {
      setCentrales(centralesData)
    }

    const { data: photosData } = await supabase
      .from('photos')
      .select('*')
      .eq('intervention_id', params.id)

    if (photosData) {
      setPhotos(photosData)
    }

    setLoading(false)
  }

  async function handleGeneratePDF() {
    try {
      setGeneratingPDF(true)

      // Charger toutes les données nécessaires
      const { data: centralesCompletes } = await supabase
        .from('centrales')
        .select('*')
        .eq('intervention_id', params.id)

      const centralesAvecDetecteurs = []

      for (const centrale of centralesCompletes || []) {
        // Charger détecteurs gaz
        const { data: detecteursGaz } = await supabase
          .from('detecteurs_gaz')
          .select('*')
          .eq('centrale_id', centrale.id)

        // Charger seuils pour chaque détecteur gaz
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

        // Charger détecteurs flamme
        const { data: detecteursFlamme } = await supabase
          .from('detecteurs_flamme')
          .select('*')
          .eq('centrale_id', centrale.id)

        // Charger observations
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

      // Générer le PDF
      await generateInterventionPDF({
        intervention,
        centrales: centralesAvecDetecteurs,
        site: intervention.sites,
        client: intervention.sites?.clients,
        photos,
      })

      alert('PDF généré avec succès !')
    } catch (error) {
      console.error('Erreur génération PDF:', error)
      alert('Erreur lors de la génération du PDF')
    } finally {
      setGeneratingPDF(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-slate-600">Chargement...</div>
      </div>
    )
  }

  if (!intervention) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-slate-600">Intervention non trouvée</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-300 shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/interventions')}
              className="text-slate-600 hover:text-slate-900 font-medium"
            >
              ← Retour
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Intervention du {new Date(intervention.date_intervention).toLocaleDateString('fr-FR')}</h1>
              <p className="text-sm text-slate-600">{intervention.sites?.clients?.nom}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/intervention/${params.id}/edit`)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
            >
              Modifier
            </button>
            <button
              onClick={handleGeneratePDF}
              disabled={generatingPDF}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 transition-colors shadow-sm"
            >
              {generatingPDF ? 'Génération...' : 'Générer PDF'}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-8 py-8">
        <div className="space-y-6">
          {/* Informations générales */}
          <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Informations générales</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm text-slate-500 font-medium mb-2">Client</h3>
                <p className="text-lg text-slate-800">{intervention.sites?.clients?.nom}</p>
              </div>
              <div>
                <h3 className="text-sm text-slate-500 font-medium mb-2">Site</h3>
                <p className="text-lg text-slate-800">{intervention.sites?.nom}</p>
                <p className="text-sm text-slate-600">{intervention.sites?.adresse}, {intervention.sites?.ville}</p>
              </div>
              <div>
                <h3 className="text-sm text-slate-500 font-medium mb-2">Date</h3>
                <p className="text-lg text-slate-800">{new Date(intervention.date_intervention).toLocaleDateString('fr-FR')}</p>
              </div>
              <div>
                <h3 className="text-sm text-slate-500 font-medium mb-2">Horaires</h3>
                <p className="text-lg text-slate-800">
                  {intervention.heure_debut && intervention.heure_fin
                    ? `${intervention.heure_debut} - ${intervention.heure_fin}`
                    : '-'}
                </p>
              </div>
              <div>
                <h3 className="text-sm text-slate-500 font-medium mb-2">Type</h3>
                <p className="text-lg text-slate-800 capitalize">{intervention.type?.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <h3 className="text-sm text-slate-500 font-medium mb-2">Statut</h3>
                <span className={`inline-block px-3 py-1 rounded-lg text-sm font-medium ${
                  intervention.statut === 'terminee' ? 'bg-green-100 text-green-700' :
                  intervention.statut === 'en_cours' ? 'bg-blue-100 text-blue-700' :
                  intervention.statut === 'planifiee' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {intervention.statut}
                </span>
              </div>
            </div>
          </div>

          {/* Centrales */}
          <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Centrales ({centrales.length})</h2>
            {centrales.length === 0 ? (
              <p className="text-slate-600">Aucune centrale enregistrée</p>
            ) : (
              <div className="space-y-4">
                {centrales.map((centrale, index) => (
                  <div key={centrale.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="font-bold text-slate-800 mb-2">Centrale {index + 1}</h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500 font-medium">Marque</p>
                        <p className="text-slate-800">{centrale.marque}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-medium">Modèle</p>
                        <p className="text-slate-800">{centrale.modele}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-medium">N° série</p>
                        <p className="text-slate-800">{centrale.numero_serie || '-'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-medium">Firmware</p>
                        <p className="text-slate-800">{centrale.firmware || '-'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-medium">État général</p>
                        <p className="text-slate-800">{centrale.etat_general}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/interventions')}
              className="flex-1 px-6 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-slate-700 rounded-lg transition-colors font-medium shadow-sm"
            >
              Retour à la liste
            </button>
            <button
              onClick={() => router.push(`/intervention/${params.id}/edit`)}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm"
            >
              Modifier l'intervention
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}