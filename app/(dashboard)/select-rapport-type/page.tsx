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
    <div className="min-h-screen bg-[#0A0E1A] flex flex-col">
      <header className="bg-[#141B2D]/80 backdrop-blur-xl border-b border-[#2D3B52] sticky top-0 z-50">
        <div className="px-8 py-4 flex items-center gap-4">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            size="sm"
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Retour
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 shadow-lg shadow-blue-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-100">Nouveau Rapport</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="max-w-4xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-slate-100 mb-3">
              Quel type de rapport souhaitez-vous générer ?
            </h2>
            <p className="text-slate-400 text-lg">
              Sélectionnez le type de détecteurs à contrôler
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card
                variant="glass"
                padding="lg"
                hover
                className="cursor-pointer h-full"
                onClick={() => router.push(`/intervention${planningId ? `?planning_id=${planningId}` : ''}`)}
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 shadow-lg shadow-blue-500/30 flex items-center justify-center">
                    <Building2 className="w-10 h-10 text-white" />
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-slate-100 mb-2">
                      Détection Fixe
                    </h3>
                    <p className="text-slate-400">
                      Centrales de détection, détecteurs gaz et flamme fixes
                    </p>
                  </div>

                  <div className="pt-4">
                    <Button variant="primary" size="lg" className="w-full">
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
                className="cursor-pointer h-full"
                onClick={() => router.push(`/intervention-portable${planningId ? `?planning_id=${planningId}` : ''}`)}
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-500 shadow-lg shadow-purple-500/30 flex items-center justify-center">
                    <Radio className="w-10 h-10 text-white" />
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-slate-100 mb-2">
                      Détection Portable
                    </h3>
                    <p className="text-slate-400">
                      Détecteurs portables monogaz et multigaz
                    </p>
                  </div>

                  <div className="pt-4">
                    <Button variant="primary" size="lg" className="w-full">
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
    <Suspense fallback={<div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center"><div className="text-white">Chargement...</div></div>}>
      <SelectRapportTypeContent />
    </Suspense>
  )
}