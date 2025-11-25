'use client'

import { Package, Zap, Calendar, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

interface Portable {
  id: string
  marque: string
  modele: string
  numero_serie: string
}

interface PortableGaz {
  id: string
  gaz: string
  gamme_mesure?: string
  date_remplacement?: string
  date_prochain_remplacement?: string
}

interface SynthesePortablesProps {
  portables: Portable[]
  portables_gaz: PortableGaz[]
}

export function SynthesePortables({ portables, portables_gaz }: SynthesePortablesProps) {
  // Nombre total de détecteurs
  const nbDetecteurs = portables.length

  // Modèles uniques
  const modelesUniques = Array.from(new Set(portables.map(p => `${p.marque} ${p.modele}`)))

  // Gaz détectés uniques (à travers tous les portables)
  const gazDetectes = Array.from(new Set(portables_gaz.map(pg => pg.gaz).filter(Boolean)))

  // Gammes de mesure uniques
  const gammesMesure = Array.from(new Set(portables_gaz.map(pg => pg.gamme_mesure).filter(Boolean)))

  // Cellules nécessitant un remplacement bientôt (< 2 mois)
  const cellulesAlerte = portables_gaz.filter(pg => {
    if (!pg.date_prochain_remplacement) return false
    const dateRemplacement = new Date(pg.date_prochain_remplacement)
    const dateAlerte = new Date()
    dateAlerte.setMonth(dateAlerte.getMonth() + 2)
    return dateRemplacement <= dateAlerte
  })

  return (
    <div className="mt-8">
      <div className="bg-gradient-to-br from-white/80 to-gray-50/80 backdrop-blur-sm rounded-2xl border-2 border-purple-500/20 p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/50">
            <Package className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
            Synthèse des détecteurs portables
          </h2>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50">
            <p className="text-xs font-semibold text-gray-600 mb-1">Détecteurs</p>
            <p className="text-2xl font-black text-purple-600">{nbDetecteurs}</p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50">
            <p className="text-xs font-semibold text-gray-600 mb-1">Gaz détectés</p>
            <p className="text-2xl font-black text-pink-600">{gazDetectes.length}</p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50">
            <p className="text-xs font-semibold text-gray-600 mb-1">Modèles</p>
            <p className="text-2xl font-black text-indigo-600">{modelesUniques.length}</p>
          </div>

          {cellulesAlerte.length > 0 && (
            <div className="bg-red-50/60 backdrop-blur-sm rounded-xl p-4 border border-red-200/50">
              <p className="text-xs font-semibold text-red-600 mb-1">Alertes cellules</p>
              <p className="text-2xl font-black text-red-600">{cellulesAlerte.length}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Liste des détecteurs */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
              <Package className="w-4 h-4" />
              Détecteurs
            </h3>

            <div className="space-y-2">
              {portables.map((portable, index) => (
                <div key={portable.id} className="bg-white/50 rounded-lg p-3 border border-gray-200/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-gray-900">
                      {portable.marque} {portable.modele}
                    </span>
                    <Badge variant="info" size="sm">N°{index + 1}</Badge>
                  </div>
                  <p className="text-xs text-gray-600">N° série: {portable.numero_serie}</p>
                  {/* Compter le nombre de gaz pour ce portable */}
                  <p className="text-xs text-gray-500 mt-1">
                    {portables_gaz.filter(pg => pg.id.includes(portable.id)).length || gazDetectes.length} gaz détecté(s)
                  </p>
                </div>
              ))}
            </div>

            {/* Modèles */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">Modèles</p>
              <div className="flex flex-wrap gap-2">
                {modelesUniques.map(modele => (
                  <Badge key={modele} variant="default" size="sm">{modele}</Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Gaz et gammes */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Gaz et gammes
            </h3>

            {/* Gaz détectés */}
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

            {/* Nombre de gaz par détecteur */}
            <div className="bg-white/50 rounded-lg p-4 border border-gray-200/50">
              <p className="text-xs font-semibold text-gray-600 mb-2">Configuration moyenne</p>
              <p className="text-sm text-gray-700">
                {portables.length > 0 ? Math.ceil(gazDetectes.length / portables.length) : 0} gaz par détecteur
              </p>
            </div>
          </div>
        </div>

        {/* Tableau des dates de remplacement */}
        {portables_gaz.some(pg => pg.date_prochain_remplacement) && (
          <div className="mt-6">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4" />
              Dates de remplacement des cellules
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 text-xs font-bold text-gray-600 uppercase">Gaz</th>
                    <th className="text-left py-2 px-3 text-xs font-bold text-gray-600 uppercase">Gamme</th>
                    <th className="text-left py-2 px-3 text-xs font-bold text-gray-600 uppercase">Date actuelle</th>
                    <th className="text-left py-2 px-3 text-xs font-bold text-gray-600 uppercase">Prochain remplacement</th>
                    <th className="text-left py-2 px-3 text-xs font-bold text-gray-600 uppercase">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {portables_gaz
                    .filter(pg => pg.date_prochain_remplacement)
                    .map((portableGaz, index) => {
                      const dateRemplacement = new Date(portableGaz.date_prochain_remplacement!)
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
                        <tr key={portableGaz.id || index} className="border-b border-gray-100 hover:bg-gray-50/50">
                          <td className="py-2 px-3">
                            <Badge variant="info" size="sm">{portableGaz.gaz}</Badge>
                          </td>
                          <td className="py-2 px-3 text-gray-600">{portableGaz.gamme_mesure || '-'}</td>
                          <td className="py-2 px-3 text-gray-600">
                            {portableGaz.date_remplacement
                              ? new Date(portableGaz.date_remplacement).toLocaleDateString('fr-FR')
                              : '-'
                            }
                          </td>
                          <td className="py-2 px-3 font-medium">
                            {new Date(portableGaz.date_prochain_remplacement!).toLocaleDateString('fr-FR')}
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

            {cellulesAlerte.length > 0 && (
              <div className="mt-4 bg-red-50/60 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-900 mb-1">
                      {cellulesAlerte.length} cellule(s) à commander
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
    </div>
  )
}
