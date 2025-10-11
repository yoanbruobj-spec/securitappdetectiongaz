'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { ArrowLeft, Settings, Plus, Edit, Trash2, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
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
        // Modifier
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
        // Créer
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Skeleton height="400px" />
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
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-500 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-800">Gestion des catégories</h1>
            </div>
          </div>
          {!showForm && (
            <Button
              onClick={() => setShowForm(true)}
              variant="primary"
              icon={<Plus className="w-5 h-5" />}
            >
              Nouvelle catégorie
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-4xl mx-auto">
          {showForm && (
            <Card variant="glass" padding="lg" className="mb-6 bg-white border border-gray-300">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">
                {editingId ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Nom *
                    </label>
                    <Input
                      type="text"
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      required
                      placeholder="Ex: Cellules détecteurs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Icône (emoji)
                      </label>
                      <Input
                        type="text"
                        value={formData.icone}
                        onChange={(e) => setFormData({ ...formData, icone: e.target.value })}
                        placeholder="Ex: 🔋"
                        maxLength={2}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Ordre d'affichage
                      </label>
                      <Input
                        type="number"
                        value={formData.ordre}
                        onChange={(e) => setFormData({ ...formData, ordre: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      onClick={cancelForm}
                      variant="secondary"
                      icon={<X className="w-5 h-5" />}
                      disabled={processing}
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      icon={<Save className="w-5 h-5" />}
                      disabled={processing}
                    >
                      {processing ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                  </div>
                </div>
              </form>
            </Card>
          )}

          {categories.length === 0 ? (
            <div className="text-center py-16">
              <Settings className="w-16 h-16 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-600 text-lg mb-4">Aucune catégorie</p>
              <Button
                onClick={() => setShowForm(true)}
                variant="primary"
                icon={<Plus className="w-5 h-5" />}
              >
                Créer la première catégorie
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {categories.map((cat, index) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card variant="glass" padding="lg" className="bg-white border border-gray-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {cat.icone && (
                          <div className="text-2xl">{cat.icone}</div>
                        )}
                        <div>
                          <h3 className="font-semibold text-slate-800">{cat.nom}</h3>
                          <p className="text-sm text-slate-500">Ordre: {cat.ordre}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => startEdit(cat)}
                          variant="secondary"
                          size="sm"
                          icon={<Edit className="w-4 h-4" />}
                        >
                          Modifier
                        </Button>
                        <Button
                          onClick={() => handleDelete(cat.id, cat.nom)}
                          variant="danger"
                          size="sm"
                          icon={<Trash2 className="w-4 h-4" />}
                        >
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
