'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Users, Building2, Clock, FileText, ArrowLeft, X, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'

// Fonction utilitaire pour formater les dates en tenant compte du timezone local
function formatDateToLocal(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function PlanningPage() {
  const router = useRouter()
  const supabase = createClient()

  const [planningInterventions, setPlanningInterventions] = useState<any[]>([])
  const [techniciens, setTechniciens] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [sites, setSites] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedPlanning, setSelectedPlanning] = useState<any>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedTechniciens, setSelectedTechniciens] = useState<string[]>([])
  const [draggedPlanning, setDraggedPlanning] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'global' | 'par_technicien'>('global')
  const [selectedTechnicienFilter, setSelectedTechnicienFilter] = useState<string>('')
  const [formData, setFormData] = useState({
    client_id: '',
    site_id: '',
    date_intervention: '',
    heure_debut: '',
    heure_fin: '',
    type: 'verification_periodique',
    statut: 'planifiee',
    notes: '',
    techniciens: [] as string[]
  })

  useEffect(() => {
    checkAuth()
    loadData()
  }, [currentDate, selectedTechnicienFilter])

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

    if (!profileData || (profileData.role !== 'admin' && profileData.role !== 'technicien')) {
      router.push('/login')
      return
    }

    setProfile(profileData)
  }

  async function loadData() {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

    // Les policies RLS gèrent automatiquement l'accès
    // Admin voit tout, Technicien voit uniquement ses interventions assignées
    const { data: planningData, error: planningError } = await supabase
      .from('planning_interventions')
      .select(`
        *,
        sites (
          nom,
          adresse,
          ville,
          clients (nom, telephone)
        )
      `)
      .gte('date_intervention', formatDateToLocal(startOfMonth))
      .lte('date_intervention', formatDateToLocal(endOfMonth))
      .order('date_intervention', { ascending: true })

    if (planningError) {
      console.error('Erreur chargement planning:', planningError)
    }

    console.log('Planning data loaded:', planningData?.length, 'interventions')

    if (planningData) {
      const planningWithTech = await Promise.all(
        planningData.map(async (planning) => {
          const { data: techAssignments } = await supabase
            .from('planning_techniciens')
            .select('technicien_id, role_technicien')
            .eq('planning_intervention_id', planning.id)

          if (techAssignments && techAssignments.length > 0) {
            const techIds = techAssignments.map(t => t.technicien_id)
            const { data: profilesData } = await supabase
              .from('profiles')
              .select('id, full_name, role')
              .in('id', techIds)

            const techWithProfiles = techAssignments.map(assignment => ({
              ...assignment,
              profiles: profilesData?.find(p => p.id === assignment.technicien_id)
            }))

            return {
              ...planning,
              techniciens: techWithProfiles
            }
          }

          return {
            ...planning,
            techniciens: []
          }
        })
      )
      setPlanningInterventions(planningWithTech)
    }

    const { data: techniciensData } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['technicien', 'admin'])
      .order('full_name')

    if (techniciensData) {
      setTechniciens(techniciensData)
    }

    const { data: clientsData } = await supabase
      .from('clients')
      .select('*')
      .order('nom')

    if (clientsData) {
      setClients(clientsData)
    }

    const { data: sitesData } = await supabase
      .from('sites')
      .select('*')
      .order('nom')

    if (sitesData) {
      setSites(sitesData)
    }

    setLoading(false)
  }

  function getDaysInMonth() {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  function getPlanningForDate(date: Date | null) {
    if (!date) return []
    const dateStr = formatDateToLocal(date)
    let filtered = planningInterventions.filter(p => p.date_intervention === dateStr)

    if (viewMode === 'par_technicien' && selectedTechnicienFilter) {
      filtered = filtered.filter(p =>
        p.techniciens.some((t: any) => t.technicien_id === selectedTechnicienFilter)
      )
    }

    return filtered
  }

  function previousMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  function nextMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  function openEditModal(planning: any) {
    setSelectedPlanning(planning)
    setSelectedTechniciens(planning.techniciens.map((t: any) => t.technicien_id))
    setFormData({
      client_id: planning.sites?.clients?.id || '',
      site_id: planning.site_id,
      date_intervention: planning.date_intervention,
      heure_debut: planning.heure_debut || '',
      heure_fin: planning.heure_fin || '',
      type: planning.type,
      statut: planning.statut,
      notes: planning.notes || '',
      techniciens: planning.techniciens.map((t: any) => t.technicien_id)
    })
    setShowEditModal(true)
  }

  function openCreateModal() {
    setFormData({
      client_id: '',
      site_id: '',
      date_intervention: formatDateToLocal(new Date()),
      heure_debut: '',
      heure_fin: '',
      type: 'verification_periodique',
      statut: 'planifiee',
      notes: '',
      techniciens: []
    })
    setShowCreateModal(true)
  }

  async function handleCreatePlanning() {
    try {
      if (!formData.site_id || !formData.date_intervention) {
        alert('Veuillez remplir tous les champs obligatoires')
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: planningData, error: planningError } = await supabase
        .from('planning_interventions')
        .insert({
          site_id: formData.site_id,
          date_intervention: formData.date_intervention,
          heure_debut: formData.heure_debut || null,
          heure_fin: formData.heure_fin || null,
          type: formData.type,
          statut: formData.statut,
          notes: formData.notes || null,
          created_by: user.id
        })
        .select()
        .single()

      if (planningError) throw planningError

      if (planningData) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profileData?.role === 'admin' && formData.techniciens.length > 0) {
          for (const technicienId of formData.techniciens) {
            await supabase
              .from('planning_techniciens')
              .insert({
                planning_intervention_id: planningData.id,
                technicien_id: technicienId,
                role_technicien: 'principal'
              })
          }
        } else if (profileData?.role === 'technicien') {
          await supabase
            .from('planning_techniciens')
            .insert({
              planning_intervention_id: planningData.id,
              technicien_id: user.id,
              role_technicien: 'principal'
            })
        }
      }

      alert('Intervention planifiée avec succès')
      setShowCreateModal(false)
      loadData()
    } catch (error: any) {
      console.error('Erreur:', error)
      alert('Erreur lors de la création: ' + error.message)
    }
  }

  async function handleUpdatePlanning() {
    if (!selectedPlanning) return

    try {
      if (!formData.site_id || !formData.date_intervention) {
        alert('Veuillez remplir tous les champs obligatoires')
        return
      }

      const { error: updateError } = await supabase
        .from('planning_interventions')
        .update({
          site_id: formData.site_id,
          date_intervention: formData.date_intervention,
          heure_debut: formData.heure_debut || null,
          heure_fin: formData.heure_fin || null,
          type: formData.type,
          statut: formData.statut,
          notes: formData.notes || null
        })
        .eq('id', selectedPlanning.id)

      if (updateError) throw updateError

      const { error: deleteError } = await supabase
        .from('planning_techniciens')
        .delete()
        .eq('planning_intervention_id', selectedPlanning.id)

      if (deleteError) throw deleteError

      if (formData.techniciens.length > 0) {
        for (const technicienId of formData.techniciens) {
          await supabase
            .from('planning_techniciens')
            .insert({
              planning_intervention_id: selectedPlanning.id,
              technicien_id: technicienId,
              role_technicien: 'principal'
            })
        }
      }

      alert('Modifications enregistrées avec succès')
      setShowEditModal(false)
      await loadData()
    } catch (error: any) {
      console.error('Erreur:', error)
      alert('Erreur lors de l\'enregistrement: ' + error.message)
    }
  }

  async function handleDeletePlanning() {
    if (!selectedPlanning) return

    if (!confirm('Êtes-vous sûr de vouloir supprimer cette intervention planifiée ?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('planning_interventions')
        .delete()
        .eq('id', selectedPlanning.id)

      if (error) throw error

      alert('Intervention supprimée avec succès')
      setShowEditModal(false)
      loadData()
    } catch (error: any) {
      console.error('Erreur:', error)
      alert('Erreur lors de la suppression: ' + error.message)
    }
  }

  async function handleDateChange(planningId: string, newDate: string) {
    try {
      const { error } = await supabase
        .from('planning_interventions')
        .update({ date_intervention: newDate })
        .eq('id', planningId)

      if (error) throw error

      loadData()
    } catch (error: any) {
      console.error('Erreur:', error)
      alert('Erreur lors du déplacement: ' + error.message)
    }
  }

  function handleCreateRapport(planning: any) {
    router.push(`/select-rapport-type?planning_id=${planning.id}`)
  }

  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

  const getStatusColor = (statut: string) => {
    switch(statut) {
      case 'planifiee': return 'bg-blue-100 border-blue-500 text-blue-800'
      case 'en_cours': return 'bg-amber-100 border-amber-500 text-amber-800'
      case 'annulee': return 'bg-red-100 border-red-500 text-red-800'
      default: return 'bg-gray-100 border-gray-500 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Chargement du planning...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push(profile?.role === 'admin' ? '/admin' : '/technicien')}
              variant="ghost"
              size="sm"
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Retour
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 shadow-md flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">
                  {profile?.role === 'admin' ? 'Gestion des plannings' : 'Mon planning'}
                </h1>
                <p className="text-sm text-slate-500">Organisez et suivez vos interventions</p>
              </div>
            </div>
          </div>
          <Button
            onClick={openCreateModal}
            variant="primary"
            icon={<Plus className="w-5 h-5" />}
          >
            Nouvelle intervention
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-8 py-8">
        {profile?.role === 'admin' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex gap-4 items-center">
              <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                <button
                  onClick={() => {
                    setViewMode('global')
                    setSelectedTechnicienFilter('')
                  }}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    viewMode === 'global'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  Vue globale
                </button>
                <button
                  onClick={() => setViewMode('par_technicien')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                    viewMode === 'par_technicien'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Par technicien
                </button>
              </div>

              {viewMode === 'par_technicien' && (
                <select
                  value={selectedTechnicienFilter}
                  onChange={(e) => setSelectedTechnicienFilter(e.target.value)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-medium"
                >
                  <option value="">Tous les techniciens</option>
                  {techniciens.map(tech => (
                    <option key={tech.id} value={tech.id}>{tech.full_name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )}

        <div className="mb-6 flex items-center justify-between">
          <Button
            onClick={previousMonth}
            variant="secondary"
            icon={<ChevronLeft className="w-5 h-5" />}
          >
            Mois précédent
          </Button>
          <div className="text-center">
            <motion.h2
              className="text-3xl font-bold text-slate-800"
              key={currentDate.toISOString()}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </motion.h2>
            <p className="text-sm text-slate-500 mt-1">Cliquez sur une intervention pour la modifier</p>
          </div>
          <Button
            onClick={nextMonth}
            variant="secondary"
            icon={<ChevronRight className="w-5 h-5" />}
            className="flex-row-reverse"
          >
            Mois suivant
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-7 bg-slate-800 text-white border-b border-slate-700">
            {dayNames.map(day => (
              <div key={day} className="px-2 py-4 text-center text-sm font-semibold">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {getDaysInMonth().map((date, index) => {
              const dayPlanning = getPlanningForDate(date)
              const isToday = date && date.toDateString() === new Date().toDateString()

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.01 }}
                  onDragOver={(e) => {
                    if (date && draggedPlanning) {
                      e.preventDefault()
                      e.currentTarget.classList.add('ring-2', 'ring-green-500')
                    }
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.classList.remove('ring-2', 'ring-green-500')
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    e.currentTarget.classList.remove('ring-2', 'ring-green-500')
                    if (date && draggedPlanning) {
                      const newDate = formatDateToLocal(date)
                      handleDateChange(draggedPlanning.id, newDate)
                    }
                  }}
                  className={`min-h-[140px] p-3 border border-gray-300 ${!date ? 'bg-gray-200' : 'bg-white hover:bg-gray-50 transition-colors'} ${isToday ? 'ring-2 ring-inset ring-blue-500 bg-blue-100' : ''}`}
                >
                  {date && (
                    <>
                      <div className={`text-sm font-bold mb-2 ${isToday ? 'text-blue-600' : 'text-slate-700'}`}>
                        {date.getDate()}
                      </div>
                      <div className="space-y-2">
                        {dayPlanning.map((planning, idx) => (
                          <motion.div
                            key={planning.id}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            draggable={true}
                            onDragStart={(e) => {
                            setDraggedPlanning(planning)
                            e.currentTarget.classList.add('opacity-50')
                          }}
                            onDragEnd={(e) => {
                              e.currentTarget.classList.remove('opacity-50')
                              setDraggedPlanning(null)
                            }}
                            className={`border-2 rounded px-2.5 py-2 text-xs cursor-pointer hover:shadow-md hover:scale-105 transition-all ${getStatusColor(planning.statut)}`}
                            onClick={() => openEditModal(planning)}
                          >
                            <div className="font-bold truncate text-slate-800">
                              {planning.sites?.clients?.nom}
                            </div>
                            <div className="text-slate-600 truncate text-[10px] mt-0.5">
                              {planning.sites?.nom}
                            </div>
                            {planning.heure_debut && (
                              <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1.5">
                                <Clock className="w-3 h-3" />
                                {planning.heure_debut}{planning.heure_fin && ` - ${planning.heure_fin}`}
                              </div>
                            )}
                            {planning.techniciens.length > 0 && (
                              <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1">
                                <Users className="w-3 h-3" />
                                <span className="truncate">{planning.techniciens.map((t: any) => t.profiles?.full_name).join(', ')}</span>
                              </div>
                            )}
                            {planning.notes && (
                              <span className="inline-block mt-1.5 px-2 py-0.5 bg-amber-200 text-amber-700 rounded-full text-[9px] font-semibold">Note</span>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      </main>

      {showEditModal && selectedPlanning && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Modifier l'intervention</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<X className="w-5 h-5" />}
                  onClick={() => setShowEditModal(false)}
                />
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 mb-6 border border-blue-200">
                <div className="font-bold text-lg mb-2 text-slate-800">{selectedPlanning.sites?.clients?.nom}</div>
                <div className="text-sm text-slate-600 mb-1">{selectedPlanning.sites?.nom}</div>
                {selectedPlanning.sites?.adresse && (
                  <div className="text-xs text-slate-500">
                    {selectedPlanning.sites?.adresse}, {selectedPlanning.sites?.ville}
                  </div>
                )}
              </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Client</label>
                <select
                  value={formData.client_id}
                  onChange={(e) => {
                    setFormData({ ...formData, client_id: e.target.value, site_id: '' })
                  }}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                >
                  <option value="">Sélectionner un client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.nom}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Site *</label>
                <select
                  value={formData.site_id}
                  onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  required
                >
                  <option value="">Sélectionner un site</option>
                  {sites.filter(s => !formData.client_id || s.client_id === formData.client_id).map(site => (
                    <option key={site.id} value={site.id}>{site.nom}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Date *</label>
                  <input
                    type="date"
                    value={formData.date_intervention}
                    onChange={(e) => setFormData({ ...formData, date_intervention: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Statut</label>
                  <select
                    value={formData.statut}
                    onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  >
                    <option value="planifiee">Planifiée</option>
                    <option value="en_cours">En cours</option>
                    <option value="annulee">Annulée</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                >
                  <option value="verification_periodique">Vérification périodique</option>
                  <option value="maintenance_preventive">Maintenance préventive</option>
                  <option value="reparation">Réparation</option>
                  <option value="mise_en_service">Mise en service</option>
                  <option value="diagnostic">Diagnostic</option>
                  <option value="formation">Formation</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Heure début</label>
                  <input
                    type="time"
                    value={formData.heure_debut}
                    onChange={(e) => setFormData({ ...formData, heure_debut: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Heure fin</label>
                  <input
                    type="time"
                    value={formData.heure_fin}
                    onChange={(e) => setFormData({ ...formData, heure_fin: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Coordonnées, instructions, remarques..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400"
                />
              </div>

              {profile?.role === 'admin' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Techniciens / Admins assignés</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {techniciens.map(tech => (
                      <label
                        key={tech.id}
                        className="flex items-center gap-3 p-3 bg-white hover:bg-blue-50 border border-slate-200 rounded-lg cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={formData.techniciens.includes(tech.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                techniciens: [...formData.techniciens, tech.id]
                              })
                            } else {
                              setFormData({
                                ...formData,
                                techniciens: formData.techniciens.filter(id => id !== tech.id)
                              })
                            }
                          }}
                          className="w-4 h-4 rounded border-[#2D3B52] text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                        />
                        <span className="text-slate-700 font-medium">{tech.full_name}</span>
                        <span className="text-xs text-slate-500">({tech.role})</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                onClick={() => setShowEditModal(false)}
                variant="secondary"
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleDeletePlanning}
                variant="ghost"
                icon={<Trash2 className="w-4 h-4" />}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                Supprimer
              </Button>
              <Button
                onClick={() => handleCreateRapport(selectedPlanning)}
                variant="ghost"
                icon={<FileText className="w-4 h-4" />}
                className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
              >
                Créer rapport
              </Button>
              <Button
                onClick={handleUpdatePlanning}
                variant="primary"
                icon={<Save className="w-4 h-4" />}
                className="flex-1"
              >
                Enregistrer
              </Button>
            </div>
            </div>
          </motion.div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl"
          >
            <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Nouvelle intervention planifiée</h2>
              <Button
                variant="ghost"
                size="sm"
                icon={<X className="w-5 h-5" />}
                onClick={() => setShowCreateModal(false)}
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Client *</label>
                <select
                  value={formData.client_id}
                  onChange={(e) => {
                    setFormData({ ...formData, client_id: e.target.value, site_id: '' })
                  }}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  required
                >
                  <option value="">Sélectionner un client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.nom}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Site *</label>
                <select
                  value={formData.site_id}
                  onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                  disabled={!formData.client_id}
                >
                  <option value="">Sélectionner un site</option>
                  {sites.filter(s => s.client_id === formData.client_id).map(site => (
                    <option key={site.id} value={site.id}>{site.nom}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Date *</label>
                  <input
                    type="date"
                    value={formData.date_intervention}
                    onChange={(e) => setFormData({ ...formData, date_intervention: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  >
                    <option value="verification_periodique">Vérification périodique</option>
                    <option value="maintenance_preventive">Maintenance préventive</option>
                    <option value="reparation">Réparation</option>
                    <option value="mise_en_service">Mise en service</option>
                    <option value="diagnostic">Diagnostic</option>
                    <option value="formation">Formation</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Heure début</label>
                  <input
                    type="time"
                    value={formData.heure_debut}
                    onChange={(e) => setFormData({ ...formData, heure_debut: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Heure fin</label>
                  <input
                    type="time"
                    value={formData.heure_fin}
                    onChange={(e) => setFormData({ ...formData, heure_fin: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Coordonnées, instructions, remarques..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Techniciens / Admins assignés</label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {techniciens.map(tech => (
                    <label
                      key={tech.id}
                      className="flex items-center gap-3 p-3 bg-white hover:bg-blue-50 border border-slate-200 rounded-lg cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formData.techniciens.includes(tech.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              techniciens: [...formData.techniciens, tech.id]
                            })
                          } else {
                            setFormData({
                              ...formData,
                              techniciens: formData.techniciens.filter(id => id !== tech.id)
                            })
                          }
                        }}
                        className="w-4 h-4 rounded border-slate-200 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                      />
                      <span className="text-slate-700 font-medium">{tech.full_name}</span>
                      <span className="text-xs text-slate-500">({tech.role})</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                onClick={() => setShowCreateModal(false)}
                variant="secondary"
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreatePlanning}
                variant="primary"
                icon={<Plus className="w-4 h-4" />}
                className="flex-1"
              >
                Créer
              </Button>
            </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}