'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Step {
  id: string
  label: string
  icon?: string
}

interface StepIndicatorProps {
  steps: Step[]
  currentStep: string
  onStepClick?: (stepId: string) => void
}

export function StepIndicator({ steps, currentStep, onStepClick }: StepIndicatorProps) {
  const currentIndex = steps.findIndex(s => s.id === currentStep)

  return (
    <div className="w-full bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-6">
        <div className="flex items-center justify-between gap-1 sm:gap-2 lg:gap-0">
          {steps.map((step, index) => {
            const isActive = step.id === currentStep
            const isCompleted = index < currentIndex
            const isClickable = onStepClick && (isCompleted || index <= currentIndex + 1)

            return (
              <div key={step.id} className="flex items-center flex-1">
                <button
                  onClick={() => isClickable && onStepClick(step.id)}
                  disabled={!isClickable}
                  className={cn(
                    'flex items-center gap-2 lg:gap-3 transition-all',
                    isClickable
                      ? 'cursor-pointer hover:scale-105 active:scale-95'
                      : 'cursor-not-allowed opacity-60'
                  )}
                >
                  {/* Circle indicator */}
                  <div
                    className={cn(
                      'relative flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 rounded-full font-semibold text-sm lg:text-base transition-all',
                      isActive
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        : isCompleted
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-white border-2 border-slate-200 text-slate-500'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5 lg:w-6 lg:h-6" strokeWidth={3} />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>

                  {/* Label - Hidden on mobile */}
                  <div className="text-left hidden lg:block">
                    <div
                      className={cn(
                        'font-semibold transition-all',
                        isActive
                          ? 'text-emerald-600 text-base lg:text-lg'
                          : isCompleted
                          ? 'text-emerald-600 text-sm lg:text-base'
                          : 'text-slate-500 text-sm'
                      )}
                    >
                      {step.label}
                    </div>
                  </div>
                </button>

                {/* Connecting line */}
                {index < steps.length - 1 && (
                  <div className="flex-1 mx-2 lg:mx-4 h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        index < currentIndex
                          ? 'w-full bg-emerald-500'
                          : 'w-0'
                      )}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Mobile: Display current step label below */}
        <div className="lg:hidden mt-4 text-center">
          <p className="text-sm font-semibold text-emerald-600">
            {steps[currentIndex]?.label}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Étape {currentIndex + 1} sur {steps.length}
          </p>
        </div>
      </div>
    </div>
  )
}
