'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import {
  ArrowLeft, MapPin, Truck, Warehouse, Plus, Edit2, Trash2,
  Users, Calendar, X, Save
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import type { StockEmplacement, EmplacementType } from '@/types/stock'

export default function EmplacementsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [emplacements, setEmplacements] = useState<StockEmplacement[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [users, setUsers] = useState<any[]>([])

  const [formData, setFormData] = useState({
    type: 'chantier' as EmplacementType,
    nom: '',
    description: '',
    // Pour chantiers
    chantier_client: '',
    chantier_adresse: '',
    chantier_contact: '',
    chantier_date_debut: '',
    chantier_date_fin: '',
    // Pour véhicules
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

    // Charger emplacements
    const { data: emps } = await supabase
      .from('stock_emplacements')
      .select(`
        *,
        profiles (id, full_name, email, role)
      `)
      .order('created_at', { ascending: false })

    if (emps) setEmplacements(emps)

    // Charger utilisateurs pour les véhicules
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
        // Modification
        const { error } = await supabase
          .from('stock_emplacements')
          .update(empData)
          .eq('id', editingId)

        if (error) throw error
        alert('Emplacement modifié !')
      } else {
        // Création
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-gray-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Chargement...</p>
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
              onClick={() => router.push('/stock')}
              variant="ghost"
              size="sm"
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Retour
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-purple-500 shadow-lg shadow-purple-500/20 flex items-center justify-center">
                <Warehouse className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-800">Gestion des emplacements</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Stock Principal */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              Stock Principal
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {emplacementsPrincipal.map((emp) => (
                <Card key={emp.id} variant="glass" padding="md" className="bg-white border border-gray-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{emp.nom}</h3>
                      {emp.description && <p className="text-sm text-gray-600">{emp.description}</p>}
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <Warehouse className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Chantiers */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                Stocks Départ Chantier
              </h2>
              <Button
                onClick={() => openCreateModal('chantier')}
                variant="primary"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
              >
                Nouveau chantier
              </Button>
            </div>

            {emplacementsChantier.length === 0 ? (
              <Card variant="glass" padding="lg" className="bg-white border border-gray-300 text-center">
                <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-600">Aucun chantier configuré</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {emplacementsChantier.map((emp, index) => (
                  <motion.div
                    key={emp.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card variant="glass" padding="md" className="bg-white border border-gray-300">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                              <MapPin className="w-4 h-4 text-orange-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900">{emp.nom}</h3>
                          </div>
                          {emp.chantier_info?.client && (
                            <p className="text-sm text-gray-600 mb-1">
                              Client: {emp.chantier_info.client}
                            </p>
                          )}
                          {emp.chantier_info?.adresse && (
                            <p className="text-sm text-gray-600 mb-1">
                              📍 {emp.chantier_info.adresse}
                            </p>
                          )}
                          {emp.chantier_info?.date_debut && (
                            <p className="text-xs text-gray-500">
                              Du {new Date(emp.chantier_info.date_debut).toLocaleDateString('fr-FR')}
                              {emp.chantier_info.date_fin && ` au ${new Date(emp.chantier_info.date_fin).toLocaleDateString('fr-FR')}`}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEditModal(emp)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                          >
                            <Edit2 className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleDelete(emp.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Véhicules */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                Stocks Véhicules
              </h2>
              <Button
                onClick={() => openCreateModal('vehicule')}
                variant="primary"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
              >
                Nouveau véhicule
              </Button>
            </div>

            {emplacementsVehicule.length === 0 ? (
              <Card variant="glass" padding="lg" className="bg-white border border-gray-300 text-center">
                <Truck className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-600">Aucun véhicule configuré</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {emplacementsVehicule.map((emp, index) => (
                  <motion.div
                    key={emp.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card variant="glass" padding="md" className="bg-white border border-gray-300">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                              <Truck className="w-4 h-4 text-blue-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900">{emp.nom}</h3>
                          </div>
                          {emp.profiles && (
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {emp.profiles.full_name}
                            </p>
                          )}
                          {emp.description && (
                            <p className="text-sm text-gray-500 mt-1">{emp.description}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEditModal(emp)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                          >
                            <Edit2 className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleDelete(emp.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal Création/Édition */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card variant="glass" padding="lg" className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800">
                {editingId ? 'Modifier' : 'Créer'} un emplacement
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type (uniquement en création) */}
              {!editingId && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Type d'emplacement *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'chantier' })}
                      className={`p-4 rounded-lg border-2 transition ${
                        formData.type === 'chantier'
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <MapPin className="w-6 h-6 mx-auto mb-2 text-orange-600" />
                      <p className="font-medium text-sm">Chantier</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'vehicule' })}
                      className={`p-4 rounded-lg border-2 transition ${
                        formData.type === 'vehicule'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <Truck className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                      <p className="font-medium text-sm">Véhicule</p>
                    </button>
                  </div>
                </div>
              )}

              {/* Nom */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nom *
                </label>
                <Input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  required
                  placeholder={formData.type === 'chantier' ? 'Ex: Chantier ABC Corp' : 'Ex: Véhicule Jean Dupont'}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Informations complémentaires..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={2}
                />
              </div>

              {/* Champs spécifiques chantier */}
              {formData.type === 'chantier' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Client
                    </label>
                    <Input
                      type="text"
                      value={formData.chantier_client}
                      onChange={(e) => setFormData({ ...formData, chantier_client: e.target.value })}
                      placeholder="Nom du client"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Adresse
                    </label>
                    <Input
                      type="text"
                      value={formData.chantier_adresse}
                      onChange={(e) => setFormData({ ...formData, chantier_adresse: e.target.value })}
                      placeholder="Adresse du chantier"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Contact sur site
                    </label>
                    <Input
                      type="text"
                      value={formData.chantier_contact}
                      onChange={(e) => setFormData({ ...formData, chantier_contact: e.target.value })}
                      placeholder="Nom et téléphone"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Date début
                      </label>
                      <Input
                        type="date"
                        value={formData.chantier_date_debut}
                        onChange={(e) => setFormData({ ...formData, chantier_date_debut: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Date fin (prévue)
                      </label>
                      <Input
                        type="date"
                        value={formData.chantier_date_fin}
                        onChange={(e) => setFormData({ ...formData, chantier_date_fin: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Champs spécifiques véhicule */}
              {formData.type === 'vehicule' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Technicien attribué
                  </label>
                  <select
                    value={formData.utilisateur_id}
                    onChange={(e) => setFormData({ ...formData, utilisateur_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  onClick={() => setShowModal(false)}
                  variant="secondary"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  icon={<Save className="w-5 h-5" />}
                >
                  {editingId ? 'Enregistrer' : 'Créer'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
