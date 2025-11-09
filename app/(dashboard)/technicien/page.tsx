'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Plus, FileText, Calendar, Building2, LogOut, ClipboardList, Clock } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { StatCard } from '@/components/ui/StatCard'
import { Skeleton } from '@/components/ui/Skeleton'

export default function TechnicienDashboard() {
  const router = useRouter()
  const supabase = createClient()
  
  const [profile, setProfile] = useState<any>(null)
  const [interventions, setInterventions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [stats, setStats] = useState({
    total: 0,
    enCours: 0,
    terminees: 0,
    planifiees: 0
  })

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

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileData?.role !== 'technicien') {
      router.push('/admin')
      return
    }

    setProfile(profileData)
    setLoading(false)
  }

  async function loadInterventions() {
    setLoading(true)

    let query = supabase
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
      .order('date_intervention', { ascending: false })

    if (filter !== 'all') {
      query = query.eq('statut', filter)
    }

    const { data } = await query

    if (data) {
      setInterventions(data)

      setStats({
        total: data.length,
        enCours: data.filter(i => i.statut === 'en_cours').length,
        terminees: data.filter(i => i.statut === 'terminee').length,
        planifiees: data.filter(i => i.statut === 'planifiee').length
      })
    }
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="space-y-4 w-full max-w-6xl px-8">
          <div className="grid grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} variant="glass" padding="md">
                <Skeleton height="120px" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-lg">
        <div className="p-6 border-b border-gray-200 bg-slate-800">
          <div className="flex items-center justify-center">
            <Image
              src="/logo-securit-blanc.png"
              alt="SÉCUR'IT"
              width={160}
              height={40}
              priority
              className="object-contain"
            />
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => router.push('/select-rapport-type')}
            className="w-full flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-xl font-medium transform hover:scale-[1.02]"
          >
            <div className="p-1.5 bg-white/20 rounded-lg">
              <Plus className="w-5 h-5" />
            </div>
            <span>Nouveau rapport</span>
          </button>

          <div className="pt-2 pb-1">
            <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Navigation</p>
          </div>

          <button
            onClick={() => router.push('/interventions')}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition-all font-medium group"
          >
            <div className="p-1.5 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
              <FileText className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-sm">Mes rapports</span>
          </button>

          <button
            onClick={() => router.push('/planning')}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-green-50 hover:text-green-700 rounded-lg transition-all font-medium group"
          >
            <div className="p-1.5 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
              <Calendar className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-sm">Planning</span>
          </button>

          <div className="pt-3 pb-1">
            <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Gestion</p>
          </div>

          <button
            onClick={() => router.push('/clients')}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-orange-50 hover:text-orange-700 rounded-lg transition-all font-medium group"
          >
            <div className="p-1.5 bg-orange-50 rounded-lg group-hover:bg-orange-100 transition-colors">
              <Building2 className="w-4 h-4 text-orange-600" />
            </div>
            <span className="text-sm">Clients</span>
          </button>
        </nav>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="mb-3 px-2">
            <p className="text-xs text-slate-500 mb-1">Connecté en tant que</p>
            <p className="text-sm text-slate-800 font-medium truncate">{profile?.full_name}</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="secondary"
            size="sm"
            icon={<LogOut className="w-4 h-4" />}
            className="w-full"
          >
            Déconnexion
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 shadow-sm px-8 py-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-slate-800 mb-1">Mes interventions</h2>
                <p className="text-slate-600">Bienvenue {profile?.full_name} 👋</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </motion.div>
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-8">
          <div className="grid grid-cols-4 gap-6 mb-6">
            <div onClick={() => setFilter('all')} className="cursor-pointer transform transition-transform hover:scale-105">
              <StatCard
                title="Total"
                value={stats.total}
                icon={ClipboardList}
                color="blue"
              />
            </div>
            <div onClick={() => setFilter('en_cours')} className="cursor-pointer transform transition-transform hover:scale-105">
              <StatCard
                title="En cours"
                value={stats.enCours}
                icon={Clock}
                color="orange"
              />
            </div>
            <div onClick={() => setFilter('terminee')} className="cursor-pointer transform transition-transform hover:scale-105">
              <StatCard
                title="Terminées"
                value={stats.terminees}
                icon={FileText}
                color="green"
              />
            </div>
            <div onClick={() => setFilter('planifiee')} className="cursor-pointer transform transition-transform hover:scale-105">
              <StatCard
                title="Planifiées"
                value={stats.planifiees}
                icon={Calendar}
                color="purple"
              />
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">
                {filter === 'all' ? 'Toutes les interventions' :
                 filter === 'en_cours' ? 'Interventions en cours' :
                 filter === 'terminee' ? 'Interventions terminées' :
                 'Interventions planifiées'}
              </h3>
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
                <Button
                  onClick={() => setFilter('planifiee')}
                  variant={filter === 'planifiee' ? 'primary' : 'secondary'}
                  size="sm"
                >
                  Planifiées
                </Button>
              </div>
            </div>
          </div>

          {interventions.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-xl">
              <ClipboardList className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="font-medium text-slate-600">Aucune intervention assignée</p>
              <p className="text-sm text-slate-500 mt-1">Les interventions qui vous sont attribuées apparaîtront ici</p>
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
                    onClick={() => {
                      if (intervention.type_rapport === 'portable') {
                        router.push(`/intervention-portable/${intervention.id}`)
                      } else {
                        router.push(`/intervention/${intervention.id}`)
                      }
                    }}
                    className="cursor-pointer group bg-gray-50 hover:bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-all duration-200"
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
                        <p className="text-sm text-slate-600 flex items-center gap-2 mb-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {intervention.sites?.nom}
                        </p>
                        <p className="text-xs text-slate-500">
                          {intervention.sites?.adresse}, {intervention.sites?.ville}
                        </p>
                      </div>
                      <Badge
                        variant={
                          intervention.statut === 'terminee' ? 'success' :
                          intervention.statut === 'en_cours' ? 'info' :
                          intervention.statut === 'planifiee' ? 'warning' :
                          'default'
                        }
                        size="sm"
                      >
                        {intervention.statut === 'terminee' ? 'Terminée' :
                         intervention.statut === 'en_cours' ? 'En cours' :
                         intervention.statut === 'planifiee' ? 'Planifiée' :
                         intervention.statut}
                      </Badge>
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
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}