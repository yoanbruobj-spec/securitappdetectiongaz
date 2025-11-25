'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon,
  Users, Clock, X, Save, Trash2, FileText, List, ArrowLeft
} from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { cn } from '@/lib/utils'

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
  const [draggedPlanning, setDraggedPlanning] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'global' | 'par_technicien'>('global')
  const [selectedTechnicienFilter, setSelectedTechnicienFilter] = useState<string>('')
  const [mobileView, setMobileView] = useState<'calendar' | 'list' | 'agenda'>('agenda')
  const [selectedDay, setSelectedDay] = useState<Date>(new Date())

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
    await reloadData()
    setLoading(false)
  }

  async function reloadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

    const { data: planningData } = await supabase
      .from('planning_interventions')
      .select(`*, sites (nom, adresse, ville, clients (nom, telephone))`)
      .gte('date_intervention', formatDateToLocal(startOfMonth))
      .lte('date_intervention', formatDateToLocal(endOfMonth))
      .order('date_intervention', { ascending: true })

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

            return {
              ...planning,
              techniciens: techAssignments.map(assignment => ({
                ...assignment,
                profiles: profilesData?.find(p => p.id === assignment.technicien_id)
              }))
            }
          }
          return { ...planning, techniciens: [] }
        })
      )
      setPlanningInterventions(planningWithTech)
    }

    const { data: techniciensData } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['technicien', 'admin'])
      .order('full_name')

    if (techniciensData) setTechniciens(techniciensData)

    const { data: clientsData } = await supabase.from('clients').select('*').order('nom')
    if (clientsData) setClients(clientsData)

    const { data: sitesData } = await supabase.from('sites').select('*').order('nom')
    if (sitesData) setSites(sitesData)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function getDaysInMonth() {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null)
    for (let day = 1; day <= daysInMonth; day++) days.push(new Date(year, month, day))
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

  function openEditModal(planning: any) {
    setSelectedPlanning(planning)
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

      const { data: planningData, error } = await supabase
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

      if (error) throw error

      if (planningData && formData.techniciens.length > 0) {
        for (const technicienId of formData.techniciens) {
          await supabase.from('planning_techniciens').insert({
            planning_intervention_id: planningData.id,
            technicien_id: technicienId,
            role_technicien: 'principal'
          })
        }
      }

      alert('Intervention planifiée avec succès')
      setShowCreateModal(false)
      reloadData()
    } catch (error: any) {
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

      await supabase
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

      await supabase
        .from('planning_techniciens')
        .delete()
        .eq('planning_intervention_id', selectedPlanning.id)

      if (formData.techniciens.length > 0) {
        for (const technicienId of formData.techniciens) {
          await supabase.from('planning_techniciens').insert({
            planning_intervention_id: selectedPlanning.id,
            technicien_id: technicienId,
            role_technicien: 'principal'
          })
        }
      }

      alert('Modifications enregistrées')
      setShowEditModal(false)
      reloadData()
    } catch (error: any) {
      alert('Erreur: ' + error.message)
    }
  }

  async function handleDeletePlanning() {
    if (!selectedPlanning || !confirm('Supprimer cette intervention planifiée ?')) return

    try {
      await supabase.from('planning_interventions').delete().eq('id', selectedPlanning.id)
      alert('Intervention supprimée')
      setShowEditModal(false)
      reloadData()
    } catch (error: any) {
      alert('Erreur: ' + error.message)
    }
  }

  async function handleDateChange(planningId: string, newDate: string) {
    try {
      await supabase.from('planning_interventions').update({ date_intervention: newDate }).eq('id', planningId)
      reloadData()
    } catch (error: any) {
      alert('Erreur: ' + error.message)
    }
  }

  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
  const dayNamesShort = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

  const getStatusColor = (statut: string) => {
    switch(statut) {
      case 'planifiee': return 'bg-blue-50 border-l-4 border-blue-500 text-blue-700'
      case 'en_cours': return 'bg-amber-50 border-l-4 border-amber-500 text-amber-700'
      case 'annulee': return 'bg-red-50 border-l-4 border-red-500 text-red-700'
      default: return 'bg-slate-50 border-l-4 border-slate-500 text-slate-700'
    }
  }

  const getStatusDot = (statut: string) => {
    switch(statut) {
      case 'planifiee': return 'bg-blue-500'
      case 'en_cours': return 'bg-amber-500'
      case 'annulee': return 'bg-red-500'
      default: return 'bg-slate-500'
    }
  }

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      verification_periodique: 'Vérification',
      maintenance_preventive: 'Maintenance',
      reparation: 'Réparation',
      mise_en_service: 'Mise en service',
      diagnostic: 'Diagnostic',
      formation: 'Formation'
    }
    return types[type] || type
  }

  // Get days for the week view (mobile)
  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate)
    const day = startOfWeek.getDay()
    startOfWeek.setDate(startOfWeek.getDate() - day)

    const days = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek)
      d.setDate(startOfWeek.getDate() + i)
      days.push(d)
    }
    return days
  }

  // Get upcoming interventions grouped by date
  const getUpcomingGroupedByDate = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const upcoming = planningInterventions
      .filter(p => {
        const pDate = new Date(p.date_intervention)
        pDate.setHours(0, 0, 0, 0)
        return pDate >= today
      })
      .sort((a, b) => new Date(a.date_intervention).getTime() - new Date(b.date_intervention).getTime())

    const grouped: Record<string, any[]> = {}
    upcoming.forEach(p => {
      if (!grouped[p.date_intervention]) {
        grouped[p.date_intervention] = []
      }
      grouped[p.date_intervention].push(p)
    })
    return grouped
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const allPlanningThisMonth = planningInterventions.filter(p => {
    if (viewMode === 'par_technicien' && selectedTechnicienFilter) {
      return p.techniciens.some((t: any) => t.technicien_id === selectedTechnicienFilter)
    }
    return true
  })

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <Sidebar userRole={profile?.role} userName={profile?.full_name} onLogout={handleLogout} />

      <main className="flex-1 pb-24 lg:pb-0">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="px-4 py-4 lg:px-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push(profile?.role === 'admin' ? '/admin' : '/technicien')}
                  className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100"
                >
                  <ArrowLeft className="w-5 h-5 text-slate-600" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <CalendarIcon className="w-5 h-5 text-emerald-500" />
                  </div>
                  <h1 className="text-xl lg:text-2xl font-bold text-slate-900">Planning</h1>
                </div>
              </div>
              <button
                onClick={openCreateModal}
                className="h-10 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Nouveau</span>
              </button>
            </div>

            {/* Filters */}
            {profile?.role === 'admin' && (
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex bg-slate-100 rounded-lg p-1">
                  <button
                    onClick={() => { setViewMode('global'); setSelectedTechnicienFilter('') }}
                    className={cn(
                      'flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                      viewMode === 'global' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-600'
                    )}
                  >
                    Global
                  </button>
                  <button
                    onClick={() => setViewMode('par_technicien')}
                    className={cn(
                      'flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1.5',
                      viewMode === 'par_technicien' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-600'
                    )}
                  >
                    <Users className="w-4 h-4" />
                    Par technicien
                  </button>
                </div>

                {viewMode === 'par_technicien' && (
                  <select
                    value={selectedTechnicienFilter}
                    onChange={(e) => setSelectedTechnicienFilter(e.target.value)}
                    className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Tous les techniciens</option>
                    {techniciens.map(tech => (
                      <option key={tech.id} value={tech.id}>{tech.full_name}</option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>
        </header>

        <div className="px-4 py-4 lg:px-8 lg:py-6">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <h2 className="text-lg font-semibold text-slate-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* Mobile view switch */}
          <div className="lg:hidden flex bg-slate-100 rounded-xl p-1 mb-4">
            <button
              onClick={() => setMobileView('agenda')}
              className={cn(
                'flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5',
                mobileView === 'agenda' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-600'
              )}
            >
              <List className="w-4 h-4" />
              Agenda
            </button>
            <button
              onClick={() => setMobileView('calendar')}
              className={cn(
                'flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5',
                mobileView === 'calendar' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-600'
              )}
            >
              <CalendarIcon className="w-4 h-4" />
              Mois
            </button>
          </div>

          {/* Agenda view mobile - Premium style */}
          {mobileView === 'agenda' && (
            <div className="lg:hidden">
              {/* Week strip */}
              <div className="bg-white rounded-2xl border border-slate-200 p-3 mb-4 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <button
                    onClick={() => {
                      const prev = new Date(selectedDay)
                      prev.setDate(prev.getDate() - 7)
                      setSelectedDay(prev)
                      setCurrentDate(prev)
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 active:bg-slate-200 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-slate-600" />
                  </button>
                  <span className="text-sm font-semibold text-slate-700">
                    {monthNames[selectedDay.getMonth()]} {selectedDay.getFullYear()}
                  </span>
                  <button
                    onClick={() => {
                      const next = new Date(selectedDay)
                      next.setDate(next.getDate() + 7)
                      setSelectedDay(next)
                      setCurrentDate(next)
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 active:bg-slate-200 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-slate-600" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {getWeekDays().map((day, i) => {
                    const isSelected = day.toDateString() === selectedDay.toDateString()
                    const isToday = day.toDateString() === new Date().toDateString()
                    const dayPlanning = getPlanningForDate(day)
                    const hasEvents = dayPlanning.length > 0

                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedDay(day)}
                        className={cn(
                          'flex flex-col items-center py-2 rounded-xl transition-all touch-feedback',
                          isSelected
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                            : isToday
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'hover:bg-slate-50'
                        )}
                      >
                        <span className={cn(
                          'text-[10px] font-medium mb-1',
                          isSelected ? 'text-emerald-100' : 'text-slate-400'
                        )}>
                          {dayNamesShort[day.getDay()]}
                        </span>
                        <span className={cn(
                          'text-lg font-semibold',
                          !isSelected && !isToday && 'text-slate-700'
                        )}>
                          {day.getDate()}
                        </span>
                        {hasEvents && !isSelected && (
                          <div className="flex gap-0.5 mt-1">
                            {dayPlanning.slice(0, 3).map((p, idx) => (
                              <span key={idx} className={cn('w-1.5 h-1.5 rounded-full', getStatusDot(p.statut))} />
                            ))}
                          </div>
                        )}
                        {hasEvents && isSelected && (
                          <span className="text-[10px] mt-0.5 text-emerald-100">{dayPlanning.length}</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Selected day interventions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-semibold text-slate-500">
                    {selectedDay.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </h3>
                  {selectedDay.toDateString() !== new Date().toDateString() && (
                    <button
                      onClick={() => setSelectedDay(new Date())}
                      className="text-xs text-emerald-600 font-medium"
                    >
                      Aujourd'hui
                    </button>
                  )}
                </div>

                {getPlanningForDate(selectedDay).length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CalendarIcon className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-medium">Aucune intervention</p>
                    <p className="text-slate-400 text-sm mt-1">Planifiez une nouvelle intervention</p>
                    <button
                      onClick={openCreateModal}
                      className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"
                    >
                      <Plus className="w-4 h-4 inline mr-1" />
                      Nouveau
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getPlanningForDate(selectedDay)
                      .sort((a, b) => (a.heure_debut || '').localeCompare(b.heure_debut || ''))
                      .map((planning, idx) => (
                      <button
                        key={planning.id}
                        onClick={() => openEditModal(planning)}
                        className="w-full bg-white rounded-2xl border border-slate-200 p-4 text-left hover:shadow-md hover:border-emerald-200 transition-all touch-feedback animate-fade-in-up"
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <div className="flex gap-3">
                          {/* Time column */}
                          <div className="flex flex-col items-center w-14 flex-shrink-0">
                            {planning.heure_debut ? (
                              <>
                                <span className="text-lg font-bold text-slate-900">{planning.heure_debut.slice(0, 5)}</span>
                                {planning.heure_fin && (
                                  <span className="text-xs text-slate-400">{planning.heure_fin.slice(0, 5)}</span>
                                )}
                              </>
                            ) : (
                              <span className="text-sm text-slate-400">-</span>
                            )}
                          </div>

                          {/* Separator */}
                          <div className={cn('w-1 rounded-full flex-shrink-0', getStatusDot(planning.statut))} />

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h4 className="font-semibold text-slate-900 truncate">
                                  {planning.sites?.clients?.nom}
                                </h4>
                                <p className="text-sm text-slate-500 truncate">{planning.sites?.nom}</p>
                              </div>
                              <span className={cn(
                                'px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0',
                                planning.statut === 'planifiee' ? 'bg-blue-100 text-blue-700' :
                                planning.statut === 'en_cours' ? 'bg-amber-100 text-amber-700' :
                                'bg-red-100 text-red-700'
                              )}>
                                {planning.statut === 'planifiee' ? 'Planifiée' :
                                 planning.statut === 'en_cours' ? 'En cours' : 'Annulée'}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                              <span className="px-2 py-0.5 bg-slate-100 rounded-md">
                                {getTypeLabel(planning.type)}
                              </span>
                              {planning.techniciens.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {planning.techniciens.map((t: any) => t.profiles?.full_name?.split(' ')[0]).join(', ')}
                                </span>
                              )}
                            </div>

                            {planning.notes && (
                              <p className="text-xs text-slate-400 mt-2 line-clamp-1">{planning.notes}</p>
                            )}
                          </div>

                          <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0 self-center" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Old list view - kept for reference */}
          {mobileView === 'list' && (
            <div className="lg:hidden space-y-2">
              {allPlanningThisMonth.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-500">Aucune intervention ce mois-ci</p>
                </div>
              ) : (
                allPlanningThisMonth.map((planning) => (
                  <button
                    key={planning.id}
                    onClick={() => openEditModal(planning)}
                    className={cn('w-full p-3 rounded-xl text-left', getStatusColor(planning.statut))}
                  >
                    <div className="font-semibold text-sm mb-1">
                      {planning.sites?.clients?.nom}
                    </div>
                    <div className="text-xs opacity-75 mb-2">{planning.sites?.nom}</div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3" />
                        {new Date(planning.date_intervention).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </span>
                      {planning.heure_debut && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {planning.heure_debut}
                        </span>
                      )}
                      {planning.techniciens.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {planning.techniciens.length}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Calendar view */}
          <div className={cn(mobileView !== 'calendar' ? 'hidden lg:block' : '')}>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {/* Day headers */}
              <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
                {dayNames.map(day => (
                  <div key={day} className="px-1 py-2 text-center text-xs font-semibold text-slate-600">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
                {getDaysInMonth().map((date, index) => {
                  const dayPlanning = getPlanningForDate(date)
                  const isToday = date && date.toDateString() === new Date().toDateString()

                  return (
                    <div
                      key={index}
                      data-date={date ? formatDateToLocal(date) : ''}
                      onDragOver={(e) => {
                        if (date && draggedPlanning) {
                          e.preventDefault()
                          e.currentTarget.classList.add('bg-emerald-50')
                        }
                      }}
                      onDragLeave={(e) => e.currentTarget.classList.remove('bg-emerald-50')}
                      onDrop={(e) => {
                        e.preventDefault()
                        e.currentTarget.classList.remove('bg-emerald-50')
                        if (date && draggedPlanning) {
                          handleDateChange(draggedPlanning.id, formatDateToLocal(date))
                        }
                      }}
                      className={cn(
                        'min-h-[80px] lg:min-h-[100px] p-1 lg:p-2 transition-colors',
                        !date ? 'bg-slate-50' : isToday ? 'bg-emerald-50/50' : 'bg-white'
                      )}
                    >
                      {date && (
                        <>
                          <div className={cn(
                            'text-xs lg:text-sm font-semibold mb-1',
                            isToday ? 'text-emerald-600' : 'text-slate-700'
                          )}>
                            {date.getDate()}
                          </div>
                          <div className="space-y-1">
                            {dayPlanning.map((planning) => (
                              <div
                                key={planning.id}
                                draggable
                                onDragStart={() => setDraggedPlanning(planning)}
                                onDragEnd={() => setDraggedPlanning(null)}
                                onClick={() => openEditModal(planning)}
                                className={cn(
                                  'px-1.5 py-1 rounded text-[10px] lg:text-xs cursor-pointer hover:shadow-md transition-shadow',
                                  getStatusColor(planning.statut)
                                )}
                              >
                                <div className="font-semibold truncate">
                                  {planning.sites?.clients?.nom}
                                </div>
                                {planning.heure_debut && (
                                  <div className="flex items-center gap-0.5 opacity-75 mt-0.5">
                                    <Clock className="w-2.5 h-2.5" />
                                    <span className="text-[9px]">{planning.heure_debut}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      <BottomNav userRole={profile?.role} />

      {/* Edit Modal */}
      {showEditModal && selectedPlanning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Modifier l'intervention</h2>
              <button onClick={() => setShowEditModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Client info */}
              <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                <div className="font-medium text-emerald-900">{selectedPlanning.sites?.clients?.nom}</div>
                <div className="text-sm text-emerald-700">{selectedPlanning.sites?.nom}</div>
              </div>

              {/* Form */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Date *</label>
                  <input
                    type="date"
                    value={formData.date_intervention}
                    onChange={(e) => setFormData({ ...formData, date_intervention: e.target.value })}
                    className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Statut</label>
                  <select
                    value={formData.statut}
                    onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                    className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="planifiee">Planifiée</option>
                    <option value="en_cours">En cours</option>
                    <option value="annulee">Annulée</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
                >
                  <option value="verification_periodique">Vérification périodique</option>
                  <option value="maintenance_preventive">Maintenance préventive</option>
                  <option value="reparation">Réparation</option>
                  <option value="mise_en_service">Mise en service</option>
                  <option value="diagnostic">Diagnostic</option>
                  <option value="formation">Formation</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Heure début</label>
                  <input
                    type="time"
                    value={formData.heure_debut}
                    onChange={(e) => setFormData({ ...formData, heure_debut: e.target.value })}
                    className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Heure fin</label>
                  <input
                    type="time"
                    value={formData.heure_fin}
                    onChange={(e) => setFormData({ ...formData, heure_fin: e.target.value })}
                    className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Instructions, remarques..."
                  rows={2}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {profile?.role === 'admin' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Techniciens</label>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {techniciens.map(tech => (
                      <label key={tech.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 border border-slate-200 rounded-lg cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={formData.techniciens.includes(tech.id)}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              techniciens: e.target.checked
                                ? [...formData.techniciens, tech.id]
                                : formData.techniciens.filter(id => id !== tech.id)
                            })
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-emerald-500"
                        />
                        <span className="text-slate-700">{tech.full_name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 h-11 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeletePlanning}
                  className="w-11 h-11 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => router.push(`/select-rapport-type?planning_id=${selectedPlanning.id}`)}
                  className="w-11 h-11 flex items-center justify-center bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors"
                >
                  <FileText className="w-5 h-5" />
                </button>
                <button
                  onClick={handleUpdatePlanning}
                  className="flex-1 h-11 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Save className="w-5 h-5" />
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Nouvelle intervention</h2>
              <button onClick={() => setShowCreateModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Client *</label>
                <select
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value, site_id: '' })}
                  className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
                  required
                >
                  <option value="">Sélectionner un client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.nom}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Site *</label>
                <select
                  value={formData.site_id}
                  onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
                  className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                  required
                  disabled={!formData.client_id}
                >
                  <option value="">Sélectionner un site</option>
                  {sites.filter(s => s.client_id === formData.client_id).map(site => (
                    <option key={site.id} value={site.id}>{site.nom}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Date *</label>
                  <input
                    type="date"
                    value={formData.date_intervention}
                    onChange={(e) => setFormData({ ...formData, date_intervention: e.target.value })}
                    className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Heure début</label>
                  <input
                    type="time"
                    value={formData.heure_debut}
                    onChange={(e) => setFormData({ ...formData, heure_debut: e.target.value })}
                    className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Heure fin</label>
                  <input
                    type="time"
                    value={formData.heure_fin}
                    onChange={(e) => setFormData({ ...formData, heure_fin: e.target.value })}
                    className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Instructions, remarques..."
                  rows={2}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Techniciens</label>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {techniciens.map(tech => (
                    <label key={tech.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 border border-slate-200 rounded-lg cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={formData.techniciens.includes(tech.id)}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            techniciens: e.target.checked
                              ? [...formData.techniciens, tech.id]
                              : formData.techniciens.filter(id => id !== tech.id)
                          })
                        }}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-500"
                      />
                      <span className="text-slate-700">{tech.full_name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 h-11 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreatePlanning}
                  className="flex-1 h-11 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Créer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
