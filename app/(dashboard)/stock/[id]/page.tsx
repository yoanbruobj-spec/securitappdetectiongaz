'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Edit, Download, TrendingUp, TrendingDown, AlertCircle,
  ArrowRightLeft, Warehouse, MapPin, Truck
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { Input } from '@/components/ui/Input'
import QRCodeLib from 'qrcode'
import type { StockArticle, StockMouvement, StockEmplacement, StockInventaire } from '@/types/stock'

type ActionType = 'entree' | 'sortie' | 'transfert'

export default function ArticleDetailPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)

  const [article, setArticle] = useState<StockArticle | null>(null)
  const [inventaire, setInventaire] = useState<StockInventaire[]>([])
  const [emplacements, setEmplacements] = useState<StockEmplacement[]>([])
  const [mouvements, setMouvements] = useState<StockMouvement[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)

  // Modal
  const [showModal, setShowModal] = useState(false)
  const [actionType, setActionType] = useState<ActionType>('entree')
  const [formData, setFormData] = useState({
    quantite: 1,
    notes: '',
    emplacement_id: '', // Pour entrée/sortie
    emplacement_source_id: '', // Pour transfert
    emplacement_destination_id: '' // Pour transfert
  })
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    checkAuth()
    loadData()
  }, [params.id])

  // Générer QR code
  useEffect(() => {
    async function generateQR() {
      if (!article) return
      if (!qrCanvasRef.current) {
        setTimeout(generateQR, 100)
        return
      }

      try {
        const qrData = article.qr_code || `SECURIT-ART-${article.id}`

        await QRCodeLib.toCanvas(qrCanvasRef.current, qrData, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })

        // Sauvegarder QR si absent
        if (!article.qr_code) {
          await supabase
            .from('stock_articles')
            .update({ qr_code: qrData })
            .eq('id', article.id)
        }
      } catch (err) {
        console.error('Erreur génération QR:', err)
      }
    }

    generateQR()
  }, [article])

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

    if (profile) {
      setUserRole(profile.role)
    }
  }

  async function loadData() {
    setLoading(true)
    await reloadData()
    setLoading(false)
  }

  async function reloadData() {
    // Charger article
    const { data: art } = await supabase
      .from('stock_articles')
      .select(`
        *,
        stock_categories (*)
      `)
      .eq('id', params.id)
      .single()

    if (art) setArticle(art)

    // Charger inventaire par emplacement
    const { data: inv } = await supabase
      .from('stock_inventaire')
      .select(`
        *,
        stock_emplacements (
          *,
          profiles (id, full_name, email, role)
        )
      `)
      .eq('article_id', params.id)
      .order('quantite', { ascending: false })

    if (inv) setInventaire(inv)

    // Charger tous les emplacements
    const { data: emps } = await supabase
      .from('stock_emplacements')
      .select(`
        *,
        profiles (id, full_name, email, role)
      `)
      .eq('actif', true)
      .order('type', { ascending: true })

    if (emps) setEmplacements(emps)

    // Charger mouvements avec emplacements
    const { data: mouvs } = await supabase
      .from('stock_mouvements')
      .select(`
        *,
        profiles (id, full_name, email, role),
        emplacement_source:stock_emplacements!stock_mouvements_emplacement_source_id_fkey(id, nom, type),
        emplacement_destination:stock_emplacements!stock_mouvements_emplacement_destination_id_fkey(id, nom, type)
      `)
      .eq('article_id', params.id)
      .order('date_mouvement', { ascending: false })

    if (mouvs) setMouvements(mouvs)
  }

  function openModal(type: ActionType) {
    setActionType(type)

    // Pré-remplir l'emplacement par défaut
    const stockPrincipal = emplacements.find(e => e.type === 'principal')

    setFormData({
      quantite: 1,
      notes: '',
      emplacement_id: stockPrincipal?.id || '',
      emplacement_source_id: stockPrincipal?.id || '',
      emplacement_destination_id: ''
    })
    setShowModal(true)
  }

  async function handleSubmit() {
    if (formData.quantite <= 0) {
      alert('Quantité invalide')
      return
    }

    setProcessing(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      if (actionType === 'transfert') {
        await handleTransfert(user.id)
      } else {
        await handleEntreeSortie(user.id)
      }

      alert('Opération réussie !')
      setShowModal(false)
      setFormData({ quantite: 1, notes: '', emplacement_id: '', emplacement_source_id: '', emplacement_destination_id: '' })
      reloadData()
    } catch (error: any) {
      console.error('Erreur:', error)
      alert('Erreur : ' + error.message)
    } finally {
      setProcessing(false)
    }
  }

  async function handleEntreeSortie(userId: string) {
    if (!formData.emplacement_id) {
      throw new Error('Sélectionnez un emplacement')
    }

    // Récupérer quantité actuelle dans cet emplacement
    const invItem = inventaire.find(i => i.emplacement_id === formData.emplacement_id)
    const quantiteAvant = invItem?.quantite || 0
    const quantiteApres = actionType === 'entree'
      ? quantiteAvant + formData.quantite
      : quantiteAvant - formData.quantite

    if (quantiteApres < 0) {
      throw new Error('Stock insuffisant dans cet emplacement')
    }

    // Créer mouvement
    await supabase
      .from('stock_mouvements')
      .insert([{
        article_id: article!.id,
        type: actionType,
        quantite: formData.quantite,
        quantite_avant: quantiteAvant,
        quantite_apres: quantiteApres,
        utilisateur_id: userId,
        emplacement_destination_id: actionType === 'entree' ? formData.emplacement_id : null,
        emplacement_source_id: actionType === 'sortie' ? formData.emplacement_id : null,
        notes: formData.notes || null,
        date_mouvement: new Date().toISOString()
      }])

    // Mettre à jour inventaire
    if (quantiteApres === 0) {
      // Supprimer la ligne si quantité = 0
      await supabase
        .from('stock_inventaire')
        .delete()
        .eq('article_id', article!.id)
        .eq('emplacement_id', formData.emplacement_id)
    } else {
      // Upsert
      await supabase
        .from('stock_inventaire')
        .upsert({
          article_id: article!.id,
          emplacement_id: formData.emplacement_id,
          quantite: quantiteApres
        }, {
          onConflict: 'article_id,emplacement_id'
        })
    }

    // Mettre à jour le stock total dans stock_articles
    const stockTotal = inventaire.reduce((sum, inv) => {
      if (inv.emplacement_id === formData.emplacement_id) {
        return sum + quantiteApres
      }
      return sum + inv.quantite
    }, 0)

    await supabase
      .from('stock_articles')
      .update({ quantite: stockTotal })
      .eq('id', article!.id)
  }

  async function handleTransfert(userId: string) {
    if (!formData.emplacement_source_id || !formData.emplacement_destination_id) {
      throw new Error('Sélectionnez les emplacements source et destination')
    }

    if (formData.emplacement_source_id === formData.emplacement_destination_id) {
      throw new Error('Source et destination doivent être différentes')
    }

    // Récupérer quantités actuelles
    const invSource = inventaire.find(i => i.emplacement_id === formData.emplacement_source_id)
    const invDest = inventaire.find(i => i.emplacement_id === formData.emplacement_destination_id)

    const qteSource = invSource?.quantite || 0
    const qteDest = invDest?.quantite || 0

    if (qteSource < formData.quantite) {
      throw new Error('Stock insuffisant dans l\'emplacement source')
    }

    const nouvelleQteSource = qteSource - formData.quantite
    const nouvelleQteDest = qteDest + formData.quantite

    // Créer mouvement de transfert
    await supabase
      .from('stock_mouvements')
      .insert([{
        article_id: article!.id,
        type: 'transfert',
        quantite: formData.quantite,
        quantite_avant: qteSource,
        quantite_apres: nouvelleQteSource,
        utilisateur_id: userId,
        emplacement_source_id: formData.emplacement_source_id,
        emplacement_destination_id: formData.emplacement_destination_id,
        notes: formData.notes || null,
        date_mouvement: new Date().toISOString()
      }])

    // Mettre à jour inventaire source
    if (nouvelleQteSource === 0) {
      await supabase
        .from('stock_inventaire')
        .delete()
        .eq('article_id', article!.id)
        .eq('emplacement_id', formData.emplacement_source_id)
    } else {
      await supabase
        .from('stock_inventaire')
        .update({ quantite: nouvelleQteSource })
        .eq('article_id', article!.id)
        .eq('emplacement_id', formData.emplacement_source_id)
    }

    // Mettre à jour inventaire destination
    await supabase
      .from('stock_inventaire')
      .upsert({
        article_id: article!.id,
        emplacement_id: formData.emplacement_destination_id,
        quantite: nouvelleQteDest
      }, {
        onConflict: 'article_id,emplacement_id'
      })
  }

  function downloadQR() {
    if (!qrCanvasRef.current || !article) return
    const url = qrCanvasRef.current.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `QR_${article.reference}.png`
    link.href = url
    link.click()
  }

  function getEmplacementColor(type: string) {
    switch (type) {
      case 'principal': return 'bg-green-100 text-green-700 border-green-300'
      case 'chantier': return 'bg-orange-100 text-orange-700 border-orange-300'
      case 'vehicule': return 'bg-blue-100 text-blue-700 border-blue-300'
      default: return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  function getEmplacementIcon(type: string) {
    switch (type) {
      case 'principal': return <Warehouse className="w-4 h-4" />
      case 'chantier': return <MapPin className="w-4 h-4" />
      case 'vehicule': return <Truck className="w-4 h-4" />
      default: return null
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

  const stockTotal = inventaire.reduce((sum, inv) => sum + inv.quantite, 0)
  const isAlerte = stockTotal <= article.seuil_alerte

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
            <h1 className="text-xl font-bold text-slate-800">{article.nom}</h1>
            {isAlerte && <Badge variant="danger">Alerte stock</Badge>}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => openModal('sortie')}
              variant="secondary"
              icon={<TrendingDown className="w-5 h-5" />}
            >
              Sortie
            </Button>
            <Button
              onClick={() => openModal('entree')}
              variant="primary"
              icon={<TrendingUp className="w-5 h-5" />}
            >
              Entrée
            </Button>
            <Button
              onClick={() => openModal('transfert')}
              variant="secondary"
              icon={<ArrowRightLeft className="w-5 h-5" />}
            >
              Transfert
            </Button>
            {userRole === 'admin' && (
              <Button
                onClick={() => router.push(`/stock/${article.id}/edit`)}
                variant="secondary"
                icon={<Edit className="w-5 h-5" />}
              >
                Modifier
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-8 py-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Infos article */}
          <div className="col-span-2 space-y-6">
            <Card variant="glass" padding="lg" className="bg-white border border-gray-300">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Informations</h2>

              {article.photo_url && (
                <div className="mb-6">
                  <img
                    src={article.photo_url}
                    alt={article.nom}
                    className="w-full h-64 object-cover rounded-lg border-2 border-gray-200"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Référence</p>
                  <p className="font-medium text-slate-800">{article.reference}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Catégorie</p>
                  <p className="font-medium text-slate-800">{article.stock_categories?.nom || 'Sans catégorie'}</p>
                </div>
                {article.emplacement && (
                  <div>
                    <p className="text-sm text-slate-500">Emplacement physique</p>
                    <p className="font-medium text-slate-800">📍 {article.emplacement}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-slate-500">Stock total</p>
                  <p className="text-2xl font-bold text-slate-800">{stockTotal} unités</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Seuil d'alerte</p>
                  <p className="font-medium text-slate-800">{article.seuil_alerte} unités</p>
                </div>
                {article.prix_unitaire && (
                  <div>
                    <p className="text-sm text-slate-500">Prix unitaire</p>
                    <p className="font-medium text-slate-800">{article.prix_unitaire} €</p>
                  </div>
                )}
                {article.fournisseur && (
                  <div>
                    <p className="text-sm text-slate-500">Fournisseur</p>
                    <p className="font-medium text-slate-800">{article.fournisseur}</p>
                  </div>
                )}
              </div>
              {article.numeros_serie && (
                <div className="mt-4">
                  <p className="text-sm text-slate-500">Numéros de série</p>
                  <p className="text-sm text-slate-800 mt-1">{article.numeros_serie}</p>
                </div>
              )}
              {article.description && (
                <div className="mt-4">
                  <p className="text-sm text-slate-500">Description</p>
                  <p className="text-sm text-slate-800 mt-1">{article.description}</p>
                </div>
              )}
            </Card>

            {/* Répartition par emplacement */}
            <Card variant="glass" padding="lg" className="bg-white border border-gray-300">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Répartition du stock</h2>
              {inventaire.length === 0 ? (
                <p className="text-slate-500 text-center py-8">Stock vide</p>
              ) : (
                <div className="space-y-3">
                  {inventaire.map((inv, index) => (
                    <motion.div
                      key={inv.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-center justify-between p-3 rounded-lg border-2 ${getEmplacementColor(inv.stock_emplacements?.type || '')}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/50 flex items-center justify-center">
                          {getEmplacementIcon(inv.stock_emplacements?.type || '')}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">
                            {inv.stock_emplacements?.nom}
                          </p>
                          {inv.stock_emplacements?.profiles && (
                            <p className="text-xs opacity-75">
                              {inv.stock_emplacements.profiles.full_name}
                            </p>
                          )}
                          {inv.stock_emplacements?.chantier_info?.client && (
                            <p className="text-xs opacity-75">
                              Client: {inv.stock_emplacements.chantier_info.client}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{inv.quantite}</p>
                        <p className="text-xs opacity-75">unités</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>

            {/* Historique */}
            <Card variant="glass" padding="lg" className="bg-white border border-gray-300">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Historique des mouvements</h2>
              {mouvements.length === 0 ? (
                <p className="text-slate-500 text-center py-8">Aucun mouvement</p>
              ) : (
                <div className="space-y-3">
                  {mouvements.map((mouv, index) => (
                    <motion.div
                      key={mouv.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        mouv.type === 'entree' ? 'bg-green-100' :
                        mouv.type === 'sortie' ? 'bg-red-100' :
                        'bg-blue-100'
                      }`}>
                        {mouv.type === 'entree' ? (
                          <TrendingUp className="w-5 h-5 text-green-600" />
                        ) : mouv.type === 'sortie' ? (
                          <TrendingDown className="w-5 h-5 text-red-600" />
                        ) : (
                          <ArrowRightLeft className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-slate-800">
                            {mouv.type === 'entree' ? 'ENTRÉE' :
                             mouv.type === 'sortie' ? 'SORTIE' :
                             'TRANSFERT'} {mouv.type === 'entree' ? '+' : mouv.type === 'sortie' ? '-' : ''}{mouv.quantite} unités
                          </p>
                          <p className="text-sm text-slate-500">
                            {new Date(mouv.date_mouvement).toLocaleString('fr-FR')}
                          </p>
                        </div>
                        <p className="text-sm text-slate-600">
                          {mouv.profiles?.full_name}
                        </p>
                        {mouv.type === 'transfert' && mouv.emplacement_source && mouv.emplacement_destination ? (
                          <p className="text-xs text-slate-500 mt-1">
                            De: <span className="font-medium">{(mouv.emplacement_source as any).nom}</span> →
                            Vers: <span className="font-medium">{(mouv.emplacement_destination as any).nom}</span>
                          </p>
                        ) : mouv.type === 'entree' && mouv.emplacement_destination ? (
                          <p className="text-xs text-slate-500 mt-1">
                            Vers: <span className="font-medium">{(mouv.emplacement_destination as any).nom}</span>
                          </p>
                        ) : mouv.type === 'sortie' && mouv.emplacement_source ? (
                          <p className="text-xs text-slate-500 mt-1">
                            De: <span className="font-medium">{(mouv.emplacement_source as any).nom}</span>
                          </p>
                        ) : null}
                        {mouv.notes && (
                          <p className="text-sm text-slate-600 mt-1">💬 {mouv.notes}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* QR Code + Alerte */}
          <div className="space-y-6">
            <Card variant="glass" padding="lg" className="bg-white border border-gray-300">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">QR Code</h2>
              <div className="flex flex-col items-center">
                <canvas ref={qrCanvasRef} className="border-2 border-gray-300 rounded-lg" />
                <p className="text-sm text-slate-600 mt-3 text-center">{article.reference}</p>
                <p className="text-xs text-slate-400 text-center">{article.qr_code}</p>
                <Button
                  onClick={downloadQR}
                  variant="secondary"
                  className="mt-4 w-full"
                  icon={<Download className="w-4 h-4" />}
                >
                  Télécharger QR
                </Button>
              </div>
            </Card>

            {isAlerte && (
              <Card variant="glass" padding="lg" className="bg-red-50 border border-red-300">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-800 mb-1">Stock faible</h3>
                    <p className="text-sm text-red-700">
                      Le stock total est en dessous du seuil d'alerte ({article.seuil_alerte} unités).
                      Pensez à réapprovisionner.
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Modal Mouvement/Transfert */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card variant="glass" padding="lg" className="bg-white max-w-md w-full">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              {actionType === 'entree' ? 'Entrée de stock' :
               actionType === 'sortie' ? 'Sortie de stock' :
               'Transfert de stock'}
            </h2>

            <div className="space-y-4">
              {actionType === 'transfert' ? (
                <>
                  {/* Source */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Emplacement source *
                    </label>
                    <select
                      value={formData.emplacement_source_id}
                      onChange={(e) => setFormData({ ...formData, emplacement_source_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Sélectionner...</option>
                      {emplacements.map(emp => {
                        const invItem = inventaire.find(i => i.emplacement_id === emp.id)
                        if (!invItem || invItem.quantite === 0) return null
                        return (
                          <option key={emp.id} value={emp.id}>
                            {emp.nom} ({invItem.quantite} unités)
                          </option>
                        )
                      })}
                    </select>
                  </div>

                  {/* Destination */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Emplacement destination *
                    </label>
                    <select
                      value={formData.emplacement_destination_id}
                      onChange={(e) => setFormData({ ...formData, emplacement_destination_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Sélectionner...</option>
                      {emplacements.filter(e => e.id !== formData.emplacement_source_id).map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Emplacement *
                  </label>
                  <select
                    value={formData.emplacement_id}
                    onChange={(e) => setFormData({ ...formData, emplacement_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Sélectionner...</option>
                    {emplacements.map(emp => {
                      const invItem = inventaire.find(i => i.emplacement_id === emp.id)
                      return (
                        <option key={emp.id} value={emp.id}>
                          {emp.nom} {invItem ? `(${invItem.quantite} unités)` : '(vide)'}
                        </option>
                      )
                    })}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Quantité *
                </label>
                <Input
                  type="number"
                  min="1"
                  value={formData.quantite}
                  onChange={(e) => setFormData({ ...formData, quantite: parseInt(e.target.value) || 1 })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Notes (optionnel)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ex: Intervention site ABC, N° série: 12345..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  onClick={() => setShowModal(false)}
                  variant="secondary"
                  disabled={processing}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSubmit}
                  variant="primary"
                  disabled={processing}
                >
                  {processing ? 'Traitement...' : 'Valider'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
