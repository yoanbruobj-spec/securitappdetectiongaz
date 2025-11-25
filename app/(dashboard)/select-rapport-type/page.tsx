'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Building2, Radio, ArrowLeft } from 'lucide-react'
import { Suspense } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'

export const dynamic = 'force-dynamic'

function SelectRapportTypeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planningId = searchParams.get('planning_id')

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <Sidebar />

      <main className="flex-1 pb-24 lg:pb-0">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="px-4 py-4 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-slate-900">Nouveau Rapport</h1>
                <p className="text-sm text-slate-500 hidden lg:block">Sélectionnez le type de détecteurs</p>
              </div>
            </div>
          </div>
        </header>

        <div className="px-4 py-6 lg:px-8 lg:py-12">
          <div className="max-w-3xl mx-auto">
            {/* Title */}
            <div className="text-center mb-8">
              <h2 className="text-xl lg:text-2xl font-bold text-slate-900 mb-2">
                Quel type de rapport souhaitez-vous générer ?
              </h2>
              <p className="text-slate-500">
                Sélectionnez le type de détecteurs à contrôler
              </p>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
              {/* Détection Fixe */}
              <button
                onClick={() => router.push(`/intervention${planningId ? `?planning_id=${planningId}` : ''}`)}
                className="bg-white border border-slate-200 rounded-xl p-6 text-left hover:border-emerald-300 hover:shadow-lg transition-all group"
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Building2 className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                      Détection Fixe
                    </h3>
                    <p className="text-sm text-slate-500">
                      Centrales de détection, détecteurs gaz et flamme fixes
                    </p>
                  </div>

                  <div className="w-full pt-2">
                    <span className="block w-full h-11 bg-emerald-500 group-hover:bg-emerald-600 text-white rounded-lg font-medium flex items-center justify-center transition-colors">
                      Générer un rapport fixe
                    </span>
                  </div>
                </div>
              </button>

              {/* Détection Portable */}
              <button
                onClick={() => router.push(`/intervention-portable${planningId ? `?planning_id=${planningId}` : ''}`)}
                className="bg-white border border-slate-200 rounded-xl p-6 text-left hover:border-purple-300 hover:shadow-lg transition-all group"
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-purple-500 shadow-lg shadow-purple-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Radio className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                      Détection Portable
                    </h3>
                    <p className="text-sm text-slate-500">
                      Détecteurs portables monogaz et multigaz
                    </p>
                  </div>

                  <div className="w-full pt-2">
                    <span className="block w-full h-11 bg-purple-500 group-hover:bg-purple-600 text-white rounded-lg font-medium flex items-center justify-center transition-colors">
                      Générer un rapport portable
                    </span>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}

export default function SelectRapportType() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SelectRapportTypeContent />
    </Suspense>
  )
}
