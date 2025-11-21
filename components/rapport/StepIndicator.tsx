import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

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
    <div className="w-full bg-gradient-to-br from-white/80 via-white/60 to-white/80 backdrop-blur-2xl border-b border-gray-200/50 sticky top-0 z-40 shadow-2xl shadow-black/5">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-6">
        <div className="flex items-center justify-between gap-1 sm:gap-2 lg:gap-0">
          {steps.map((step, index) => {
            const isActive = step.id === currentStep
            const isCompleted = index < currentIndex
            const isClickable = onStepClick && (isCompleted || index <= currentIndex + 1)

            return (
              <div key={step.id} className="flex items-center flex-1">
                <motion.button
                  onClick={() => isClickable && onStepClick(step.id)}
                  disabled={!isClickable}
                  className={`flex items-center gap-2 lg:gap-3 transition-all ${
                    isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                  }`}
                  whileHover={isClickable ? { scale: 1.05 } : {}}
                  whileTap={isClickable ? { scale: 0.98 } : {}}
                >
                  {/* Circle indicator */}
                  <motion.div
                    className={`relative flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 rounded-full font-semibold text-sm lg:text-base transition-all ${
                      isActive
                        ? 'bg-gradient-to-br from-emerald-400 to-cyan-500 text-white shadow-2xl'
                        : isCompleted
                        ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg'
                        : 'bg-white/60 backdrop-blur-xl border border-gray-300 text-gray-500'
                    }`}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                  >
                    {/* Glow effect for active */}
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 blur-xl opacity-60"
                        animate={{
                          scale: [1, 1.3, 1],
                          opacity: [0.6, 0.8, 0.6],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    )}

                    {/* Content */}
                    <div className="relative z-10">
                      {isCompleted ? (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        >
                          <Check className="w-5 h-5 lg:w-6 lg:h-6" strokeWidth={3} />
                        </motion.div>
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>

                    {/* Ring animation for active */}
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-emerald-400"
                        initial={{ scale: 1, opacity: 1 }}
                        animate={{ scale: 1.4, opacity: 0 }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeOut"
                        }}
                      />
                    )}
                  </motion.div>

                  {/* Label - Hidden on mobile */}
                  <motion.div
                    className="text-left hidden lg:block"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.2, duration: 0.4 }}
                  >
                    <div
                      className={`font-semibold transition-all ${
                        isActive
                          ? 'text-emerald-600 text-base lg:text-lg'
                          : isCompleted
                          ? 'text-emerald-600 text-sm lg:text-base'
                          : 'text-gray-500 text-sm'
                      }`}
                    >
                      {step.label}
                    </div>
                  </motion.div>
                </motion.button>

                {/* Connecting line */}
                {index < steps.length - 1 && (
                  <div className="flex-1 mx-2 lg:mx-4 h-1 bg-gray-200/50 rounded-full overflow-hidden backdrop-blur-sm">
                    <motion.div
                      className={`h-full rounded-full ${
                        index < currentIndex
                          ? 'bg-gradient-to-r from-emerald-500 to-cyan-500'
                          : 'bg-transparent'
                      }`}
                      initial={{ width: '0%' }}
                      animate={{ width: index < currentIndex ? '100%' : '0%' }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Mobile: Display current step label below */}
        <motion.div
          className="lg:hidden mt-4 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-sm font-semibold text-emerald-600">
            {steps[currentIndex]?.label}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Étape {currentIndex + 1} sur {steps.length}
          </p>
        </motion.div>
      </div>
    </div>
  )
}
