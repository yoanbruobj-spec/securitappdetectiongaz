'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { generateInterventionPortablePDF } from '@/lib/pdf/generateInterventionPortablePDF'
import { SynthesePortables } from '@/components/rapport/SynthesePortables'
import { SignalerAnomalieModal } from '@/components/rapport/SignalerAnomalieModal'

export default function InterventionPortableDetailPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  const [intervention, setIntervention] = useState<any>(null)
  const [portables, setPortables] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [anomalieModalOpen, setAnomalieModalOpen] = useState(false)
  const [selectedEquipement, setSelectedEquipement] = useState<any>(null)

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
          code_postal,
          client_id,
          clients (nom)
        )
      `)
      .eq('id', params.id)
      .single()

    if (interventionData) {
      setIntervention(interventionData)
    }

    const { data: verificationsData } = await supabase
      .from('portables_verifications')
      .select('portable_id, alarme_sonore, alarme_visuelle, alarme_vibrante')
      .eq('intervention_id', params.id)

    if (verificationsData && verificationsData.length > 0) {
      const portableIds = verificationsData.map(v => v.portable_id)

      const { data: portablesData } = await supabase
        .from('portables')
        .select('*')
        .in('id', portableIds)

      const { data: gazData } = await supabase
        .from('portables_gaz')
        .select('*')
        .eq('intervention_id', params.id)

      if (portablesData) {
        const portablesWithDetails = portablesData.map(portable => ({
          ...portable,
          portables_verifications: verificationsData.filter(v => v.portable_id === portable.id),
          portables_gaz: gazData?.filter(g => g.portable_id === portable.id) || []
        }))
        setPortables(portablesWithDetails)
      }
    }

    setLoading(false)
  }

  async function handleGeneratePDF() {
    try {
      setGeneratingPDF(true)

      const portablesComplets = []

      for (const portable of portables) {
        const portableAvecDetails = {
          ...portable,
          portables_verifications: portable.portables_verifications || [],
          portables_gaz: portable.portables_gaz || []
        }
        portablesComplets.push(portableAvecDetails)
      }

      await generateInterventionPortablePDF({
        intervention,
        portables: portablesComplets,
        site: intervention.sites,
        client: intervention.sites?.clients,
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
        <div className="text-slate-800">Chargement...</div>
      </div>
    )
  }

  if (!intervention) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-slate-800">Intervention non trouvée</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800">
      <nav className="bg-white border-b border-gray-300 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/interventions')}
              className="text-slate-600 hover:text-slate-800"
            >
              ← Retour
            </button>
            <h1 className="text-xl font-bold text-slate-800">Intervention Portable du {new Date(intervention.date_intervention).toLocaleDateString('fr-FR')}</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/intervention-portable/${params.id}/edit`)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Modifier
            </button>
            <button
              onClick={handleGeneratePDF}
              disabled={generatingPDF}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
            >
              {generatingPDF ? 'Génération...' : 'Générer PDF'}
            </button>
            <button
              onClick={() => {
                setSelectedEquipement(null)
                setAnomalieModalOpen(true)
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
            >
              Signaler anomalie
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Informations générales */}
          <div className="bg-white border border-gray-300 shadow-sm rounded-lg p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Informations générales</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm text-slate-700 font-medium mb-2">Client</h3>
                <p className="text-lg text-slate-800">{intervention.sites?.clients?.nom}</p>
              </div>
              <div>
                <h3 className="text-sm text-slate-700 font-medium mb-2">Site</h3>
                <p className="text-lg text-slate-800">{intervention.sites?.nom}</p>
                <p className="text-sm text-slate-600">{intervention.sites?.adresse}, {intervention.sites?.ville}</p>
              </div>
              <div>
                <h3 className="text-sm text-slate-700 font-medium mb-2">Date</h3>
                <p className="text-lg text-slate-800">{new Date(intervention.date_intervention).toLocaleDateString('fr-FR')}</p>
              </div>
              <div>
                <h3 className="text-sm text-slate-700 font-medium mb-2">Horaires</h3>
                <p className="text-lg text-slate-800">
                  {intervention.heure_debut && intervention.heure_fin
                    ? `${intervention.heure_debut} - ${intervention.heure_fin}`
                    : '-'}
                </p>
              </div>
              <div>
                <h3 className="text-sm text-slate-700 font-medium mb-2">Type</h3>
                <p className="text-lg text-slate-800 capitalize">{intervention.type?.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <h3 className="text-sm text-slate-700 font-medium mb-2">Statut</h3>
                <span className={`inline-block px-3 py-1 rounded text-sm ${
                  intervention.statut === 'terminee' ? 'bg-green-500/20 text-green-400' :
                  intervention.statut === 'en_cours' ? 'bg-blue-500/20 text-blue-400' :
                  intervention.statut === 'planifiee' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-slate-500/20 text-slate-400'
                }`}>
                  {intervention.statut}
                </span>
              </div>
              {intervention.technicien && (
                <div>
                  <h3 className="text-sm text-slate-700 font-medium mb-2">Technicien</h3>
                  <p className="text-lg text-slate-800">{intervention.technicien}</p>
                </div>
              )}
              {intervention.local && (
                <div>
                  <h3 className="text-sm text-slate-700 font-medium mb-2">Local</h3>
                  <p className="text-lg text-slate-800">{intervention.local}</p>
                </div>
              )}
            </div>
            {intervention.observations_generales && (
              <div className="mt-6">
                <h3 className="text-sm text-slate-700 font-medium mb-2">Observations générales</h3>
                <p className="text-base text-slate-800">{intervention.observations_generales}</p>
              </div>
            )}
          </div>

          {/* Détecteurs portables */}
          <div className="bg-white border border-gray-300 shadow-sm rounded-lg p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Détecteurs portables ({portables.length})</h2>
            {portables.length === 0 ? (
              <p className="text-slate-600">Aucun détecteur portable enregistré</p>
            ) : (
              <div className="space-y-6">
                {portables.map((portable, index) => (
                  <div key={portable.id} className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <h3 className="font-bold text-lg text-slate-800 mb-4">Détecteur #{index + 1}</h3>

                    {/* Informations du portable */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                      <div>
                        <p className="text-slate-600 text-sm">Marque</p>
                        <p className="font-medium text-slate-800">{portable.marque}</p>
                      </div>
                      <div>
                        <p className="text-slate-600 text-sm">Modèle</p>
                        <p className="font-medium text-slate-800">{portable.modele}</p>
                      </div>
                      <div>
                        <p className="text-slate-600 text-sm">N° série</p>
                        <p className="font-medium text-slate-800">{portable.numero_serie || '-'}</p>
                      </div>
                      <div>
                        <p className="text-slate-600 text-sm">État général</p>
                        <p className="font-medium text-slate-800">{portable.etat_general}</p>
                      </div>
                    </div>

                    {/* Vérifications */}
                    {portable.portables_verifications?.[0] && (
                      <div className="mb-6 bg-white border border-gray-300 rounded p-4">
                        <p className="text-sm text-slate-700 mb-3 font-semibold">Vérifications</p>
                        <div className="flex gap-6">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={portable.portables_verifications[0].alarme_sonore}
                              disabled
                              className="w-4 h-4"
                            />
                            <span className="text-sm text-slate-800">Alarme sonore</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={portable.portables_verifications[0].alarme_visuelle}
                              disabled
                              className="w-4 h-4"
                            />
                            <span className="text-sm text-slate-800">Alarme visuelle</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={portable.portables_verifications[0].alarme_vibrante}
                              disabled
                              className="w-4 h-4"
                            />
                            <span className="text-sm text-slate-800">Alarme vibrante</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Gaz détectés */}
                    {portable.portables_gaz?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-slate-800 mb-3">Gaz détectés</h4>
                        <div className="space-y-4">
                          {portable.portables_gaz.map((gaz: any) => (
                            <div key={gaz.id} className="bg-white border border-gray-300 rounded p-4">
                              <p className="font-semibold text-blue-600 mb-3">{gaz.gaz}</p>
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <p className="text-slate-600">Gamme de mesure</p>
                                  <p className="text-slate-800">{gaz.gamme_mesure || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-slate-600">Date remplacement</p>
                                  <p className="text-slate-800">{gaz.date_remplacement ? new Date(gaz.date_remplacement).toLocaleDateString('fr-FR') : '-'}</p>
                                </div>
                                <div>
                                  <p className="text-slate-600">Prochain remplacement</p>
                                  <p className="text-slate-800">{gaz.date_prochain_remplacement ? new Date(gaz.date_prochain_remplacement).toLocaleDateString('fr-FR') : '-'}</p>
                                </div>
                              </div>

                              {/* Calibration */}
                              {gaz.calibration_statut && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <p className="text-sm font-semibold text-slate-700 mb-2">Calibration</p>
                                  <div className="grid grid-cols-4 gap-4 text-sm">
                                    <div>
                                      <p className="text-slate-600">Gaz zéro</p>
                                      <p className="text-slate-800">{gaz.calibration_gaz_zero || '-'}</p>
                                    </div>
                                    <div>
                                      <p className="text-slate-600">Valeur avant</p>
                                      <p className="text-slate-800">{gaz.calibration_valeur_avant ?? '-'}</p>
                                    </div>
                                    <div>
                                      <p className="text-slate-600">Valeur après</p>
                                      <p className="text-slate-800">{gaz.calibration_valeur_apres ?? '-'}</p>
                                    </div>
                                    <div>
                                      <p className="text-slate-600">Statut</p>
                                      <span className={`inline-block px-2 py-1 rounded text-xs ${
                                        gaz.calibration_statut === 'OK' ? 'bg-green-500/20 text-green-400' :
                                        gaz.calibration_statut === 'Dérive' ? 'bg-yellow-500/20 text-yellow-400' :
                                        'bg-red-500/20 text-red-400'
                                      }`}>
                                        {gaz.calibration_statut}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Étalonnage */}
                              {gaz.etalonnage_statut && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <p className="text-sm font-semibold text-slate-700 mb-2">Étalonnage</p>
                                  <div className="grid grid-cols-5 gap-4 text-sm">
                                    <div>
                                      <p className="text-slate-600">Gaz</p>
                                      <p className="text-slate-800">{gaz.etalonnage_gaz || '-'}</p>
                                    </div>
                                    <div>
                                      <p className="text-slate-600">Avant réglage</p>
                                      <p className="text-slate-800">{gaz.etalonnage_valeur_avant_reglage ?? '-'}</p>
                                    </div>
                                    <div>
                                      <p className="text-slate-600">Après réglage</p>
                                      <p className="text-slate-800">{gaz.etalonnage_valeur_apres_reglage ?? '-'}</p>
                                    </div>
                                    <div>
                                      <p className="text-slate-600">Coefficient</p>
                                      <p className="text-slate-800">{gaz.etalonnage_coefficient ?? '-'} {gaz.etalonnage_unite || ''}</p>
                                    </div>
                                    <div>
                                      <p className="text-slate-600">Statut</p>
                                      <span className={`inline-block px-2 py-1 rounded text-xs ${
                                        gaz.etalonnage_statut === 'OK' ? 'bg-green-500/20 text-green-400' :
                                        gaz.etalonnage_statut?.includes('acceptable') ? 'bg-yellow-500/20 text-yellow-400' :
                                        'bg-red-500/20 text-red-400'
                                      }`}>
                                        {gaz.etalonnage_statut}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Conclusion */}
          {intervention.conclusion_generale && (
            <div className="bg-white border border-gray-300 shadow-sm rounded-lg p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-4">Conclusion</h2>
              <p className="text-base text-slate-800">{intervention.conclusion_generale}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/interventions')}
              className="flex-1 px-6 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-slate-800 rounded-lg"
            >
              Retour à la liste
            </button>
            <button
              onClick={() => router.push(`/intervention-portable/${params.id}/edit`)}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Modifier l'intervention
            </button>
          </div>
        </div>
      </main>

      {/* Modal Signaler Anomalie */}
      <SignalerAnomalieModal
        isOpen={anomalieModalOpen}
        onClose={() => setAnomalieModalOpen(false)}
        interventionId={params.id as string}
        clientId={intervention?.sites?.client_id}
        siteId={intervention?.site_id}
        portableId={selectedEquipement?.portableId}
        typeEquipement={selectedEquipement?.type || 'portable'}
      />
    </div>
  )
}