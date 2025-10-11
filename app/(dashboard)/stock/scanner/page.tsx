'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Html5Qrcode } from 'html5-qrcode'
import { ArrowLeft, Camera, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import type { StockArticle } from '@/types/stock'

export default function ScannerQRPage() {
  const router = useRouter()
  const supabase = createClient()
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scannedArticle, setScannedArticle] = useState<StockArticle | null>(null)
  const [showMouvementForm, setShowMouvementForm] = useState(false)
  const [mouvementType, setMouvementType] = useState<'entree' | 'sortie'>('sortie')
  const [mouvementData, setMouvementData] = useState({ quantite: 1, notes: '' })
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
    return () => {
      stopScanner()
    }
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
  }

  async function startScanner() {
    try {
      setError(null)
      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        onScanSuccess,
        onScanError
      )

      setScanning(true)
    } catch (err: any) {
      console.error('Erreur démarrage scanner:', err)
      setError('Impossible d\'accéder à la caméra. Vérifiez les permissions.')
    }
  }

  async function stopScanner() {
    if (scannerRef.current && scanning) {
      try {
        await scannerRef.current.stop()
        scannerRef.current = null
        setScanning(false)
      } catch (err) {
        console.error('Erreur arrêt scanner:', err)
      }
    }
  }

  async function onScanSuccess(decodedText: string) {
    console.log('QR scanné:', decodedText)

    // Arrêter le scanner
    await stopScanner()

    // Rechercher l'article
    const { data: article, error } = await supabase
      .from('stock_articles')
      .select(`
        *,
        stock_categories (*)
      `)
      .eq('qr_code', decodedText)
      .single()

    if (error || !article) {
      setError('Article non trouvé. QR code inconnu.')
      return
    }

    setScannedArticle(article)
    setShowMouvementForm(true)
  }

  function onScanError(errorMessage: string) {
    // Ignorer les erreurs de scan continues (normal quand pas de QR visible)
  }

  async function handleMouvement() {
    if (!scannedArticle || mouvementData.quantite <= 0) return

    setProcessing(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const quantiteAvant = scannedArticle.quantite
      const quantiteApres = mouvementType === 'entree'
        ? quantiteAvant + mouvementData.quantite
        : quantiteAvant - mouvementData.quantite

      if (quantiteApres < 0) {
        alert('Stock insuffisant !')
        setProcessing(false)
        return
      }

      // Créer mouvement
      await supabase
        .from('stock_mouvements')
        .insert([{
          article_id: scannedArticle.id,
          type: mouvementType,
          quantite: mouvementData.quantite,
          quantite_avant: quantiteAvant,
          quantite_apres: quantiteApres,
          utilisateur_id: user.id,
          notes: mouvementData.notes || null,
          date_mouvement: new Date().toISOString()
        }])

      // Mettre à jour quantité article
      await supabase
        .from('stock_articles')
        .update({ quantite: quantiteApres })
        .eq('id', scannedArticle.id)

      alert('Mouvement enregistré !')

      // Réinitialiser
      setScannedArticle(null)
      setShowMouvementForm(false)
      setMouvementData({ quantite: 1, notes: '' })
      setError(null)
    } catch (error: any) {
      console.error('Erreur mouvement:', error)
      alert('Erreur : ' + error.message)
    } finally {
      setProcessing(false)
    }
  }

  function resetScanner() {
    setScannedArticle(null)
    setShowMouvementForm(false)
    setMouvementData({ quantite: 1, notes: '' })
    setError(null)
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
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 shadow-lg shadow-blue-500/20 flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-800">Scanner QR</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-2xl mx-auto">
          {!scanning && !scannedArticle && !error && (
            <Card variant="glass" padding="lg" className="bg-white border border-gray-300 text-center">
              <Camera className="w-16 h-16 mx-auto mb-4 text-slate-400" />
              <h2 className="text-xl font-semibold text-slate-800 mb-2">Scanner un QR code</h2>
              <p className="text-slate-600 mb-6">
                Scannez le QR code collé sur l'étagère pour effectuer une entrée ou sortie de stock
              </p>
              <Button
                onClick={startScanner}
                variant="primary"
                icon={<Camera className="w-5 h-5" />}
              >
                Démarrer le scanner
              </Button>
            </Card>
          )}

          {error && (
            <Card variant="glass" padding="lg" className="bg-red-50 border border-red-300">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-800 mb-1">Erreur</h3>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
              <div className="flex justify-center gap-3">
                <Button onClick={resetScanner} variant="secondary">
                  Annuler
                </Button>
                <Button onClick={startScanner} variant="primary">
                  Réessayer
                </Button>
              </div>
            </Card>
          )}

          {scanning && (
            <div>
              <Card variant="glass" padding="lg" className="bg-white border border-gray-300">
                <div id="qr-reader" className="w-full"></div>
                <p className="text-center text-slate-600 mt-4">
                  Positionnez le QR code devant la caméra
                </p>
                <div className="flex justify-center mt-4">
                  <Button onClick={stopScanner} variant="secondary">
                    Arrêter
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {scannedArticle && showMouvementForm && (
            <div className="space-y-6">
              <Card variant="glass" padding="lg" className="bg-white border border-gray-300">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Article scanné</h2>
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-slate-800">{scannedArticle.nom}</p>
                  <p className="text-sm text-slate-600">Réf: {scannedArticle.reference}</p>
                  {scannedArticle.emplacement && (
                    <p className="text-sm text-slate-600">📍 {scannedArticle.emplacement}</p>
                  )}
                  <p className="text-lg font-bold text-slate-800 mt-3">
                    Stock actuel: {scannedArticle.quantite} unités
                  </p>
                </div>
              </Card>

              <Card variant="glass" padding="lg" className="bg-white border border-gray-300">
                <h3 className="font-semibold text-slate-800 mb-4">Type de mouvement</h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <Button
                    onClick={() => setMouvementType('entree')}
                    variant={mouvementType === 'entree' ? 'primary' : 'secondary'}
                    icon={<TrendingUp className="w-5 h-5" />}
                    className="h-16"
                  >
                    ENTRÉE
                  </Button>
                  <Button
                    onClick={() => setMouvementType('sortie')}
                    variant={mouvementType === 'sortie' ? 'primary' : 'secondary'}
                    icon={<TrendingDown className="w-5 h-5" />}
                    className="h-16"
                  >
                    SORTIE
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Quantité *
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={mouvementData.quantite}
                      onChange={(e) => setMouvementData({ ...mouvementData, quantite: parseInt(e.target.value) || 1 })}
                      className="text-lg text-center"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={resetScanner}
                      variant="secondary"
                      className="flex-1"
                      disabled={processing}
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={handleMouvement}
                      variant="primary"
                      className="flex-1"
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
      </main>
    </div>
  )
}
