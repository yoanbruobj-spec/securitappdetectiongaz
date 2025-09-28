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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white">Chargement...</div>
      </div>
    )
  }

  if (!intervention) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white">Intervention non trouvée</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/interventions')}
              className="text-slate-400 hover:text-white"
            >
              ← Retour
            </button>
            <h1 className="text-xl font-bold">Intervention du {new Date(intervention.date_intervention).toLocaleDateString('fr-FR')}</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/intervention/${params.id}/edit`)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              Modifier
            </button>
            <button
              onClick={handleGeneratePDF}
              disabled={generatingPDF}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50"
            >
              {generatingPDF ? 'Génération...' : 'Générer PDF'}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Informations générales */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Informations générales</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm text-slate-400 mb-2">Client</h3>
                <p className="text-lg">{intervention.sites?.clients?.nom}</p>
              </div>
              <div>
                <h3 className="text-sm text-slate-400 mb-2">Site</h3>
                <p className="text-lg">{intervention.sites?.nom}</p>
                <p className="text-sm text-slate-400">{intervention.sites?.adresse}, {intervention.sites?.ville}</p>
              </div>
              <div>
                <h3 className="text-sm text-slate-400 mb-2">Date</h3>
                <p className="text-lg">{new Date(intervention.date_intervention).toLocaleDateString('fr-FR')}</p>
              </div>
              <div>
                <h3 className="text-sm text-slate-400 mb-2">Horaires</h3>
                <p className="text-lg">
                  {intervention.heure_debut && intervention.heure_fin 
                    ? `${intervention.heure_debut} - ${intervention.heure_fin}`
                    : '-'}
                </p>
              </div>
              <div>
                <h3 className="text-sm text-slate-400 mb-2">Type</h3>
                <p className="text-lg capitalize">{intervention.type?.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <h3 className="text-sm text-slate-400 mb-2">Statut</h3>
                <span className={`inline-block px-3 py-1 rounded text-sm ${
                  intervention.statut === 'terminee' ? 'bg-green-500/20 text-green-400' :
                  intervention.statut === 'en_cours' ? 'bg-blue-500/20 text-blue-400' :
                  intervention.statut === 'planifiee' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-slate-500/20 text-slate-400'
                }`}>
                  {intervention.statut}
                </span>
              </div>
            </div>
          </div>

          {/* Centrales */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Centrales ({centrales.length})</h2>
            {centrales.length === 0 ? (
              <p className="text-slate-400">Aucune centrale enregistrée</p>
            ) : (
              <div className="space-y-4">
                {centrales.map((centrale, index) => (
                  <div key={centrale.id} className="bg-slate-800 rounded-lg p-4">
                    <h3 className="font-bold mb-2">Centrale {index + 1}</h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-slate-400">Marque</p>
                        <p>{centrale.marque}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Modèle</p>
                        <p>{centrale.modele}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">N° série</p>
                        <p>{centrale.numero_serie || '-'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Firmware</p>
                        <p>{centrale.firmware || '-'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">État général</p>
                        <p>{centrale.etat_general}</p>
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
              className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg"
            >
              Retour à la liste
            </button>
            <button
              onClick={() => router.push(`/intervention/${params.id}/edit`)}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              Modifier l'intervention
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}