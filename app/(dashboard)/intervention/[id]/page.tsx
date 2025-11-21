'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { generateInterventionPDF } from '@/lib/pdf/generateInterventionPDF'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Edit,
  FileText,
  MapPin,
  Calendar,
  Clock,
  Tag,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'

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

      const { data: centralesCompletes } = await supabase
        .from('centrales')
        .select('*')
        .eq('intervention_id', params.id)

      const centralesAvecDetecteurs = []

      for (const centrale of centralesCompletes || []) {
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto mb-4 border-4 border-gray-200 border-t-emerald-500 rounded-full"
          />
          <p className="text-slate-600">Chargement...</p>
        </motion.div>
      </div>
    )
  }

  if (!intervention) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-slate-600">Intervention non trouvée</p>
          <Button
            onClick={() => router.push('/interventions')}
            variant="secondary"
            className="mt-4"
          >
            Retour à la liste
          </Button>
        </motion.div>
      </div>
    )
  }

  const statusConfig = {
    terminee: { variant: 'success' as const, label: 'Terminée' },
    en_cours: { variant: 'info' as const, label: 'En cours' },
    planifiee: { variant: 'warning' as const, label: 'Planifiée' },
  }

  const status = statusConfig[intervention.statut as keyof typeof statusConfig] || {
    variant: 'default' as const,
    label: intervention.statut
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-gradient-to-r from-white/80 via-white/60 to-white/80 backdrop-blur-2xl border-b border-gray-200/50 shadow-xl sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 lg:py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push('/interventions')}
                variant="ghost"
                size="sm"
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                <span className="hidden sm:inline">Retour</span>
              </Button>
              <div>
                <h1 className="text-lg lg:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                  Intervention du {new Date(intervention.date_intervention).toLocaleDateString('fr-FR')}
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  {intervention.sites?.clients?.nom}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => router.push(`/intervention/${params.id}/edit`)}
                variant="secondary"
                size="sm"
                icon={<Edit className="w-4 h-4" />}
              >
                <span className="hidden sm:inline">Modifier</span>
              </Button>
              <Button
                onClick={handleGeneratePDF}
                disabled={generatingPDF}
                variant="primary"
                size="sm"
                icon={generatingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              >
                {generatingPDF ? 'Génération...' : <><span className="hidden sm:inline">Générer</span> PDF</>}
              </Button>
            </div>
          </div>
        </div>
      </motion.nav>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
        <div className="space-y-6">
          {/* Informations générales */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card variant="glass" padding="lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/50">
                  <FileText className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <h2 className="text-xl lg:text-2xl font-bold text-slate-800">
                  Informations générales
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Client */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-br from-white/60 to-gray-50/60 backdrop-blur-sm p-4 rounded-xl border border-gray-200/50"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Client
                    </p>
                  </div>
                  <p className="text-lg font-bold text-slate-800">
                    {intervention.sites?.clients?.nom}
                  </p>
                </motion.div>

                {/* Site */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                  className="bg-gradient-to-br from-white/60 to-gray-50/60 backdrop-blur-sm p-4 rounded-xl border border-gray-200/50"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-cyan-600" />
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Site
                    </p>
                  </div>
                  <p className="text-lg font-bold text-slate-800">
                    {intervention.sites?.nom}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    {intervention.sites?.adresse}, {intervention.sites?.ville}
                  </p>
                </motion.div>

                {/* Date */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-br from-white/60 to-gray-50/60 backdrop-blur-sm p-4 rounded-xl border border-gray-200/50"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Date
                    </p>
                  </div>
                  <p className="text-lg font-bold text-slate-800">
                    {new Date(intervention.date_intervention).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </motion.div>

                {/* Horaires */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 }}
                  className="bg-gradient-to-br from-white/60 to-gray-50/60 backdrop-blur-sm p-4 rounded-xl border border-gray-200/50"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Horaires
                    </p>
                  </div>
                  <p className="text-lg font-bold text-slate-800">
                    {intervention.heure_debut && intervention.heure_fin
                      ? `${intervention.heure_debut} - ${intervention.heure_fin}`
                      : '-'}
                  </p>
                </motion.div>

                {/* Type */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-gradient-to-br from-white/60 to-gray-50/60 backdrop-blur-sm p-4 rounded-xl border border-gray-200/50"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4 text-orange-600" />
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Type
                    </p>
                  </div>
                  <p className="text-lg font-bold text-slate-800 capitalize">
                    {intervention.type?.replace(/_/g, ' ')}
                  </p>
                </motion.div>

                {/* Statut */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 }}
                  className="bg-gradient-to-br from-white/60 to-gray-50/60 backdrop-blur-sm p-4 rounded-xl border border-gray-200/50"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Statut
                    </p>
                  </div>
                  <Badge variant={status.variant} size="md">
                    {status.label}
                  </Badge>
                </motion.div>
              </div>
            </Card>
          </motion.div>

          {/* Centrales */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card variant="glass" padding="lg">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/50">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                  </div>
                  <h2 className="text-xl lg:text-2xl font-bold text-slate-800">
                    Centrales
                  </h2>
                </div>
                <Badge variant="info" size="md">
                  {centrales.length} {centrales.length > 1 ? 'centrales' : 'centrale'}
                </Badge>
              </div>

              {centrales.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-slate-600">Aucune centrale enregistrée</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {centrales.map((centrale, index) => (
                    <motion.div
                      key={centrale.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="bg-gradient-to-br from-gray-50/80 to-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl p-5 hover:shadow-lg hover:border-emerald-300/50 transition-all"
                    >
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 text-white text-xs flex items-center justify-center font-bold">
                          {index + 1}
                        </span>
                        Centrale {index + 1}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-sm">
                        <div>
                          <p className="text-slate-500 font-medium mb-1">Marque</p>
                          <p className="text-slate-800 font-semibold">{centrale.marque}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 font-medium mb-1">Modèle</p>
                          <p className="text-slate-800 font-semibold">{centrale.modele}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 font-medium mb-1">N° série</p>
                          <p className="text-slate-800 font-semibold">{centrale.numero_serie || '-'}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 font-medium mb-1">Firmware</p>
                          <p className="text-slate-800 font-semibold">{centrale.firmware || '-'}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 font-medium mb-1">État général</p>
                          <Badge
                            variant={centrale.etat_general === 'bon' ? 'success' : centrale.etat_general === 'moyen' ? 'warning' : 'danger'}
                            size="sm"
                          >
                            {centrale.etat_general}
                          </Badge>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button
              onClick={() => router.push('/interventions')}
              variant="secondary"
              className="flex-1"
              icon={<ArrowLeft className="w-5 h-5" />}
            >
              Retour à la liste
            </Button>
            <Button
              onClick={() => router.push(`/intervention/${params.id}/edit`)}
              variant="primary"
              className="flex-1"
              icon={<Edit className="w-5 h-5" />}
            >
              Modifier l'intervention
            </Button>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
