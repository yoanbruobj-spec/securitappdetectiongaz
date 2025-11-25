import { ReactNode } from 'react'

interface FormSectionProps {
  title: string
  description?: string
  icon?: ReactNode
  children: ReactNode
  className?: string
}

export function FormSection({ title, description, icon, children, className = '' }: FormSectionProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6 ${className}`}>
      <div className="flex items-start gap-3 mb-4 lg:mb-6">
        {icon && (
          <div className="flex-shrink-0 w-8 h-8 lg:w-10 lg:h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-base lg:text-lg font-semibold text-slate-800">{title}</h3>
          {description && <p className="text-xs lg:text-sm text-slate-600 mt-0.5 lg:mt-1">{description}</p>}
        </div>
      </div>
      <div className="space-y-3 lg:space-y-4">
        {children}
      </div>
    </div>
  )
}
