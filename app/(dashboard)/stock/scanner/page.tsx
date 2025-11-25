'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Html5Qrcode } from 'html5-qrcode'
import { ArrowLeft, Camera, TrendingUp, TrendingDown, AlertCircle, ArrowRightLeft, Package, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
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
      setScanning(true)
    } catch (err: any) {
      console.error('Erreur démarrage scanner:', err)
      setError('Impossible d\'accéder à la caméra. Vérifiez les permissions.')
    }
  }

  useEffect(() => {
    if (!scanning || scannerRef.current) return

    async function initScanner() {
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

        console.log('Scanner démarré avec succès')
      } catch (err: any) {
        console.error('Erreur démarrage scanner:', err)
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
    await stopScanner()

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
    // Ignorer les erreurs de scan continues
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

        if (nouvelleQteSource === 0) {
          await supabase.from('stock_inventaire').delete()
            .eq('article_id', scannedArticle.id)
            .eq('emplacement_id', mouvementData.emplacement_source_id)
        } else {
          await supabase.from('stock_inventaire').update({ quantite: nouvelleQteSource })
            .eq('article_id', scannedArticle.id)
            .eq('emplacement_id', mouvementData.emplacement_source_id)
        }

        await supabase.from('stock_inventaire').upsert({
          article_id: scannedArticle.id,
          emplacement_id: mouvementData.emplacement_destination_id,
          quantite: nouvelleQteDest
        }, { onConflict: 'article_id,emplacement_id' })

        alert('Transfert effectué avec succès !')
      } else {
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
      case 'principal': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'chantier': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'vehicule': return 'bg-blue-50 text-blue-700 border-blue-200'
      default: return 'bg-slate-50 text-slate-700 border-slate-200'
    }
  }

  function getEmplacementLabel(emp: StockEmplacement) {
    if (emp.type === 'vehicule' && emp.profiles) {
      return `${emp.nom} (${emp.profiles.full_name})`
    }
    return emp.nom
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-4 py-4 lg:px-8 flex items-center gap-3">
          <button
            onClick={() => router.push('/stock')}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Camera className="w-5 h-5 text-blue-500" />
            </div>
            <h1 className="text-lg lg:text-xl font-bold text-slate-900">Scanner QR</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 lg:px-8 py-4 lg:py-6">
        <div className="max-w-2xl mx-auto">
          {/* Initial state - no scan yet */}
          {!scanning && !scannedArticle && !error && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 lg:p-8 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-slate-400" />
              </div>
              <h2 className="text-lg lg:text-xl font-semibold text-slate-900 mb-2">Scanner un QR code</h2>
              <p className="text-slate-500 mb-6">
                Scannez le QR code collé sur l'étagère pour effectuer une entrée, sortie ou transfert de stock
              </p>
              <button
                onClick={startScanner}
                className="h-11 px-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium flex items-center gap-2 mx-auto transition-colors"
              >
                <Camera className="w-5 h-5" />
                Démarrer le scanner
              </button>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="bg-red-50 rounded-xl border border-red-200 p-6">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-800 mb-1">Erreur</h3>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
              <div className="flex justify-center gap-3">
                <button
                  onClick={resetScanner}
                  className="h-10 px-4 bg-white border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={startScanner}
                  className="h-10 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
                >
                  Réessayer
                </button>
              </div>
            </div>
          )}

          {/* Scanning state */}
          {scanning && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 lg:p-6">
              <div id="qr-reader" className="w-full rounded-lg overflow-hidden"></div>
              <p className="text-center text-slate-500 mt-4">
                Positionnez le QR code devant la caméra
              </p>
              <div className="flex justify-center mt-4">
                <button
                  onClick={stopScanner}
                  className="h-10 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-medium transition-colors"
                >
                  Arrêter
                </button>
              </div>
            </div>
          )}

          {/* Scanned article - movement form */}
          {scannedArticle && showMouvementForm && (
            <div className="space-y-4">
              {/* Article info */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 lg:p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Package className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-slate-900">{scannedArticle.nom}</h2>
                    <p className="text-sm text-slate-500">Réf: {scannedArticle.reference}</p>
                    {scannedArticle.emplacement && (
                      <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {scannedArticle.emplacement}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900">{scannedArticle.quantite}</p>
                    <p className="text-xs text-slate-400">unités</p>
                  </div>
                </div>
              </div>

              {/* Movement form */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 lg:p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Type de mouvement</h3>

                {/* Movement type buttons */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <button
                    onClick={() => setMouvementType('entree')}
                    className={cn(
                      'h-14 rounded-lg border-2 font-medium flex flex-col items-center justify-center gap-1 transition-all',
                      mouvementType === 'entree'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    )}
                  >
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-xs">ENTRÉE</span>
                  </button>
                  <button
                    onClick={() => setMouvementType('sortie')}
                    className={cn(
                      'h-14 rounded-lg border-2 font-medium flex flex-col items-center justify-center gap-1 transition-all',
                      mouvementType === 'sortie'
                        ? 'bg-red-50 border-red-500 text-red-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    )}
                  >
                    <TrendingDown className="w-5 h-5" />
                    <span className="text-xs">SORTIE</span>
                  </button>
                  <button
                    onClick={() => setMouvementType('transfert')}
                    className={cn(
                      'h-14 rounded-lg border-2 font-medium flex flex-col items-center justify-center gap-1 transition-all',
                      mouvementType === 'transfert'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    )}
                  >
                    <ArrowRightLeft className="w-5 h-5" />
                    <span className="text-xs">TRANSF.</span>
                  </button>
                </div>

                {/* Current distribution */}
                {inventaire.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-slate-700 mb-2">Répartition actuelle :</p>
                    <div className="space-y-1.5">
                      {inventaire.map(inv => (
                        <div key={inv.id} className={cn('px-3 py-2 rounded-lg border text-sm', getEmplacementColor(inv.stock_emplacements?.type || ''))}>
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{getEmplacementLabel(inv.stock_emplacements!)}</span>
                            <span className="font-bold">{inv.quantite} unités</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Location selectors for transfer */}
                {mouvementType === 'transfert' && (
                  <div className="space-y-3 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Depuis (source) *
                      </label>
                      <select
                        value={mouvementData.emplacement_source_id}
                        onChange={(e) => setMouvementData({ ...mouvementData, emplacement_source_id: e.target.value })}
                        className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
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
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Vers (destination) *
                      </label>
                      <select
                        value={mouvementData.emplacement_destination_id}
                        onChange={(e) => setMouvementData({ ...mouvementData, emplacement_destination_id: e.target.value })}
                        className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
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

                {/* Location selector for entry */}
                {mouvementType === 'entree' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Destination *
                    </label>
                    <select
                      value={mouvementData.emplacement_destination_id}
                      onChange={(e) => setMouvementData({ ...mouvementData, emplacement_destination_id: e.target.value })}
                      className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
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

                {/* Location selector for exit */}
                {mouvementType === 'sortie' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Source *
                    </label>
                    <select
                      value={mouvementData.emplacement_source_id}
                      onChange={(e) => setMouvementData({ ...mouvementData, emplacement_source_id: e.target.value })}
                      className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
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

                {/* Quantity input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Quantité *
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Ex: 2"
                    value={mouvementData.quantite}
                    onChange={(e) => setMouvementData({ ...mouvementData, quantite: e.target.value })}
                    className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 text-center text-lg font-semibold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Notes */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Notes (optionnel)
                  </label>
                  <textarea
                    value={mouvementData.notes}
                    onChange={(e) => setMouvementData({ ...mouvementData, notes: e.target.value })}
                    placeholder="Ex: Intervention site ABC, N° série: 12345..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    rows={3}
                  />
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={resetScanner}
                    disabled={processing}
                    className="flex-1 h-11 px-4 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-600 rounded-lg font-medium transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleMouvement}
                    disabled={processing}
                    className="flex-1 h-11 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                  >
                    {processing ? 'Traitement...' : 'Valider'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
