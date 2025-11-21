'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Html5Qrcode } from 'html5-qrcode'
import { ArrowLeft, Camera, TrendingUp, TrendingDown, AlertCircle, ArrowRightLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import type { StockArticle, StockEmplacement, StockInventaire } from '@/types/stock'

export default function ScannerQRPage() {
  const router = useRouter()
  const supabase = createClient()
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scannedArticle, setScannedArticle] = useState<StockArticle | null>(null)
  const [inventaire, setInventaire] = useState<StockInventaire[]>([])
  const [emplacements, setEmplacements] = useState<StockEmplacement[]>([])
  const [showMouvementForm, setShowMouvementForm] = useState(false)
  const [mouvementType, setMouvementType] = useState<'entree' | 'sortie' | 'transfert'>('sortie')
  const [mouvementData, setMouvementData] = useState({
    quantite: '',
    notes: '',
    emplacement_source_id: '',
    emplacement_destination_id: ''
  })
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
      setScanning(true) // Mettre scanning à true AVANT pour rendre l'élément
    } catch (err: any) {
      console.error('Erreur démarrage scanner:', err)
      setError('Impossible d\'accéder à la caméra. Vérifiez les permissions.')
    }
  }

  // useEffect pour initialiser le scanner après le rendu de l'élément
  useEffect(() => {
    if (!scanning || scannerRef.current) return

    async function initScanner() {
      // Attendre que l'élément soit dans le DOM
      await new Promise(resolve => setTimeout(resolve, 100))

      const element = document.getElementById('qr-reader')
      if (!element) {
        console.error('Element qr-reader non trouvé')
        setError('Erreur d\'initialisation du scanner')
        setScanning(false)
        return
      }

      try {
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

        console.log('✅ Scanner démarré avec succès')
      } catch (err: any) {
        console.error('❌ Erreur démarrage scanner:', err)
        setError('Impossible d\'accéder à la caméra. Vérifiez les permissions.')
        setScanning(false)
        scannerRef.current = null
      }
    }

    initScanner()
  }, [scanning])

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

    // Charger l'inventaire par emplacement
    const { data: inv } = await supabase
      .from('stock_inventaire')
      .select(`
        *,
        stock_emplacements (
          *,
          profiles (id, full_name, email, role)
        )
      `)
      .eq('article_id', article.id)
      .order('quantite', { ascending: false })

    if (inv) setInventaire(inv)

    // Charger tous les emplacements actifs
    const { data: emps } = await supabase
      .from('stock_emplacements')
      .select('*, profiles (id, full_name, email, role)')
      .eq('actif', true)
      .order('type', { ascending: true })
      .order('nom', { ascending: true })

    if (emps) setEmplacements(emps)

    setScannedArticle(article)
    setShowMouvementForm(true)
  }

  function onScanError(errorMessage: string) {
    // Ignorer les erreurs de scan continues (normal quand pas de QR visible)
  }

  async function handleMouvement() {
    const quantite = parseInt(mouvementData.quantite as any) || 0
    if (!scannedArticle || quantite <= 0) {
      alert('Veuillez entrer une quantité valide (minimum 1)')
      return
    }

    setProcessing(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      if (mouvementType === 'transfert') {
        // Mode transfert
        if (!mouvementData.emplacement_source_id || !mouvementData.emplacement_destination_id) {
          alert('Veuillez sélectionner les emplacements source et destination')
          setProcessing(false)
          return
        }

        const invSource = inventaire.find(i => i.emplacement_id === mouvementData.emplacement_source_id)
        const invDest = inventaire.find(i => i.emplacement_id === mouvementData.emplacement_destination_id)

        const qteSource = invSource?.quantite || 0
        const qteDest = invDest?.quantite || 0

        if (qteSource < quantite) {
          alert('Stock insuffisant dans l\'emplacement source !')
          setProcessing(false)
          return
        }

        const nouvelleQteSource = qteSource - quantite
        const nouvelleQteDest = qteDest + quantite

        // Créer le mouvement de transfert
        await supabase.from('stock_mouvements').insert([{
          article_id: scannedArticle.id,
          type: 'transfert',
          quantite: quantite,
          quantite_avant: qteSource,
          quantite_apres: nouvelleQteSource,
          utilisateur_id: user.id,
          emplacement_source_id: mouvementData.emplacement_source_id,
          emplacement_destination_id: mouvementData.emplacement_destination_id,
          notes: mouvementData.notes || null,
          date_mouvement: new Date().toISOString()
        }])

        // Mettre à jour l'inventaire source
        if (nouvelleQteSource === 0) {
          await supabase.from('stock_inventaire').delete()
            .eq('article_id', scannedArticle.id)
            .eq('emplacement_id', mouvementData.emplacement_source_id)
        } else {
          await supabase.from('stock_inventaire').update({ quantite: nouvelleQteSource })
            .eq('article_id', scannedArticle.id)
            .eq('emplacement_id', mouvementData.emplacement_source_id)
        }

        // Mettre à jour l'inventaire destination
        await supabase.from('stock_inventaire').upsert({
          article_id: scannedArticle.id,
          emplacement_id: mouvementData.emplacement_destination_id,
          quantite: nouvelleQteDest
        }, { onConflict: 'article_id,emplacement_id' })

        alert('Transfert effectué avec succès !')
      } else {
        // Mode entrée/sortie classique
        if (!mouvementData.emplacement_destination_id && mouvementType === 'entree') {
          alert('Veuillez sélectionner un emplacement de destination')
          setProcessing(false)
          return
        }
        if (!mouvementData.emplacement_source_id && mouvementType === 'sortie') {
          alert('Veuillez sélectionner un emplacement source')
          setProcessing(false)
          return
        }

        const quantiteAvant = scannedArticle.quantite
        const quantiteApres = mouvementType === 'entree'
          ? quantiteAvant + quantite
          : quantiteAvant - quantite

        if (quantiteApres < 0) {
          alert('Stock insuffisant !')
          setProcessing(false)
          return
        }

        // Créer mouvement
        await supabase.from('stock_mouvements').insert([{
          article_id: scannedArticle.id,
          type: mouvementType,
          quantite: quantite,
          quantite_avant: quantiteAvant,
          quantite_apres: quantiteApres,
          utilisateur_id: user.id,
          emplacement_source_id: mouvementType === 'sortie' ? mouvementData.emplacement_source_id : null,
          emplacement_destination_id: mouvementType === 'entree' ? mouvementData.emplacement_destination_id : null,
          notes: mouvementData.notes || null,
          date_mouvement: new Date().toISOString()
        }])

        // Mettre à jour l'inventaire
        if (mouvementType === 'entree') {
          const empId = mouvementData.emplacement_destination_id
          const invCurrent = inventaire.find(i => i.emplacement_id === empId)
          const newQte = (invCurrent?.quantite || 0) + quantite

          await supabase.from('stock_inventaire').upsert({
            article_id: scannedArticle.id,
            emplacement_id: empId,
            quantite: newQte
          }, { onConflict: 'article_id,emplacement_id' })
        } else {
          const empId = mouvementData.emplacement_source_id
          const invCurrent = inventaire.find(i => i.emplacement_id === empId)
          const newQte = (invCurrent?.quantite || 0) - quantite

          if (newQte === 0) {
            await supabase.from('stock_inventaire').delete()
              .eq('article_id', scannedArticle.id)
              .eq('emplacement_id', empId)
          } else {
            await supabase.from('stock_inventaire').update({ quantite: newQte })
              .eq('article_id', scannedArticle.id)
              .eq('emplacement_id', empId)
          }
        }

        alert('Mouvement enregistré ! Nouvelle quantité totale : ' + quantiteApres)
      }

      // Réinitialiser après un court délai
      setTimeout(() => {
        setScannedArticle(null)
        setShowMouvementForm(false)
        setInventaire([])
        setEmplacements([])
        setMouvementData({ quantite: '', notes: '', emplacement_source_id: '', emplacement_destination_id: '' })
        setError(null)
      }, 1000)
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
    setInventaire([])
    setEmplacements([])
    setMouvementData({ quantite: '', notes: '', emplacement_source_id: '', emplacement_destination_id: '' })
    setError(null)
  }

  function getEmplacementColor(type: string) {
    switch (type) {
      case 'principal': return 'bg-green-100 text-green-700 border-green-300'
      case 'chantier': return 'bg-orange-100 text-orange-700 border-orange-300'
      case 'vehicule': return 'bg-blue-100 text-blue-700 border-blue-300'
      default: return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  function getEmplacementLabel(emp: StockEmplacement) {
    if (emp.type === 'vehicule' && emp.profiles) {
      return `${emp.nom} (${emp.profiles.full_name})`
    }
    return emp.nom
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-300 shadow-sm sticky top-0 z-50">
        <div className="px-4 lg:px-8 py-3 lg:py-4 flex items-center gap-3">
          <Button
            onClick={() => router.push('/stock')}
            variant="ghost"
            size="sm"
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            <span className="hidden sm:inline">Retour</span>
          </Button>
          <div className="flex items-center gap-2 lg:gap-3">
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 shadow-lg shadow-blue-500/20 flex items-center justify-center">
              <Camera className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
            </div>
            <h1 className="text-base lg:text-xl font-bold text-slate-800">Scanner QR</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 lg:px-8 py-4 lg:py-6">
        <div className="max-w-2xl mx-auto">
          {!scanning && !scannedArticle && !error && (
            <Card variant="glass" padding="lg" className="bg-white border border-gray-300 text-center">
              <Camera className="w-12 lg:w-16 h-12 lg:h-16 mx-auto mb-3 lg:mb-4 text-slate-400" />
              <h2 className="text-lg lg:text-xl font-semibold text-slate-800 mb-2">Scanner un QR code</h2>
              <p className="text-sm lg:text-base text-slate-600 mb-4 lg:mb-6 px-2">
                Scannez le QR code collé sur l'étagère pour effectuer une entrée, sortie ou transfert de stock
              </p>
              <Button
                onClick={startScanner}
                variant="primary"
                icon={<Camera className="w-4 lg:w-5 h-4 lg:h-5" />}
                className="text-sm lg:text-base"
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
            <div className="space-y-4 lg:space-y-6">
              <Card variant="glass" padding="lg" className="bg-white border border-gray-300">
                <h2 className="text-lg lg:text-xl font-bold text-slate-800 mb-3 lg:mb-4">Article scanné</h2>
                <div className="space-y-2">
                  <p className="text-base lg:text-lg font-semibold text-slate-800">{scannedArticle.nom}</p>
                  <p className="text-xs lg:text-sm text-slate-600">Réf: {scannedArticle.reference}</p>
                  {scannedArticle.emplacement && (
                    <p className="text-xs lg:text-sm text-slate-600">📍 {scannedArticle.emplacement}</p>
                  )}
                  <p className="text-base lg:text-lg font-bold text-slate-800 mt-2 lg:mt-3">
                    Stock actuel: {scannedArticle.quantite} unités
                  </p>
                </div>
              </Card>

              <Card variant="glass" padding="lg" className="bg-white border border-gray-300">
                <h3 className="text-base lg:text-lg font-semibold text-slate-800 mb-3 lg:mb-4">Type de mouvement</h3>
                <div className="grid grid-cols-3 gap-2 mb-3 lg:mb-4">
                  <Button
                    onClick={() => setMouvementType('entree')}
                    variant={mouvementType === 'entree' ? 'primary' : 'secondary'}
                    icon={<TrendingUp className="w-3 lg:w-4 h-3 lg:h-4" />}
                    className="h-12 lg:h-16 text-[10px] lg:text-xs px-1 lg:px-3"
                  >
                    ENTRÉE
                  </Button>
                  <Button
                    onClick={() => setMouvementType('sortie')}
                    variant={mouvementType === 'sortie' ? 'primary' : 'secondary'}
                    icon={<TrendingDown className="w-3 lg:w-4 h-3 lg:h-4" />}
                    className="h-12 lg:h-16 text-[10px] lg:text-xs px-1 lg:px-3"
                  >
                    SORTIE
                  </Button>
                  <Button
                    onClick={() => setMouvementType('transfert')}
                    variant={mouvementType === 'transfert' ? 'primary' : 'secondary'}
                    icon={<ArrowRightLeft className="w-3 lg:w-4 h-3 lg:h-4" />}
                    className="h-12 lg:h-16 text-[10px] lg:text-xs px-1 lg:px-3"
                  >
                    TRANSF.
                  </Button>
                </div>

                {/* Affichage de la répartition du stock */}
                {inventaire.length > 0 && (
                  <div className="mb-3 lg:mb-4">
                    <p className="text-xs lg:text-sm font-medium text-slate-700 mb-2">Répartition actuelle :</p>
                    <div className="space-y-1">
                      {inventaire.map(inv => (
                        <div key={inv.id} className={`px-3 py-2 rounded-lg border text-sm ${getEmplacementColor(inv.stock_emplacements?.type || '')}`}>
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{getEmplacementLabel(inv.stock_emplacements!)}</span>
                            <span className="font-bold">{inv.quantite} unités</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sélecteurs d'emplacements pour transfert */}
                {mouvementType === 'transfert' && (
                  <div className="space-y-3 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Depuis (source) *
                      </label>
                      <select
                        value={mouvementData.emplacement_source_id}
                        onChange={(e) => setMouvementData({ ...mouvementData, emplacement_source_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Sélectionner...</option>
                        {inventaire.map(inv => (
                          <option key={inv.emplacement_id} value={inv.emplacement_id}>
                            {getEmplacementLabel(inv.stock_emplacements!)} ({inv.quantite} disponibles)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Vers (destination) *
                      </label>
                      <select
                        value={mouvementData.emplacement_destination_id}
                        onChange={(e) => setMouvementData({ ...mouvementData, emplacement_destination_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Sélectionner...</option>
                        {emplacements
                          .filter(emp => emp.id !== mouvementData.emplacement_source_id)
                          .map(emp => (
                            <option key={emp.id} value={emp.id}>
                              {getEmplacementLabel(emp)}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Sélecteur d'emplacement pour entrée */}
                {mouvementType === 'entree' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Destination *
                    </label>
                    <select
                      value={mouvementData.emplacement_destination_id}
                      onChange={(e) => setMouvementData({ ...mouvementData, emplacement_destination_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Sélectionner un emplacement...</option>
                      {emplacements.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {getEmplacementLabel(emp)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Sélecteur d'emplacement pour sortie */}
                {mouvementType === 'sortie' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Source *
                    </label>
                    <select
                      value={mouvementData.emplacement_source_id}
                      onChange={(e) => setMouvementData({ ...mouvementData, emplacement_source_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Sélectionner un emplacement...</option>
                      {inventaire.map(inv => (
                        <option key={inv.emplacement_id} value={inv.emplacement_id}>
                          {getEmplacementLabel(inv.stock_emplacements!)} ({inv.quantite} disponibles)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-3 lg:space-y-4">
                  <div>
                    <label className="block text-xs lg:text-sm font-medium text-slate-700 mb-1">
                      Quantité *
                    </label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Ex: 2"
                      value={mouvementData.quantite}
                      onChange={(e) => setMouvementData({ ...mouvementData, quantite: e.target.value })}
                      className="text-base lg:text-lg text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-xs lg:text-sm font-medium text-slate-700 mb-1">
                      Notes (optionnel)
                    </label>
                    <textarea
                      value={mouvementData.notes}
                      onChange={(e) => setMouvementData({ ...mouvementData, notes: e.target.value })}
                      placeholder="Ex: Intervention site ABC, N° série: 12345..."
                      className="w-full px-3 py-2 text-sm lg:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2 lg:gap-3 pt-3 lg:pt-4">
                    <Button
                      onClick={resetScanner}
                      variant="secondary"
                      className="flex-1 text-sm lg:text-base"
                      disabled={processing}
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={handleMouvement}
                      variant="primary"
                      className="flex-1 text-sm lg:text-base"
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
