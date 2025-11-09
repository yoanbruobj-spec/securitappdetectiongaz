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
    <div className="w-full bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-8 py-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isActive = step.id === currentStep
            const isCompleted = index < currentIndex
            const isClickable = onStepClick && (isCompleted || index <= currentIndex + 1)

            return (
              <div key={step.id} className="flex items-center flex-1">
                <button
                  onClick={() => isClickable && onStepClick(step.id)}
                  disabled={!isClickable}
                  className={`flex items-center gap-3 transition-all ${
                    isClickable ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed'
                  }`}
                >
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg scale-110'
                        : isCompleted
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {isCompleted ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                  <div className="text-left">
                    <div
                      className={`font-medium transition-all ${
                        isActive ? 'text-blue-600 text-base' : 'text-gray-600 text-sm'
                      }`}
                    >
                      {step.label}
                    </div>
                  </div>
                </button>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-4 rounded transition-all ${
                      index < currentIndex ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
