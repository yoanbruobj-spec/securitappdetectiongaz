'use client'

import { motion } from 'framer-motion'
import { Cpu, Zap, Calendar, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

interface Centrale {
  id: string
  numero: number
  modele: string
  numero_serie?: string
  type_equipement?: 'centrale' | 'automate'
}

interface DetecteurGaz {
  id: string
  numero: number
  modele?: string
  gaz: string
  gamme_mesure?: string
  date_remplacement?: string
  date_prochain_remplacement?: string
  cellule_date_remplacement_theorique?: string
}

interface SyntheseEquipementsProps {
  centrales: Centrale[]
  detecteurs_gaz: DetecteurGaz[]
}

export function SyntheseEquipements({ centrales, detecteurs_gaz }: SyntheseEquipementsProps) {
  // Compter les centrales et automates
  const nbCentrales = centrales.filter(c => c.type_equipement !== 'automate').length
  const nbAutomates = centrales.filter(c => c.type_equipement === 'automate').length

  // Modèles uniques de centrales
  const modelesCentrales = Array.from(new Set(centrales.map(c => c.modele).filter(Boolean)))

  // Modèles uniques de détecteurs
  const modelesDetecteurs = Array.from(new Set(detecteurs_gaz.map(d => d.modele).filter(Boolean)))

  // Gaz détectés uniques
  const gazDetectes = Array.from(new Set(detecteurs_gaz.map(d => d.gaz).filter(Boolean)))

  // Gammes de mesure uniques
  const gammesMesure = Array.from(new Set(detecteurs_gaz.map(d => d.gamme_mesure).filter(Boolean)))

  // Détecteurs nécessitant un remplacement bientôt (< 2 mois)
  const detecteursAlerte = detecteurs_gaz.filter(d => {
    if (!d.cellule_date_remplacement_theorique && !d.date_prochain_remplacement) return false
    const dateRemplacement = new Date(d.cellule_date_remplacement_theorique || d.date_prochain_remplacement!)
    const dateAlerte = new Date()
    dateAlerte.setMonth(dateAlerte.getMonth() + 2)
    return dateRemplacement <= dateAlerte
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mt-8"
    >
      <div className="bg-gradient-to-br from-white/80 to-gray-50/80 backdrop-blur-sm rounded-2xl border-2 border-emerald-500/20 p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/50">
            <Cpu className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl font-black bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Synthèse des équipements
          </h2>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50">
            <p className="text-xs font-semibold text-gray-600 mb-1">Centrales</p>
            <p className="text-2xl font-black text-emerald-600">{nbCentrales}</p>
          </div>

          {nbAutomates > 0 && (
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50">
              <p className="text-xs font-semibold text-gray-600 mb-1">Automates</p>
              <p className="text-2xl font-black text-blue-600">{nbAutomates}</p>
            </div>
          )}

          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50">
            <p className="text-xs font-semibold text-gray-600 mb-1">Détecteurs</p>
            <p className="text-2xl font-black text-cyan-600">{detecteurs_gaz.length}</p>
          </div>

          {detecteursAlerte.length > 0 && (
            <div className="bg-red-50/60 backdrop-blur-sm rounded-xl p-4 border border-red-200/50">
              <p className="text-xs font-semibold text-red-600 mb-1">Alertes cellules</p>
              <p className="text-2xl font-black text-red-600">{detecteursAlerte.length}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Centrales/Automates */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              Centrales & Automates
            </h3>

            <div className="space-y-2">
              {centrales.map((centrale, index) => (
                <div key={centrale.id} className="bg-white/50 rounded-lg p-3 border border-gray-200/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-gray-900">
                      {centrale.type_equipement === 'automate' ? 'Automate' : 'Centrale'} {centrale.numero}
                    </span>
                    <Badge variant={centrale.type_equipement === 'automate' ? 'info' : 'default'} size="sm">
                      {centrale.modele}
                    </Badge>
                  </div>
                  {centrale.numero_serie && (
                    <p className="text-xs text-gray-600">N° série: {centrale.numero_serie}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {detecteurs_gaz.filter(d => d.id.startsWith(centrale.id)).length} détecteur(s)
                  </p>
                </div>
              ))}
            </div>

            {/* Modèles de centrales */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">Modèles installés</p>
              <div className="flex flex-wrap gap-2">
                {modelesCentrales.map(modele => (
                  <Badge key={modele} variant="default" size="sm">{modele}</Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Détecteurs et gaz */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Détecteurs de gaz
            </h3>

            {/* Modèles de détecteurs */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">Modèles de détecteurs</p>
              <div className="flex flex-wrap gap-2">
                {modelesDetecteurs.map(modele => (
                  <Badge key={modele} variant="info" size="sm">{modele}</Badge>
                ))}
              </div>
            </div>

            {/* Gaz ciblés */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">Gaz ciblés</p>
              <div className="flex flex-wrap gap-2">
                {gazDetectes.map(gaz => (
                  <Badge key={gaz} variant="success" size="sm">{gaz}</Badge>
                ))}
              </div>
            </div>

            {/* Gammes de mesure */}
            {gammesMesure.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">Gammes de mesure</p>
                <div className="flex flex-wrap gap-2">
                  {gammesMesure.map(gamme => (
                    <Badge key={gamme} variant="warning" size="sm">{gamme}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tableau des dates de remplacement */}
        {detecteurs_gaz.some(d => d.cellule_date_remplacement_theorique || d.date_prochain_remplacement) && (
          <div className="mt-6">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4" />
              Dates de remplacement des cellules
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 text-xs font-bold text-gray-600 uppercase">Détecteur</th>
                    <th className="text-left py-2 px-3 text-xs font-bold text-gray-600 uppercase">Gaz</th>
                    <th className="text-left py-2 px-3 text-xs font-bold text-gray-600 uppercase">Gamme</th>
                    <th className="text-left py-2 px-3 text-xs font-bold text-gray-600 uppercase">Date actuelle</th>
                    <th className="text-left py-2 px-3 text-xs font-bold text-gray-600 uppercase">Prochain remplacement</th>
                    <th className="text-left py-2 px-3 text-xs font-bold text-gray-600 uppercase">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {detecteurs_gaz
                    .filter(d => d.cellule_date_remplacement_theorique || d.date_prochain_remplacement)
                    .map((detecteur, index) => {
                      const dateRemplacement = new Date(detecteur.cellule_date_remplacement_theorique || detecteur.date_prochain_remplacement!)
                      const now = new Date()
                      const diffTime = dateRemplacement.getTime() - now.getTime()
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

                      let variant: 'danger' | 'warning' | 'success' = 'success'
                      let label = '✓ OK'
                      if (diffDays < 0) {
                        variant = 'danger'
                        label = '🔴 Dépassé'
                      } else if (diffDays <= 30) {
                        variant = 'danger'
                        label = '⚠️ < 1 mois'
                      } else if (diffDays <= 60) {
                        variant = 'warning'
                        label = '⏰ < 2 mois'
                      }

                      return (
                        <tr key={detecteur.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                          <td className="py-2 px-3">Dét. {detecteur.numero}</td>
                          <td className="py-2 px-3">
                            <Badge variant="info" size="sm">{detecteur.gaz}</Badge>
                          </td>
                          <td className="py-2 px-3 text-gray-600">{detecteur.gamme_mesure || '-'}</td>
                          <td className="py-2 px-3 text-gray-600">
                            {detecteur.date_remplacement
                              ? new Date(detecteur.date_remplacement).toLocaleDateString('fr-FR')
                              : '-'
                            }
                          </td>
                          <td className="py-2 px-3 font-medium">
                            {new Date(detecteur.cellule_date_remplacement_theorique || detecteur.date_prochain_remplacement!).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="py-2 px-3">
                            <Badge variant={variant} size="sm">{label}</Badge>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>

            {detecteursAlerte.length > 0 && (
              <div className="mt-4 bg-red-50/60 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-900 mb-1">
                      {detecteursAlerte.length} cellule(s) à commander
                    </p>
                    <p className="text-xs text-red-700">
                      Des cellules arrivent à échéance dans moins de 2 mois. Pensez à passer commande.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
