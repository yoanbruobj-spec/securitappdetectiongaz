'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { ArrowLeft, QrCode, Edit, Download, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { Input } from '@/components/ui/Input'
import QRCodeLib from 'qrcode'
import type { StockArticle, StockMouvement } from '@/types/stock'

export default function ArticleDetailPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)

  const [article, setArticle] = useState<StockArticle | null>(null)
  const [mouvements, setMouvements] = useState<StockMouvement[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [showMouvementModal, setShowMouvementModal] = useState(false)
  const [mouvementType, setMouvementType] = useState<'entree' | 'sortie'>('sortie')
  const [mouvementData, setMouvementData] = useState({ quantite: 1, notes: '' })
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    checkAuth()
    loadData()
  }, [params.id])

  // Générer QR code après chargement de l'article
  useEffect(() => {
    async function generateQR() {
      if (!article || !qrCanvasRef.current) {
        console.log('QR: Conditions non remplies', { article: !!article, canvas: !!qrCanvasRef.current })
        return
      }

      try {
        // Utiliser le qr_code existant ou générer un code à partir de l'ID
        const qrData = article.qr_code || `SECURIT-ART-${article.id}`
        console.log('Génération QR code pour:', qrData)

        await QRCodeLib.toCanvas(qrCanvasRef.current, qrData, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })

        console.log('✅ QR code généré avec succès')

        // Si l'article n'avait pas de QR code, le sauvegarder
        if (!article.qr_code) {
          console.log('Sauvegarde du QR code en base...')
          const { error } = await supabase
            .from('stock_articles')
            .update({ qr_code: qrData })
            .eq('id', article.id)

          if (error) {
            console.error('❌ Erreur sauvegarde QR:', error)
          } else {
            console.log('✅ QR code sauvegardé en base:', qrData)
          }
        }
      } catch (err) {
        console.error('❌ Erreur génération QR:', err)
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
    }

    // Charger mouvements
    const { data: mouvs, error: mouvsError } = await supabase
      .from('stock_mouvements')
      .select(`
        *,
        profiles (id, full_name, email, role)
      `)
      .eq('article_id', params.id)
      .order('date_mouvement', { ascending: false })

    if (mouvsError) {
      console.error('Erreur chargement mouvements:', mouvsError)
    } else {
      console.log('Mouvements chargés:', mouvs?.length || 0, 'mouvement(s)')
      if (mouvs) setMouvements(mouvs)
    }

    setLoading(false)
  }

  async function handleMouvement() {
    if (!article || mouvementData.quantite <= 0) return

    setProcessing(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const quantiteAvant = article.quantite
      const quantiteApres = mouvementType === 'entree'
        ? quantiteAvant + mouvementData.quantite
        : quantiteAvant - mouvementData.quantite

      if (quantiteApres < 0) {
        alert('Stock insuffisant !')
        setProcessing(false)
        return
      }

      // Créer mouvement
      const { data: mouvData, error: mouvError } = await supabase
        .from('stock_mouvements')
        .insert([{
          article_id: article.id,
          type: mouvementType,
          quantite: mouvementData.quantite,
          quantite_avant: quantiteAvant,
          quantite_apres: quantiteApres,
          utilisateur_id: user.id,
          notes: mouvementData.notes || null,
          date_mouvement: new Date().toISOString()
        }])
        .select()

      if (mouvError) {
        console.error('Erreur insertion mouvement:', mouvError)
        throw new Error('Erreur lors de l\'enregistrement du mouvement: ' + mouvError.message)
      }

      console.log('Mouvement créé:', mouvData)

      // Mettre à jour quantité article
      const { error: updateError } = await supabase
        .from('stock_articles')
        .update({ quantite: quantiteApres })
        .eq('id', article.id)

      if (updateError) {
        console.error('Erreur mise à jour article:', updateError)
        throw new Error('Erreur lors de la mise à jour du stock: ' + updateError.message)
      }

      console.log('Stock mis à jour:', quantiteAvant, '→', quantiteApres)

      alert('Mouvement enregistré !')
      setShowMouvementModal(false)
      setMouvementData({ quantite: 1, notes: '' })

      // Recharger les données
      await loadData()
    } catch (error: any) {
      console.error('Erreur mouvement:', error)
      alert('Erreur : ' + error.message)
    } finally {
      setProcessing(false)
    }
  }

  function downloadQR() {
    if (!qrCanvasRef.current || !article) return
    const url = qrCanvasRef.current.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `QR_${article.reference}.png`
    link.href = url
    link.click()
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

  const isAlerte = article.quantite <= article.seuil_alerte

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
              onClick={() => {
                setShowMouvementModal(true)
                setMouvementType('sortie')
              }}
              variant="secondary"
              icon={<TrendingDown className="w-5 h-5" />}
            >
              Sortie
            </Button>
            <Button
              onClick={() => {
                setShowMouvementModal(true)
                setMouvementType('entree')
              }}
              variant="primary"
              icon={<TrendingUp className="w-5 h-5" />}
            >
              Entrée
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
                    <p className="text-sm text-slate-500">Emplacement</p>
                    <p className="font-medium text-slate-800">📍 {article.emplacement}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-slate-500">Stock actuel</p>
                  <p className="text-2xl font-bold text-slate-800">{article.quantite} unités</p>
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
                        mouv.type === 'entree' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {mouv.type === 'entree' ? (
                          <TrendingUp className="w-5 h-5 text-green-600" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-slate-800">
                            {mouv.type === 'entree' ? 'ENTRÉE' : 'SORTIE'} {mouv.type === 'entree' ? '+' : '-'}{mouv.quantite} unités
                          </p>
                          <p className="text-sm text-slate-500">
                            {new Date(mouv.date_mouvement).toLocaleString('fr-FR')}
                          </p>
                        </div>
                        <p className="text-sm text-slate-600">
                          {mouv.profiles?.full_name}
                        </p>
                        <p className="text-xs text-slate-500">
                          Stock: {mouv.quantite_avant} → {mouv.quantite_apres}
                        </p>
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

          {/* QR Code */}
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
                      Le stock est en dessous du seuil d'alerte ({article.seuil_alerte} unités).
                      Pensez à réapprovisionner.
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Modal mouvement */}
      {showMouvementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card variant="glass" padding="lg" className="bg-white max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              {mouvementType === 'entree' ? 'Entrée' : 'Sortie'} de stock
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-600 mb-2">Stock actuel: <span className="font-bold">{article.quantite}</span> unités</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Quantité *
                </label>
                <Input
                  type="number"
                  min="1"
                  value={mouvementData.quantite}
                  onChange={(e) => setMouvementData({ ...mouvementData, quantite: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Notes (optionnel)
                </label>
                <textarea
                  value={mouvementData.notes}
                  onChange={(e) => setMouvementData({ ...mouvementData, notes: e.target.value })}
                  placeholder="Ex: Intervention site ABC, N° série: 12345..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  onClick={() => setShowMouvementModal(false)}
                  variant="secondary"
                  disabled={processing}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleMouvement}
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
