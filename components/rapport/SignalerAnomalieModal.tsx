'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, AlertTriangle, Loader2 } from 'lucide-react'

interface SignalerAnomalieModalProps {
  isOpen: boolean
  onClose: () => void
  interventionId: string
  clientId: string
  siteId: string
  centraleId?: string
  detecteurGazId?: string
  detecteurFlammeId?: string
  portableId?: string
  typeEquipement?: 'centrale' | 'automate' | 'detecteur_gaz' | 'detecteur_flamme' | 'portable' | 'autre'
}

export function SignalerAnomalieModal({
  isOpen,
  onClose,
  interventionId,
  clientId,
  siteId,
  centraleId,
  detecteurGazId,
  detecteurFlammeId,
  portableId,
  typeEquipement = 'autre'
}: SignalerAnomalieModalProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [description, setDescription] = useState('')
  const [priorite, setPriorite] = useState<'basse' | 'moyenne' | 'haute' | 'critique'>('moyenne')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!description.trim()) {
      alert('Veuillez décrire l\'anomalie')
      return
    }

    if (!clientId || !siteId) {
      alert('Erreur: Les informations du client et du site sont manquantes')
      return
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase.from('suivi_anomalies').insert({
        intervention_id: interventionId,
        client_id: clientId,
        site_id: siteId,
        centrale_id: centraleId || null,
        detecteur_gaz_id: detecteurGazId || null,
        detecteur_flamme_id: detecteurFlammeId || null,
        portable_id: portableId || null,
        type_equipement: typeEquipement,
        description_anomalie: description,
        priorite,
        statut: 'devis_attente',
        date_constat: new Date().toISOString().split('T')[0],
        created_by: user?.id || null
      })

      if (error) {
        console.error('Erreur Supabase:', error)
        throw error
      }

      alert('Anomalie signalée avec succès !')
      setDescription('')
      setPriorite('moyenne')
      onClose()
    } catch (error: any) {
      console.error('Erreur lors de la création de l\'anomalie:', error)
      console.error('Message:', error?.message)
      console.error('Détails:', error?.details)
      console.error('Code:', error?.code)
      alert(`Erreur lors du signalement de l'anomalie: ${error?.message || 'Erreur inconnue'}`)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Signaler une anomalie</h2>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700">
                Description de l'anomalie *
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
                required
                placeholder="Décrivez l'anomalie constatée en détail..."
                className="w-full px-3 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 resize-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700">
                Priorité
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { value: 'basse', label: 'Basse', color: 'bg-blue-500' },
                  { value: 'moyenne', label: 'Moyenne', color: 'bg-amber-500' },
                  { value: 'haute', label: 'Haute', color: 'bg-orange-500' },
                  { value: 'critique', label: 'Critique', color: 'bg-red-500' }
                ].map(({ value, label, color }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPriorite(value as any)}
                    className={`px-4 py-3 rounded-lg font-medium transition-all ${
                      priorite === value
                        ? `${color} text-white shadow-lg`
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Information :</strong> L'anomalie sera créée avec le statut "Devis en attente"
                et pourra être suivie dans la section "Anomalies" du menu.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-11 px-6 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 h-11 px-6 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg shadow-lg shadow-red-500/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  "Signaler l'anomalie"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
