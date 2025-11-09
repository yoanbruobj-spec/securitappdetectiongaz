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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="space-y-4 w-full max-w-6xl px-8">
          {[1, 2, 3].map(i => (
            <Card key={i} variant="glass" padding="lg">
              <Skeleton height="100px" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="px-8 py-4 flex items-center justify-between">
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
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-600 to-green-500 shadow-lg shadow-green-500/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-800">Mes rapports</h1>
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
              <h2 className="text-xl font-bold text-slate-800">
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
              <Card variant="glass" padding="lg" className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 max-w-3xl w-full">
                <div className="text-center py-8">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center">
                    <FileText className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-3">Aucune intervention trouvée</h3>
                  <p className="text-slate-600 mb-8">
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
                    className="cursor-pointer group bg-gray-50 hover:bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-all duration-200"
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
                          <p className="font-semibold text-slate-800 group-hover:text-blue-600 transition">
                            {intervention.sites?.clients?.nom}
                          </p>
                          <Badge
                            variant={intervention.type_rapport === 'portable' ? 'info' : 'default'}
                            size="sm"
                          >
                            {intervention.type_rapport === 'portable' ? 'Portable' : 'Fixe'}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600">{intervention.sites?.nom}</p>
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

                    <div className="flex items-center gap-6 text-sm text-slate-500">
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