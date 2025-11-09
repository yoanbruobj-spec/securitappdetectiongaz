'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus, FileText, Trash2, Download, Eye } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'

export default function InterventionsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [interventions, setInterventions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
    loadInterventions()
  }, [filter])

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

  async function loadInterventions() {
    setLoading(true)
    
    let query = supabase
      .from('interventions')
      .select(`
        *,
        sites (
          nom,
          clients (nom)
        )
      `)
      .order('date_intervention', { ascending: false })

    if (filter !== 'all') {
      query = query.eq('statut', filter)
    }

    const { data } = await query
    
    if (data) {
      setInterventions(data)
    }
    setLoading(false)
  }

  async function updateStatut(interventionId: string, newStatut: string, event: React.MouseEvent) {
    event.stopPropagation()

    const { error } = await supabase
      .from('interventions')
      .update({ statut: newStatut })
      .eq('id', interventionId)

    if (error) {
      console.error('Erreur mise à jour statut:', error)
      alert('Erreur lors de la mise à jour du statut')
    } else {
      loadInterventions()
    }
  }

  async function handleDelete(interventionId: string, event: React.MouseEvent) {
    event.stopPropagation()

    if (!confirm('Êtes-vous sûr de vouloir supprimer cette intervention ? Cette action est irréversible.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('interventions')
        .delete()
        .eq('id', interventionId)

      if (error) throw error

      alert('Intervention supprimée avec succès')
      loadInterventions()
    } catch (error: any) {
      console.error('Erreur suppression:', error)
      alert('Erreur lors de la suppression : ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex flex-col">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push('/admin')}
              variant="ghost"
              size="sm"
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Retour
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                  Mes rapports
                </h1>
                <p className="text-sm text-gray-600">Gérez toutes vos interventions</p>
              </div>
            </div>
          </div>
          <Button
            onClick={() => router.push('/select-rapport-type')}
            variant="primary"
            icon={<Plus className="w-5 h-5" />}
          >
            Nouvelle intervention
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-8 py-8">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {filter === 'all' ? 'Toutes les interventions' :
                 filter === 'en_cours' ? 'Interventions en cours' :
                 'Interventions terminées'}
              </h2>
              <div className="flex gap-2">
                <Button
                  onClick={() => setFilter('all')}
                  variant={filter === 'all' ? 'primary' : 'secondary'}
                  size="sm"
                >
                  Toutes
                </Button>
                <Button
                  onClick={() => setFilter('en_cours')}
                  variant={filter === 'en_cours' ? 'primary' : 'secondary'}
                  size="sm"
                >
                  En cours
                </Button>
                <Button
                  onClick={() => setFilter('terminee')}
                  variant={filter === 'terminee' ? 'primary' : 'secondary'}
                  size="sm"
                >
                  Terminées
                </Button>
              </div>
            </div>
          </div>

          {interventions.length === 0 ? (
            <div className="flex items-center justify-center min-h-[500px]">
              <Card variant="glass" padding="lg" className="bg-white shadow-xl ring-1 ring-gray-200 max-w-3xl w-full">
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg">
                    <FileText className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Aucune intervention trouvée</h3>
                  <p className="text-gray-600 mb-8">
                    {filter !== 'all'
                      ? `Aucune intervention ${filter === 'en_cours' ? 'en cours' : 'terminée'} pour le moment.`
                      : 'Commencez par créer votre première intervention.'
                    }
                  </p>
                  <Button
                    onClick={() => router.push('/select-rapport-type')}
                    variant="primary"
                    icon={<Plus className="w-5 h-5" />}
                    className="shadow-lg"
                  >
                    Nouvelle intervention
                  </Button>
                </div>
              </Card>
            </div>
          ) : (
            <div className="space-y-3">
              {interventions.map((intervention, index) => (
                <motion.div
                  key={intervention.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div
                    className="cursor-pointer group bg-gradient-to-br from-gray-50 to-white hover:from-white hover:to-gray-50 border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-emerald-200 transition-all duration-200"
                    onClick={() => {
                      if (intervention.type_rapport === 'portable') {
                        router.push(`/intervention-portable/${intervention.id}`)
                      } else {
                        router.push(`/intervention/${intervention.id}`)
                      }
                    }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-900 group-hover:text-emerald-600 transition">
                            {intervention.sites?.clients?.nom}
                          </p>
                          <Badge
                            variant={intervention.type_rapport === 'portable' ? 'info' : 'default'}
                            size="sm"
                          >
                            {intervention.type_rapport === 'portable' ? 'Portable' : 'Fixe'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {intervention.sites?.nom}
                        </p>
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Badge
                          variant={
                            intervention.statut === 'terminee' ? 'success' :
                            intervention.statut === 'en_cours' ? 'info' :
                            'warning'
                          }
                          size="sm"
                        >
                          {intervention.statut === 'terminee' ? 'Terminée' :
                           intervention.statut === 'en_cours' ? 'En cours' :
                           intervention.statut}
                        </Badge>
                        <Button
                          onClick={() => {
                            if (intervention.type_rapport === 'portable') {
                              router.push(`/intervention-portable/${intervention.id}`)
                            } else {
                              router.push(`/intervention/${intervention.id}`)
                            }
                          }}
                          variant="secondary"
                          size="sm"
                          icon={<Eye className="w-4 h-4" />}
                        >
                          Voir
                        </Button>
                        {userRole === 'admin' && (
                          <Button
                            onClick={(e) => handleDelete(intervention.id, e)}
                            variant="danger"
                            size="sm"
                            icon={<Trash2 className="w-4 h-4" />}
                          >
                            Supprimer
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        {new Date(intervention.date_intervention).toLocaleDateString('fr-FR')}
                      </span>
                      {intervention.type && (
                        <span className="capitalize">
                          {intervention.type?.replace(/_/g, ' ')}
                        </span>
                      )}
                      {intervention.heure_debut && intervention.heure_fin && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          {intervention.heure_debut} - {intervention.heure_fin}
                        </span>
                      )}
                      {intervention.technicien && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                          {intervention.technicien}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}