'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, FileText, Download, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { TextArea } from '@/components/ui/TextArea'
import { Select } from '@/components/ui/Select'

interface EditAnomalieModalProps {
  isOpen: boolean
  onClose: () => void
  anomalie: any
  onSuccess: () => void
}

interface PieceJointe {
  name: string
  url: string
  type: string
  uploadedAt: string
}

export function EditAnomalieModal({ isOpen, onClose, anomalie, onSuccess }: EditAnomalieModalProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  // États du formulaire
  const [description, setDescription] = useState('')
  const [priorite, setPriorite] = useState<'basse' | 'moyenne' | 'haute' | 'critique'>('moyenne')
  const [montantDevis, setMontantDevis] = useState('')
  const [referenceDevis, setReferenceDevis] = useState('')
  const [notes, setNotes] = useState('')
  const [piecesJointes, setPiecesJointes] = useState<PieceJointe[]>([])

  useEffect(() => {
    if (anomalie) {
      setDescription(anomalie.description_anomalie || '')
      setPriorite(anomalie.priorite || 'moyenne')
      setMontantDevis(anomalie.montant_devis?.toString() || '')
      setReferenceDevis(anomalie.reference_devis || '')
      setNotes(anomalie.notes || '')
      setPiecesJointes(anomalie.pieces_jointes || [])
    }
  }, [anomalie])

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    const fileExt = file.name.split('.').pop()?.toLowerCase()

    // Vérifier le type de fichier
    if (!['pdf', 'xlsx', 'xls'].includes(fileExt || '')) {
      alert('Seuls les fichiers PDF et Excel (.xlsx, .xls) sont acceptés')
      return
    }

    setUploading(true)

    try {
      // Créer un nom de fichier unique
      const fileName = `${anomalie.id}_${Date.now()}.${fileExt}`
      const filePath = `anomalies/${fileName}`

      // Upload vers Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath)

      // Ajouter à la liste des pièces jointes
      const newPiece: PieceJointe = {
        name: file.name,
        url: publicUrl,
        type: fileExt,
        uploadedAt: new Date().toISOString()
      }

      setPiecesJointes([...piecesJointes, newPiece])
    } catch (error: any) {
      console.error('Erreur upload:', error)
      alert(`Erreur lors de l'upload: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  async function handleDeleteFile(index: number) {
    if (!confirm('Voulez-vous vraiment supprimer ce fichier ?')) return

    const piece = piecesJointes[index]

    try {
      // Extraire le chemin du fichier depuis l'URL
      const urlParts = piece.url.split('/documents/')
      if (urlParts.length > 1) {
        const filePath = urlParts[1]

        // Supprimer du storage
        await supabase.storage
          .from('documents')
          .remove([filePath])
      }

      // Retirer de la liste
      setPiecesJointes(piecesJointes.filter((_, i) => i !== index))
    } catch (error) {
      console.error('Erreur suppression:', error)
      alert('Erreur lors de la suppression du fichier')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!description.trim()) {
      alert('La description est obligatoire')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase
        .from('suivi_anomalies')
        .update({
          description_anomalie: description,
          priorite,
          montant_devis: montantDevis ? parseFloat(montantDevis) : null,
          reference_devis: referenceDevis || null,
          notes: notes || null,
          pieces_jointes: piecesJointes
        })
        .eq('id', anomalie.id)

      if (error) throw error

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Erreur mise à jour:', error)
      alert(`Erreur lors de la mise à jour: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  function getFileIcon(type: string) {
    if (type === 'pdf') return '📄'
    if (['xlsx', 'xls'].includes(type)) return '📊'
    return '📎'
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Modifier l'anomalie</h2>
                  <p className="text-sm text-slate-600 mt-1">
                    Client: {anomalie?.clients?.nom} - Site: {anomalie?.sites?.nom}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700">
                    Description de l'anomalie *
                  </label>
                  <TextArea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    required
                    placeholder="Décrivez l'anomalie en détail..."
                  />
                </div>

                {/* Priorité */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700">
                    Priorité
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { value: 'basse', label: 'Basse', color: 'from-blue-400 to-blue-500' },
                      { value: 'moyenne', label: 'Moyenne', color: 'from-yellow-400 to-orange-500' },
                      { value: 'haute', label: 'Haute', color: 'from-orange-400 to-red-500' },
                      { value: 'critique', label: 'Critique', color: 'from-red-500 to-red-700' }
                    ].map(({ value, label, color }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setPriorite(value as any)}
                        className={`px-4 py-3 rounded-lg font-semibold transition ${
                          priorite === value
                            ? `bg-gradient-to-r ${color} text-white shadow-lg`
                            : 'bg-gray-100 text-slate-700 hover:bg-gray-200'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Informations financières */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-700">
                      Montant du devis (€)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={montantDevis}
                      onChange={(e) => setMontantDevis(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-700">
                      Référence devis
                    </label>
                    <Input
                      type="text"
                      value={referenceDevis}
                      onChange={(e) => setReferenceDevis(e.target.value)}
                      placeholder="DEV-2024-001"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700">
                    Notes additionnelles
                  </label>
                  <TextArea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Notes supplémentaires..."
                  />
                </div>

                {/* Upload de fichiers */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700">
                    Documents (PDF, Excel)
                  </label>

                  {/* Bouton d'upload */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-emerald-500 transition">
                    <input
                      type="file"
                      id="file-upload"
                      accept=".pdf,.xlsx,.xls"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                    <label
                      htmlFor="file-upload"
                      className={`cursor-pointer flex flex-col items-center ${uploading ? 'opacity-50' : ''}`}
                    >
                      {uploading ? (
                        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
                      ) : (
                        <Upload className="w-8 h-8 text-emerald-600 mb-2" />
                      )}
                      <span className="text-sm font-medium text-slate-700">
                        {uploading ? 'Upload en cours...' : 'Cliquez pour ajouter un fichier'}
                      </span>
                      <span className="text-xs text-slate-500 mt-1">
                        PDF, Excel (.xlsx, .xls)
                      </span>
                    </label>
                  </div>

                  {/* Liste des fichiers */}
                  {piecesJointes.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {piecesJointes.map((piece, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="text-2xl">{getFileIcon(piece.type)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 truncate">
                                {piece.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {new Date(piece.uploadedAt).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <a
                              href={piece.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 hover:bg-gray-200 rounded-lg transition"
                            >
                              <Download className="w-4 h-4 text-slate-600" />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleDeleteFile(index)}
                              className="p-2 hover:bg-red-100 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={onClose}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
