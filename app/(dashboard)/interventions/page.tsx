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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-300 shadow-sm sticky top-0 z-50">
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

      <main className="flex-1 overflow-y-auto px-8 py-6">
        <Card variant="glass" padding="md" className="mb-6 bg-white border border-gray-300 rounded-lg">
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
        </Card>

        {interventions.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 mx-auto mb-4 text-slate-600" />
            <p className="text-slate-600 text-lg">Aucune intervention trouvée</p>
          </div>
        ) : (
          <div className="space-y-4">
            {interventions.map((intervention, index) => (
              <motion.div
                key={intervention.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  variant="glass"
                  padding="lg"
                  hover
                  className="cursor-pointer bg-white border border-gray-300 rounded-lg"
                  onClick={() => {
                    if (intervention.type_rapport === 'portable') {
                      router.push(`/intervention-portable/${intervention.id}`)
                    } else {
                      // Par défaut ou si type_rapport = 'fixe'
                      router.push(`/intervention/${intervention.id}`)
                    }
                  }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-1 text-slate-800">
                        {intervention.sites?.clients?.nom}
                      </h3>
                      <p className="text-slate-600">{intervention.sites?.nom}</p>
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={intervention.statut}
                        onChange={(e) => updateStatut(intervention.id, e.target.value, e as any)}
                        className="px-3 py-1.5 rounded-lg text-sm cursor-pointer border-0 bg-gray-50 border border-gray-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="en_cours">En cours</option>
                        <option value="terminee">Terminée</option>
                      </select>
                      <Badge
                        variant={
                          intervention.statut === 'terminee' ? 'success' :
                          intervention.statut === 'en_cours' ? 'info' :
                          'warning'
                        }
                      >
                        {intervention.statut === 'terminee' ? 'Terminée' :
                         intervention.statut === 'en_cours' ? 'En cours' :
                         intervention.statut}
                      </Badge>
                      <Button
                        onClick={() => router.push(`/intervention/${intervention.id}`)}
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

                  <div className="grid grid-cols-3 gap-6 text-sm">
                    <div>
                      <p className="text-slate-500 mb-1 text-xs">Date</p>
                      <p className="text-slate-800 font-medium">
                        {new Date(intervention.date_intervention).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-1 text-xs">Type</p>
                      <p className="text-slate-800 font-medium capitalize">
                        {intervention.type?.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-1 text-xs">Horaires</p>
                      <p className="text-slate-800 font-medium">
                        {intervention.heure_debut && intervention.heure_fin
                          ? `${intervention.heure_debut} - ${intervention.heure_fin}`
                          : '-'}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}