'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Package, Save } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import type { StockCategorie } from '@/types/stock'

export default function NouveauArticlePage() {
  const router = useRouter()
  const supabase = createClient()

  const [categories, setCategories] = useState<StockCategorie[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nom: '',
    reference: '',
    categorie_id: '',
    numeros_serie: '',
    emplacement: '',
    quantite: 0,
    prix_unitaire: '',
    fournisseur: '',
    seuil_alerte: 10,
    description: ''
  })

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
    const { data } = await supabase
      .from('stock_categories')
      .select('*')
      .order('ordre', { ascending: true })

    if (data) setCategories(data)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Générer QR code unique
      const qrCode = `SECURIT-ART-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      const articleData = {
        nom: formData.nom,
        reference: formData.reference,
        categorie_id: formData.categorie_id || null,
        numeros_serie: formData.numeros_serie || null,
        emplacement: formData.emplacement || null,
        quantite: formData.quantite,
        prix_unitaire: formData.prix_unitaire ? parseFloat(formData.prix_unitaire) : null,
        fournisseur: formData.fournisseur || null,
        seuil_alerte: formData.seuil_alerte,
        description: formData.description || null,
        qr_code: qrCode,
        created_by: user.id
      }

      const { data, error } = await supabase
        .from('stock_articles')
        .insert([articleData])
        .select()
        .single()

      if (error) throw error

      // Si quantité initiale > 0, créer un mouvement d'entrée
      if (formData.quantite > 0) {
        await supabase
          .from('stock_mouvements')
          .insert([{
            article_id: data.id,
            type: 'entree',
            quantite: formData.quantite,
            quantite_avant: 0,
            quantite_apres: formData.quantite,
            utilisateur_id: user.id,
            notes: 'Création article - stock initial',
            date_mouvement: new Date().toISOString()
          }])
      }

      alert('Article créé avec succès !')
      router.push(`/stock/${data.id}`)
    } catch (error: any) {
      console.error('Erreur création article:', error)
      alert('Erreur lors de la création : ' + error.message)
    } finally {
      setLoading(false)
    }
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
                <Package className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-800">Nouvel article</h1>
            </div>
          </div>
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
                      placeholder="Ex: Cellule CO - ABC-123"
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
                      placeholder="Ex: CEL-CO-ABC-001"
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
                      placeholder="Ex: Étagère A-1"
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
                    placeholder="Ex: 12345, 12346, 12347..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Quantité initiale *
                    </label>
                    <Input
                      type="number"
                      value={formData.quantite}
                      onChange={(e) => setFormData({ ...formData, quantite: parseInt(e.target.value) || 0 })}
                      required
                      min="0"
                    />
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
                      placeholder="0.00"
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
                    placeholder="Ex: ABC Supplies"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Informations complémentaires..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={3}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button
                  type="button"
                  onClick={() => router.push('/stock')}
                  variant="secondary"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  icon={<Save className="w-5 h-5" />}
                  disabled={loading}
                >
                  {loading ? 'Création...' : 'Créer l\'article'}
                </Button>
              </div>
            </Card>
          </form>
        </div>
      </main>
    </div>
  )
}
