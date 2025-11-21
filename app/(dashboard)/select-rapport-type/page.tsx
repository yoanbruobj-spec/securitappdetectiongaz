'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Building2, Radio, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

function SelectRapportTypeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planningId = searchParams.get('planning_id')

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-300 shadow-sm sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center gap-3 sm:gap-4">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            size="sm"
            icon={<ArrowLeft className="w-4 h-4" />}
            className="flex-shrink-0"
          >
            <span className="hidden sm:inline">Retour</span>
          </Button>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 shadow-lg shadow-blue-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-base sm:text-lg lg:text-xl font-bold text-slate-800">Nouveau Rapport</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="max-w-4xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6 sm:mb-8 lg:mb-12"
          >
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 mb-2 sm:mb-3 px-4">
              Quel type de rapport souhaitez-vous générer ?
            </h2>
            <p className="text-slate-600 text-sm sm:text-base lg:text-lg px-4">
              Sélectionnez le type de détecteurs à contrôler
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card
                variant="glass"
                padding="lg"
                hover
                className="cursor-pointer h-full bg-white border border-gray-300 rounded-lg sm:rounded-xl"
                onClick={() => router.push(`/intervention${planningId ? `?planning_id=${planningId}` : ''}`)}
              >
                <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 shadow-lg shadow-blue-500/30 flex items-center justify-center">
                    <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>

                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-1.5 sm:mb-2">
                      Détection Fixe
                    </h3>
                    <p className="text-sm sm:text-base text-slate-600 px-2">
                      Centrales de détection, détecteurs gaz et flamme fixes
                    </p>
                  </div>

                  <div className="pt-2 sm:pt-4 w-full">
                    <Button variant="primary" size="lg" className="w-full text-sm sm:text-base">
                      Générer un rapport fixe
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card
                variant="glass"
                padding="lg"
                hover
                className="cursor-pointer h-full bg-white border border-gray-300 rounded-lg sm:rounded-xl"
                onClick={() => router.push(`/intervention-portable${planningId ? `?planning_id=${planningId}` : ''}`)}
              >
                <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-600 to-purple-500 shadow-lg shadow-purple-500/30 flex items-center justify-center">
                    <Radio className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>

                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-1.5 sm:mb-2">
                      Détection Portable
                    </h3>
                    <p className="text-sm sm:text-base text-slate-600 px-2">
                      Détecteurs portables monogaz et multigaz
                    </p>
                  </div>

                  <div className="pt-2 sm:pt-4 w-full">
                    <Button variant="primary" size="lg" className="w-full text-sm sm:text-base">
                      Générer un rapport portable
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function SelectRapportType() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-slate-800">Chargement...</div></div>}>
      <SelectRapportTypeContent />
    </Suspense>
  )
}