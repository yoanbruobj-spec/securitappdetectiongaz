'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Settings, Plus, Edit, Trash2, Save, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StockCategorie } from '@/types/stock'

export default function CategoriesStockPage() {
  const router = useRouter()
  const supabase = createClient()

  const [categories, setCategories] = useState<StockCategorie[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ nom: '', icone: '', ordre: 0 })
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    checkAuth()
    loadCategories()
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

  async function loadCategories() {
    setLoading(true)
    const { data } = await supabase
      .from('stock_categories')
      .select('*')
      .order('ordre', { ascending: true })

    if (data) setCategories(data)
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setProcessing(true)

    try {
      if (editingId) {
        const { error } = await supabase
          .from('stock_categories')
          .update({
            nom: formData.nom,
            icone: formData.icone || null,
            ordre: formData.ordre
          })
          .eq('id', editingId)

        if (error) throw error
        alert('Catégorie modifiée !')
      } else {
        const { error } = await supabase
          .from('stock_categories')
          .insert([{
            nom: formData.nom,
            icone: formData.icone || null,
            ordre: formData.ordre
          }])

        if (error) throw error
        alert('Catégorie créée !')
      }

      setShowForm(false)
      setEditingId(null)
      setFormData({ nom: '', icone: '', ordre: 0 })
      loadCategories()
    } catch (error: any) {
      console.error('Erreur:', error)
      alert('Erreur : ' + error.message)
    } finally {
      setProcessing(false)
    }
  }

  async function handleDelete(id: string, nom: string) {
    if (!confirm(`Supprimer la catégorie "${nom}" ?\n\nAttention : les articles liés perdront leur catégorie.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('stock_categories')
        .delete()
        .eq('id', id)

      if (error) throw error
      alert('Catégorie supprimée !')
      loadCategories()
    } catch (error: any) {
      console.error('Erreur:', error)
      alert('Erreur : ' + error.message)
    }
  }

  function startEdit(cat: StockCategorie) {
    setEditingId(cat.id)
    setFormData({
      nom: cat.nom,
      icone: cat.icone || '',
      ordre: cat.ordre
    })
    setShowForm(true)
  }

  function cancelForm() {
    setShowForm(false)
    setEditingId(null)
    setFormData({ nom: '', icone: '', ordre: 0 })
  }

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
        <div className="px-4 py-4 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/stock')}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <Settings className="w-5 h-5 text-purple-500" />
              </div>
              <h1 className="text-lg lg:text-xl font-bold text-slate-900">Catégories</h1>
            </div>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="h-10 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Nouvelle</span>
            </button>
          )}
        </div>
      </header>

      <div className="px-4 py-4 lg:px-8 lg:py-6">
        <div className="max-w-2xl mx-auto">
          {/* Form */}
          {showForm && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 lg:p-6 mb-4">
              <h2 className="font-semibold text-slate-900 mb-4">
                {editingId ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Nom *
                    </label>
                    <input
                      type="text"
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      required
                      placeholder="Ex: Cellules détecteurs"
                      className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Icône (emoji)
                      </label>
                      <input
                        type="text"
                        value={formData.icone}
                        onChange={(e) => setFormData({ ...formData, icone: e.target.value })}
                        placeholder="Ex: 🔋"
                        maxLength={2}
                        className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 text-center text-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Ordre
                      </label>
                      <input
                        type="number"
                        value={formData.ordre}
                        onChange={(e) => setFormData({ ...formData, ordre: parseInt(e.target.value) || 0 })}
                        className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={cancelForm}
                      disabled={processing}
                      className="flex-1 h-11 px-4 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-600 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <X className="w-5 h-5" />
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={processing}
                      className="flex-1 h-11 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <Save className="w-5 h-5" />
                      {processing ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Categories list */}
          {categories.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucune catégorie</h3>
              <p className="text-slate-500 mb-6">Créez votre première catégorie pour organiser vos articles</p>
              <button
                onClick={() => setShowForm(true)}
                className="h-10 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium flex items-center gap-2 mx-auto transition-colors"
              >
                <Plus className="w-5 h-5" />
                Créer une catégorie
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {cat.icone && (
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-xl">
                          {cat.icone}
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium text-slate-900">{cat.nom}</h3>
                        <p className="text-xs text-slate-500">Ordre: {cat.ordre}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(cat)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id, cat.nom)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-500 transition-colors"
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
    </div>
  )
}
