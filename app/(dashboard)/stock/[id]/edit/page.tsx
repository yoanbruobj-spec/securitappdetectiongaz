'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Package, Save, Trash2, X, Image as ImageIcon } from 'lucide-react'
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
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null)
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
      setCurrentPhotoUrl(art.photo_url)
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

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB max
        alert('L\'image ne doit pas dépasser 5 MB')
        return
      }

      setSelectedImage(file)

      // Créer preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  function removeImage() {
    setSelectedImage(null)
    setImagePreview(null)
  }

  function removeCurrentPhoto() {
    setCurrentPhotoUrl(null)
  }

  async function uploadImage(): Promise<string | null> {
    if (!selectedImage) return null

    try {
      const fileExt = selectedImage.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `stock-photos/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('stock-photos')
        .upload(filePath, selectedImage)

      if (uploadError) {
        console.error('Erreur upload:', uploadError)
        throw uploadError
      }

      const { data: { publicUrl } } = supabase.storage
        .from('stock-photos')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('Erreur lors de l\'upload de l\'image:', error)
      return null
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setProcessing(true)

    try {
      // Upload de la nouvelle image si présente
      let photoUrl: string | null | undefined = currentPhotoUrl

      if (selectedImage) {
        const uploadedUrl = await uploadImage()
        if (uploadedUrl) {
          photoUrl = uploadedUrl
        } else {
          alert('Erreur lors de l\'upload de l\'image')
        }
      }

      // Si l'image actuelle a été supprimée mais pas remplacée
      if (!currentPhotoUrl && !selectedImage) {
        photoUrl = null
      }

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
          description: formData.description || null,
          photo_url: photoUrl
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
        <div className="px-4 lg:px-8 py-3 lg:py-4">
          <div className="flex items-center justify-between mb-2 lg:mb-0">
            <div className="flex items-center gap-2 lg:gap-3">
              <Button
                onClick={() => router.push(`/stock/${params.id}`)}
                variant="ghost"
                size="sm"
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                <span className="hidden sm:inline">Retour</span>
              </Button>
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-gradient-to-br from-purple-600 to-purple-500 shadow-lg shadow-purple-500/20 flex items-center justify-center">
                  <Package className="w-4 lg:w-5 h-4 lg:h-5 text-white" />
                </div>
                <h1 className="text-base lg:text-xl font-bold text-slate-800">Modifier</h1>
              </div>
            </div>
            <Button
              onClick={handleDelete}
              variant="danger"
              icon={<Trash2 className="w-4 lg:w-5 h-4 lg:h-5" />}
              className="text-xs lg:text-sm px-3 lg:px-4"
            >
              <span className="hidden sm:inline">Supprimer</span>
              <span className="sm:hidden">🗑️</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 lg:px-8 py-4 lg:py-6">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit}>
            <Card variant="glass" padding="lg" className="bg-white border border-gray-300">
              <div className="space-y-3 lg:space-y-4">
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

                {/* Section upload d'image */}
                <div>
                  <label className="block text-xs lg:text-sm font-medium text-slate-700 mb-2">
                    Photo de l'article
                  </label>

                  {/* Image actuelle */}
                  {currentPhotoUrl && !imagePreview && (
                    <div className="relative border-2 border-gray-200 rounded-lg p-3 lg:p-4 mb-3">
                      <button
                        type="button"
                        onClick={removeCurrentPhoto}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition z-10"
                      >
                        <X className="w-3 lg:w-4 h-3 lg:h-4" />
                      </button>
                      <img
                        src={currentPhotoUrl}
                        alt="Photo actuelle"
                        className="w-full h-32 lg:h-48 object-contain rounded-lg bg-gray-50"
                      />
                      <p className="text-xs text-gray-500 text-center mt-2">Photo actuelle</p>
                    </div>
                  )}

                  {/* Nouvelle image sélectionnée */}
                  {imagePreview && (
                    <div className="relative border-2 border-gray-200 rounded-lg p-3 lg:p-4 mb-3">
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition z-10"
                      >
                        <X className="w-3 lg:w-4 h-3 lg:h-4" />
                      </button>
                      <img
                        src={imagePreview}
                        alt="Nouvelle photo"
                        className="w-full h-32 lg:h-48 object-contain rounded-lg bg-gray-50"
                      />
                      <p className="text-xs text-gray-500 text-center mt-2">Nouvelle photo (sera uploadée)</p>
                    </div>
                  )}

                  {/* Zone d'upload */}
                  {!imagePreview && (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 lg:p-6 text-center hover:border-purple-400 transition">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                        id="image-upload-edit"
                      />
                      <label
                        htmlFor="image-upload-edit"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <div className="w-10 lg:w-12 h-10 lg:h-12 rounded-full bg-purple-100 flex items-center justify-center">
                          <ImageIcon className="w-5 lg:w-6 h-5 lg:h-6 text-purple-600" />
                        </div>
                        <div className="text-xs lg:text-sm text-gray-600">
                          <span className="text-purple-600 font-medium">
                            {currentPhotoUrl ? 'Remplacer l\'image' : 'Ajouter une image'}
                          </span>
                        </div>
                        <div className="text-[10px] lg:text-xs text-gray-400">
                          PNG, JPG jusqu'à 5MB
                        </div>
                      </label>
                    </div>
                  )}
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

              <div className="mt-4 lg:mt-6 flex flex-col sm:flex-row justify-end gap-2 lg:gap-3">
                <Button
                  type="button"
                  onClick={() => router.push(`/stock/${params.id}`)}
                  variant="secondary"
                  className="w-full sm:w-auto text-sm lg:text-base"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  icon={<Save className="w-4 lg:w-5 h-4 lg:h-5" />}
                  disabled={processing}
                  className="w-full sm:w-auto text-sm lg:text-base"
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
