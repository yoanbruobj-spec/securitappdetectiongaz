'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Package, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import type { StockArticle, StockCategorie } from '@/types/stock'

export default function EditArticlePage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  const [article, setArticle] = useState<StockArticle | null>(null)
  const [categories, setCategories] = useState<StockCategorie[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [formData, setFormData] = useState({
    nom: '',
    reference: '',
    categorie_id: '',
    numeros_serie: '',
    emplacement: '',
    prix_unitaire: '',
    fournisseur: '',
    seuil_alerte: 10,
    description: ''
  })

  useEffect(() => {
    checkAuth()
    loadData()
  }, [params.id])

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

    // Charger article
    const { data: art } = await supabase
      .from('stock_articles')
      .select(`
        *,
        stock_categories (*)
      `)
      .eq('id', params.id)
      .single()

    if (art) {
      setArticle(art)
      setFormData({
        nom: art.nom,
        reference: art.reference,
        categorie_id: art.categorie_id || '',
        numeros_serie: art.numeros_serie || '',
        emplacement: art.emplacement || '',
        prix_unitaire: art.prix_unitaire ? art.prix_unitaire.toString() : '',
        fournisseur: art.fournisseur || '',
        seuil_alerte: art.seuil_alerte,
        description: art.description || ''
      })
    }

    // Charger catégories
    const { data: cats } = await supabase
      .from('stock_categories')
      .select('*')
      .order('ordre', { ascending: true })

    if (cats) setCategories(cats)

    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setProcessing(true)

    try {
      const { error } = await supabase
        .from('stock_articles')
        .update({
          nom: formData.nom,
          reference: formData.reference,
          categorie_id: formData.categorie_id || null,
          numeros_serie: formData.numeros_serie || null,
          emplacement: formData.emplacement || null,
          prix_unitaire: formData.prix_unitaire ? parseFloat(formData.prix_unitaire) : null,
          fournisseur: formData.fournisseur || null,
          seuil_alerte: formData.seuil_alerte,
          description: formData.description || null
        })
        .eq('id', params.id)

      if (error) throw error

      alert('Article modifié avec succès !')
      router.push(`/stock/${params.id}`)
    } catch (error: any) {
      console.error('Erreur modification:', error)
      alert('Erreur : ' + error.message)
    } finally {
      setProcessing(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Supprimer cet article définitivement ?\n\nL\'historique des mouvements sera conservé.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('stock_articles')
        .delete()
        .eq('id', params.id)

      if (error) throw error

      alert('Article supprimé !')
      router.push('/stock')
    } catch (error: any) {
      console.error('Erreur suppression:', error)
      alert('Erreur : ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Skeleton height="400px" />
      </div>
    )
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Article non trouvé</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-300 shadow-sm sticky top-0 z-50">
        <div className="px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push(`/stock/${params.id}`)}
              variant="ghost"
              size="sm"
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Retour
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-purple-500 shadow-lg shadow-purple-500/20 flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-800">Modifier l'article</h1>
            </div>
          </div>
          <Button
            onClick={handleDelete}
            variant="danger"
            icon={<Trash2 className="w-5 h-5" />}
          >
            Supprimer
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit}>
            <Card variant="glass" padding="lg" className="bg-white border border-gray-300">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Nom de l'article *
                    </label>
                    <Input
                      type="text"
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Référence *
                    </label>
                    <Input
                      type="text"
                      value={formData.reference}
                      onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Catégorie
                    </label>
                    <select
                      value={formData.categorie_id}
                      onChange={(e) => setFormData({ ...formData, categorie_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Sans catégorie</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.nom}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Emplacement
                    </label>
                    <Input
                      type="text"
                      value={formData.emplacement}
                      onChange={(e) => setFormData({ ...formData, emplacement: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Numéros de série
                  </label>
                  <textarea
                    value={formData.numeros_serie}
                    onChange={(e) => setFormData({ ...formData, numeros_serie: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Stock actuel
                    </label>
                    <Input
                      type="number"
                      value={article.quantite}
                      disabled
                      className="bg-gray-100"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Modifiable via mouvements uniquement
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Seuil d'alerte *
                    </label>
                    <Input
                      type="number"
                      value={formData.seuil_alerte}
                      onChange={(e) => setFormData({ ...formData, seuil_alerte: parseInt(e.target.value) || 10 })}
                      required
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Prix unitaire (€)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.prix_unitaire}
                      onChange={(e) => setFormData({ ...formData, prix_unitaire: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Fournisseur
                  </label>
                  <Input
                    type="text"
                    value={formData.fournisseur}
                    onChange={(e) => setFormData({ ...formData, fournisseur: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={3}
                  />
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-slate-600">
                    <strong>QR Code:</strong> {article.qr_code}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Le QR code ne peut pas être modifié
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button
                  type="button"
                  onClick={() => router.push(`/stock/${params.id}`)}
                  variant="secondary"
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
            </Card>
          </form>
        </div>
      </main>
    </div>
  )
}
