'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft, MapPin, Truck, Warehouse, Plus, Edit2, Trash2,
  User, X, Save
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StockEmplacement, EmplacementType } from '@/types/stock'

export default function EmplacementsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [emplacements, setEmplacements] = useState<StockEmplacement[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [processing, setProcessing] = useState(false)

  const [formData, setFormData] = useState({
    type: 'chantier' as EmplacementType,
    nom: '',
    description: '',
    chantier_client: '',
    chantier_adresse: '',
    chantier_contact: '',
    chantier_date_debut: '',
    chantier_date_fin: '',
    utilisateur_id: ''
  })

  useEffect(() => {
    checkAuth()
    loadData()
  }, [])

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

    if (profile?.role !== 'admin') {
      router.push('/stock')
      return
    }
  }

  async function loadData() {
    setLoading(true)

    const { data: emps } = await supabase
      .from('stock_emplacements')
      .select(`
        *,
        profiles (id, full_name, email, role)
      `)
      .order('created_at', { ascending: false })

    if (emps) setEmplacements(emps)

    const { data: usrs } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .order('full_name', { ascending: true })

    if (usrs) setUsers(usrs)

    setLoading(false)
  }

  function openCreateModal(type: EmplacementType) {
    setEditingId(null)
    setFormData({
      type,
      nom: '',
      description: '',
      chantier_client: '',
      chantier_adresse: '',
      chantier_contact: '',
      chantier_date_debut: '',
      chantier_date_fin: '',
      utilisateur_id: ''
    })
    setShowModal(true)
  }

  function openEditModal(emp: StockEmplacement) {
    setEditingId(emp.id)
    setFormData({
      type: emp.type,
      nom: emp.nom,
      description: emp.description || '',
      chantier_client: emp.chantier_info?.client || '',
      chantier_adresse: emp.chantier_info?.adresse || '',
      chantier_contact: emp.chantier_info?.contact || '',
      chantier_date_debut: emp.chantier_info?.date_debut || '',
      chantier_date_fin: emp.chantier_info?.date_fin || '',
      utilisateur_id: emp.utilisateur_id || ''
    })
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setProcessing(true)

    try {
      const empData: any = {
        type: formData.type,
        nom: formData.nom,
        description: formData.description || null,
        actif: true
      }

      if (formData.type === 'chantier') {
        empData.chantier_info = {
          client: formData.chantier_client,
          adresse: formData.chantier_adresse,
          contact: formData.chantier_contact,
          date_debut: formData.chantier_date_debut,
          date_fin: formData.chantier_date_fin
        }
      } else if (formData.type === 'vehicule') {
        empData.utilisateur_id = formData.utilisateur_id || null
      }

      if (editingId) {
        const { error } = await supabase
          .from('stock_emplacements')
          .update(empData)
          .eq('id', editingId)

        if (error) throw error
        alert('Emplacement modifié !')
      } else {
        const { error } = await supabase
          .from('stock_emplacements')
          .insert([empData])

        if (error) throw error
        alert('Emplacement créé !')
      }

      setShowModal(false)
      loadData()
    } catch (error: any) {
      console.error('Erreur:', error)
      alert('Erreur : ' + error.message)
    } finally {
      setProcessing(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cet emplacement ?\n\nAttention : vérifiez qu\'il n\'y a plus de stock dedans.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('stock_emplacements')
        .delete()
        .eq('id', id)

      if (error) throw error
      alert('Emplacement supprimé !')
      loadData()
    } catch (error: any) {
      console.error('Erreur suppression:', error)
      alert('Erreur : ' + error.message)
    }
  }

  const emplacementsPrincipal = emplacements.filter(e => e.type === 'principal')
  const emplacementsChantier = emplacements.filter(e => e.type === 'chantier')
  const emplacementsVehicule = emplacements.filter(e => e.type === 'vehicule')

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-4 py-4 lg:px-8 flex items-center gap-3">
          <button
            onClick={() => router.push('/stock')}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <Warehouse className="w-5 h-5 text-indigo-500" />
            </div>
            <h1 className="text-lg lg:text-xl font-bold text-slate-900">Emplacements</h1>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 lg:px-8 lg:py-6 space-y-6">
        {/* Stock Principal */}
        <div>
          <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
            Stock Principal
          </h2>
          <div className="space-y-2">
            {emplacementsPrincipal.map((emp) => (
              <div key={emp.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                      <Warehouse className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900">{emp.nom}</h3>
                      {emp.description && <p className="text-xs text-slate-500">{emp.description}</p>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chantiers */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
              Stocks Départ Chantier
            </h2>
            <button
              onClick={() => openCreateModal('chantier')}
              className="h-9 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nouveau
            </button>
          </div>

          {emplacementsChantier.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
              <MapPin className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-slate-500 text-sm">Aucun chantier configuré</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {emplacementsChantier.map((emp) => (
                <div key={emp.id} className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4 text-amber-500" />
                        </div>
                        <h3 className="font-medium text-slate-900 truncate">{emp.nom}</h3>
                      </div>
                      {emp.chantier_info?.client && (
                        <p className="text-sm text-slate-600 mb-1">
                          Client: {emp.chantier_info.client}
                        </p>
                      )}
                      {emp.chantier_info?.adresse && (
                        <p className="text-xs text-slate-500 mb-1 truncate">
                          {emp.chantier_info.adresse}
                        </p>
                      )}
                      {emp.chantier_info?.date_debut && (
                        <p className="text-xs text-slate-400">
                          Du {new Date(emp.chantier_info.date_debut).toLocaleDateString('fr-FR')}
                          {emp.chantier_info.date_fin && ` au ${new Date(emp.chantier_info.date_fin).toLocaleDateString('fr-FR')}`}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => openEditModal(emp)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(emp.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Véhicules */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
              Stocks Véhicules
            </h2>
            <button
              onClick={() => openCreateModal('vehicule')}
              className="h-9 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nouveau
            </button>
          </div>

          {emplacementsVehicule.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
              <Truck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-slate-500 text-sm">Aucun véhicule configuré</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {emplacementsVehicule.map((emp) => (
                <div key={emp.id} className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Truck className="w-4 h-4 text-blue-500" />
                        </div>
                        <h3 className="font-medium text-slate-900 truncate">{emp.nom}</h3>
                      </div>
                      {emp.profiles && (
                        <p className="text-sm text-slate-600 flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {emp.profiles.full_name}
                        </p>
                      )}
                      {emp.description && (
                        <p className="text-xs text-slate-500 mt-1">{emp.description}</p>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => openEditModal(emp)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(emp.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">
                {editingId ? 'Modifier' : 'Créer'} un emplacement
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Type selection */}
              {!editingId && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Type d'emplacement *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'chantier' })}
                      className={cn(
                        'p-4 rounded-xl border-2 transition-all',
                        formData.type === 'chantier'
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-slate-200 hover:border-slate-300'
                      )}
                    >
                      <MapPin className={cn('w-6 h-6 mx-auto mb-2', formData.type === 'chantier' ? 'text-amber-600' : 'text-slate-400')} />
                      <p className="text-sm font-medium text-slate-900">Chantier</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'vehicule' })}
                      className={cn(
                        'p-4 rounded-xl border-2 transition-all',
                        formData.type === 'vehicule'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      )}
                    >
                      <Truck className={cn('w-6 h-6 mx-auto mb-2', formData.type === 'vehicule' ? 'text-blue-600' : 'text-slate-400')} />
                      <p className="text-sm font-medium text-slate-900">Véhicule</p>
                    </button>
                  </div>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Nom *
                </label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  required
                  placeholder={formData.type === 'chantier' ? 'Ex: Chantier ABC Corp' : 'Ex: Véhicule Jean Dupont'}
                  className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Informations complémentaires..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  rows={2}
                />
              </div>

              {/* Chantier fields */}
              {formData.type === 'chantier' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Client
                    </label>
                    <input
                      type="text"
                      value={formData.chantier_client}
                      onChange={(e) => setFormData({ ...formData, chantier_client: e.target.value })}
                      placeholder="Nom du client"
                      className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Adresse
                    </label>
                    <input
                      type="text"
                      value={formData.chantier_adresse}
                      onChange={(e) => setFormData({ ...formData, chantier_adresse: e.target.value })}
                      placeholder="Adresse du chantier"
                      className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Contact sur site
                    </label>
                    <input
                      type="text"
                      value={formData.chantier_contact}
                      onChange={(e) => setFormData({ ...formData, chantier_contact: e.target.value })}
                      placeholder="Nom et téléphone"
                      className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Date début
                      </label>
                      <input
                        type="date"
                        value={formData.chantier_date_debut}
                        onChange={(e) => setFormData({ ...formData, chantier_date_debut: e.target.value })}
                        className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Date fin
                      </label>
                      <input
                        type="date"
                        value={formData.chantier_date_fin}
                        onChange={(e) => setFormData({ ...formData, chantier_date_fin: e.target.value })}
                        className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Vehicule fields */}
              {formData.type === 'vehicule' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Technicien attribué
                  </label>
                  <select
                    value={formData.utilisateur_id}
                    onChange={(e) => setFormData({ ...formData, utilisateur_id: e.target.value })}
                    className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="">Non attribué</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.full_name} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={processing}
                  className="flex-1 h-11 px-4 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-600 rounded-lg font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="flex-1 h-11 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Save className="w-5 h-5" />
                  {processing ? 'Enregistrement...' : editingId ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
