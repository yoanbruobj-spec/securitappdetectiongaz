'use client'

import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
    icon?: LucideIcon
  }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {/* Icon */}
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>

      {/* Title & Description */}
      <div className="mb-6 max-w-md">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500">{description}</p>
      </div>

      {/* Action Button */}
      {action && (
        <button
          onClick={action.onClick}
          className="h-11 px-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          {action.icon && <action.icon className="w-5 h-5" />}
          {action.label}
        </button>
      )}
    </div>
  )
}
