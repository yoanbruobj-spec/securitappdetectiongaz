'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Users, Clock, X, Save, Trash2, FileText, List, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

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
  const [mobileView, setMobileView] = useState<'calendar' | 'list'>('calendar')

  // États pour le drag and drop tactile (mobile)
  const [touchStartPos, setTouchStartPos] = useState<{ x: number, y: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [draggedElement, setDraggedElement] = useState<HTMLElement | null>(null)
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

  // Recharge les données sans afficher l'écran de chargement
  async function reloadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

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
      reloadData()
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
      await reloadData()
    } catch (error: any) {
      console.error('Erreur:', error)
      alert('Erreur lors de l\'enregistrement: ' + error.message)
    }
  }

  // Fonctions pour le drag and drop tactile (mobile)
  function handleTouchStart(e: React.TouchEvent, planning: any) {
    const touch = e.touches[0]
    setTouchStartPos({ x: touch.clientX, y: touch.clientY })
    setDraggedPlanning(planning)

    // Créer un élément visuel pour le drag après un court délai
    setTimeout(() => {
      setIsDragging(true)
      const target = e.currentTarget as HTMLElement
      setDraggedElement(target)
      target.style.opacity = '0.5'
    }, 150)
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!touchStartPos) return

    const touch = e.touches[0]
    const deltaX = touch.clientX - touchStartPos.x
    const deltaY = touch.clientY - touchStartPos.y

    // Commencer le drag si mouvement significatif
    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      if (!isDragging) {
        setIsDragging(true)
        const target = e.currentTarget as HTMLElement
        setDraggedElement(target)
        target.style.opacity = '0.5'
      }
      e.preventDefault()
    }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    // Si pas de drag, ne rien faire (le onClick va gérer)
    if (!isDragging || !draggedPlanning) {
      setIsDragging(false)
      setTouchStartPos(null)
      setDraggedPlanning(null)
      if (draggedElement) {
        draggedElement.style.opacity = '1'
        setDraggedElement(null)
      }
      return
    }

    // Empêcher le click si on a draggé
    e.preventDefault()

    const touch = e.changedTouches[0]
    let element = document.elementFromPoint(touch.clientX, touch.clientY)

    // Remonter dans le DOM pour trouver le calendar-day
    while (element && !element.classList.contains('calendar-day')) {
      element = element.parentElement
    }

    if (element && element.classList.contains('calendar-day')) {
      const dateStr = element.getAttribute('data-date')
      if (dateStr) {
        handleDateChange(draggedPlanning.id, dateStr)
      }
    }

    // Réinitialiser
    if (draggedElement) {
      draggedElement.style.opacity = '1'
      setDraggedElement(null)
    }
    setIsDragging(false)
    setTouchStartPos(null)
    setDraggedPlanning(null)
  }

  function handlePlanningClick(planning: any) {
    // N'ouvrir le modal que si on n'est pas en train de faire un drag
    if (!isDragging) {
      openEditModal(planning)
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
      reloadData()
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

      reloadData()
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
      case 'planifiee': return 'bg-blue-50 border-l-4 border-blue-500 text-blue-700'
      case 'en_cours': return 'bg-amber-50 border-l-4 border-amber-500 text-amber-700'
      case 'annulee': return 'bg-red-50 border-l-4 border-red-500 text-red-700'
      default: return 'bg-gray-50 border-l-4 border-gray-500 text-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-gray-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Chargement...</p>
        </div>
      </div>
    )
  }

  // Vue liste pour mobile
  const allPlanningThisMonth = planningInterventions.filter(p => {
    if (viewMode === 'par_technicien' && selectedTechnicienFilter) {
      return p.techniciens.some((t: any) => t.technicien_id === selectedTechnicienFilter)
    }
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header épuré */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="px-4 lg:px-6 py-2 lg:py-4">
          <div className="flex items-center justify-between mb-2 lg:mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/admin')}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                title="Retour au dashboard"
              >
                <ArrowLeft className="w-4 lg:w-5 h-4 lg:h-5 text-gray-600" />
              </button>
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-md">
                <CalendarIcon className="w-4 lg:w-5 h-4 lg:h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base lg:text-xl font-bold text-gray-900">
                  Planning
                </h1>
                <p className="text-xs text-gray-500 hidden lg:block">
                  {profile?.role === 'admin' ? 'Gérez vos interventions' : 'Vos interventions'}
                </p>
              </div>
            </div>
            <Button
              onClick={openCreateModal}
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              size="sm"
              className="shadow-md"
            >
              <span className="hidden sm:inline">Nouveau</span>
            </Button>
          </div>

          {/* Filtres épurés */}
          {profile?.role === 'admin' && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex gap-1 p-0.5 bg-gray-100 rounded-lg flex-1 sm:flex-none">
                <button
                  onClick={() => {
                    setViewMode('global')
                    setSelectedTechnicienFilter('')
                  }}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-medium transition ${
                    viewMode === 'global'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-gray-600'
                  }`}
                >
                  Global
                </button>
                <button
                  onClick={() => setViewMode('par_technicien')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center justify-center gap-1.5 ${
                    viewMode === 'par_technicien'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-gray-600'
                  }`}
                >
                  <Users className="w-3 h-3" />
                  Par technicien
                </button>
              </div>

              {viewMode === 'par_technicien' && (
                <select
                  value={selectedTechnicienFilter}
                  onChange={(e) => setSelectedTechnicienFilter(e.target.value)}
                  className="flex-1 sm:flex-none px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:border-emerald-500"
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

      <main className="flex-1 overflow-auto p-4 lg:p-6">
        {/* Navigation mois épurée */}
        <div className="flex items-center justify-between mb-3 lg:mb-4">
          <button
            onClick={previousMonth}
            className="p-1.5 lg:p-2 hover:bg-white rounded-lg transition"
          >
            <ChevronLeft className="w-5 lg:w-6 h-5 lg:h-6 text-gray-600" />
          </button>
          <h2 className="text-sm lg:text-lg font-bold text-gray-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            onClick={nextMonth}
            className="p-1.5 lg:p-2 hover:bg-white rounded-lg transition"
          >
            <ChevronRight className="w-5 lg:w-6 h-5 lg:h-6 text-gray-600" />
          </button>
        </div>

        {/* Switch vue mobile */}
        <div className="lg:hidden flex gap-1 p-0.5 bg-gray-100 rounded-lg mb-4">
          <button
            onClick={() => setMobileView('calendar')}
            className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition flex items-center justify-center gap-1.5 ${
              mobileView === 'calendar'
              ? 'bg-white text-emerald-600 shadow-sm'
              : 'text-gray-600'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            Calendrier
          </button>
          <button
            onClick={() => setMobileView('list')}
            className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition flex items-center justify-center gap-1.5 ${
              mobileView === 'list'
              ? 'bg-white text-emerald-600 shadow-sm'
              : 'text-gray-600'
            }`}
          >
            <List className="w-4 h-4" />
            Liste
          </button>
        </div>

        {/* Vue liste mobile */}
        {mobileView === 'list' && (
          <div className="lg:hidden space-y-2">
            {allPlanningThisMonth.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg">
                <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm text-gray-500">Aucune intervention ce mois-ci</p>
              </div>
            ) : (
              allPlanningThisMonth.map((planning) => (
                <motion.div
                  key={planning.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`p-3 rounded-lg cursor-pointer ${getStatusColor(planning.statut)}`}
                  onClick={() => openEditModal(planning)}
                >
                  <div className="font-semibold text-sm mb-1">
                    {planning.sites?.clients?.nom}
                  </div>
                  <div className="text-xs opacity-75 mb-2">
                    {planning.sites?.nom}
                  </div>
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
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* Vue calendrier - épurée */}
        {(mobileView === 'calendar' || window.innerWidth >= 1024) && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* En-têtes des jours */}
            <div className="grid grid-cols-7 bg-gray-100 border-b border-gray-200">
              {dayNames.map(day => (
                <div key={day} className="px-1 py-2 text-center text-xs font-semibold text-gray-600">
                  {day}
                </div>
              ))}
            </div>

            {/* Grille du calendrier */}
            <div className="grid grid-cols-7 divide-x divide-y divide-gray-200">
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
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove('bg-emerald-50')
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      e.currentTarget.classList.remove('bg-emerald-50')
                      if (date && draggedPlanning) {
                        const newDate = formatDateToLocal(date)
                        handleDateChange(draggedPlanning.id, newDate)
                      }
                    }}
                    className={`calendar-day min-h-[80px] lg:min-h-[120px] p-1 lg:p-2 ${
                      !date ? 'bg-gray-50' : isToday ? 'bg-emerald-50' : 'bg-white'
                    } transition-colors`}
                  >
                    {date && (
                      <>
                        <div className={`text-xs lg:text-sm font-semibold mb-1 ${
                          isToday ? 'text-emerald-600' : 'text-gray-700'
                        }`}>
                          {date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dayPlanning.map((planning) => (
                            <div
                              key={planning.id}
                              draggable={true}
                              onDragStart={() => setDraggedPlanning(planning)}
                              onDragEnd={() => setDraggedPlanning(null)}
                              onTouchStart={(e) => handleTouchStart(e, planning)}
                              onTouchMove={handleTouchMove}
                              onTouchEnd={handleTouchEnd}
                              className={`px-1.5 py-1 rounded text-[10px] lg:text-xs cursor-pointer hover:shadow-md transition touch-none ${getStatusColor(planning.statut)}`}
                              onClick={() => handlePlanningClick(planning)}
                            >
                              <div className="font-semibold truncate">
                                {planning.sites?.clients?.nom}
                              </div>
                              {planning.heure_debut && (
                                <div className="flex items-center gap-0.5 opacity-75 mt-0.5">
                                  <Clock className="w-2.5 h-2.5 lg:w-3 lg:h-3" />
                                  <span className="text-[9px] lg:text-[10px]">{planning.heure_debut}</span>
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
        )}
      </main>

      {/* Modal d'édition - épurée */}
      {showEditModal && selectedPlanning && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl"
          >
            <div className="p-4 lg:p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Modifier</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Info client/site */}
              <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 rounded-lg p-3 mb-4 border border-emerald-200">
                <div className="font-semibold text-sm mb-1">{selectedPlanning.sites?.clients?.nom}</div>
                <div className="text-xs text-gray-600">{selectedPlanning.sites?.nom}</div>
                {selectedPlanning.sites?.adresse && (
                  <div className="text-xs text-gray-500 mt-1">
                    {selectedPlanning.sites?.adresse}, {selectedPlanning.sites?.ville}
                  </div>
                )}
              </div>

              {/* Formulaire */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Client</label>
                  <select
                    value={formData.client_id}
                    onChange={(e) => {
                      setFormData({ ...formData, client_id: e.target.value, site_id: '' })
                    }}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Sélectionner un client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.nom}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Site *</label>
                  <select
                    value={formData.site_id}
                    onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500"
                    required
                  >
                    <option value="">Sélectionner un site</option>
                    {sites.filter(s => !formData.client_id || s.client_id === formData.client_id).map(site => (
                      <option key={site.id} value={site.id}>{site.nom}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Date *</label>
                    <input
                      type="date"
                      value={formData.date_intervention}
                      onChange={(e) => setFormData({ ...formData, date_intervention: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Statut</label>
                    <select
                      value={formData.statut}
                      onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500"
                    >
                      <option value="planifiee">Planifiée</option>
                      <option value="en_cours">En cours</option>
                      <option value="annulee">Annulée</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500"
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
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Heure début</label>
                    <input
                      type="time"
                      value={formData.heure_debut}
                      onChange={(e) => setFormData({ ...formData, heure_debut: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Heure fin</label>
                    <input
                      type="time"
                      value={formData.heure_fin}
                      onChange={(e) => setFormData({ ...formData, heure_fin: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Instructions, remarques..."
                    rows={2}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {profile?.role === 'admin' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Techniciens</label>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {techniciens.map(tech => (
                        <label
                          key={tech.id}
                          className="flex items-center gap-2 p-2 hover:bg-gray-50 border border-gray-200 rounded-lg cursor-pointer text-xs"
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
                            className="w-4 h-4 rounded border-gray-300 text-emerald-500"
                          />
                          <span className="text-gray-700 font-medium">{tech.full_name}</span>
                          <span className="text-gray-500">({tech.role})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 text-xs lg:text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                >
                  Annuler
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={handleDeletePlanning}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-4 lg:w-5 h-4 lg:h-5" />
                  </button>
                  <button
                    onClick={() => handleCreateRapport(selectedPlanning)}
                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                  >
                    <FileText className="w-4 lg:w-5 h-4 lg:h-5" />
                  </button>
                  <button
                    onClick={handleUpdatePlanning}
                    className="flex-1 px-4 py-2 text-xs lg:text-sm bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white rounded-lg transition flex items-center justify-center gap-2 shadow-md"
                  >
                    <Save className="w-4 h-4" />
                    Enregistrer
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal de création - épurée (même style) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl"
          >
            <div className="p-4 lg:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Nouvelle intervention</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Client *</label>
                  <select
                    value={formData.client_id}
                    onChange={(e) => {
                      setFormData({ ...formData, client_id: e.target.value, site_id: '' })
                    }}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500"
                    required
                  >
                    <option value="">Sélectionner un client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.nom}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Site *</label>
                  <select
                    value={formData.site_id}
                    onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 disabled:opacity-50"
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
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Date *</label>
                    <input
                      type="date"
                      value={formData.date_intervention}
                      onChange={(e) => setFormData({ ...formData, date_intervention: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500"
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
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Heure début</label>
                    <input
                      type="time"
                      value={formData.heure_debut}
                      onChange={(e) => setFormData({ ...formData, heure_debut: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Heure fin</label>
                    <input
                      type="time"
                      value={formData.heure_fin}
                      onChange={(e) => setFormData({ ...formData, heure_fin: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Instructions, remarques..."
                    rows={2}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Techniciens</label>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {techniciens.map(tech => (
                      <label
                        key={tech.id}
                        className="flex items-center gap-2 p-2 hover:bg-gray-50 border border-gray-200 rounded-lg cursor-pointer text-xs"
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
                          className="w-4 h-4 rounded border-gray-300 text-emerald-500"
                        />
                        <span className="text-gray-700 font-medium">{tech.full_name}</span>
                        <span className="text-gray-500">({tech.role})</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreatePlanning}
                  className="flex-1 px-4 py-2 text-sm bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white rounded-lg transition flex items-center justify-center gap-2 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  Créer
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
