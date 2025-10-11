import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { Card } from './Card'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple'
}

const colorClasses = {
  blue: {
    bg: 'from-blue-100 to-blue-200',
    icon: 'text-blue-600',
    border: 'border-blue-300',
    glow: 'shadow-blue-200'
  },
  green: {
    bg: 'from-green-100 to-green-200',
    icon: 'text-green-600',
    border: 'border-green-300',
    glow: 'shadow-green-200'
  },
  orange: {
    bg: 'from-orange-100 to-orange-200',
    icon: 'text-orange-600',
    border: 'border-orange-300',
    glow: 'shadow-orange-200'
  },
  red: {
    bg: 'from-red-100 to-red-200',
    icon: 'text-red-600',
    border: 'border-red-300',
    glow: 'shadow-red-200'
  },
  purple: {
    bg: 'from-purple-100 to-purple-200',
    icon: 'text-purple-600',
    border: 'border-purple-300',
    glow: 'shadow-purple-200'
  }
}

export const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  color = 'blue'
}: StatCardProps) => {
  const colors = colorClasses[color]

  return (
    <Card variant="glass" padding="md" hover className={`bg-white border-2 ${colors.border} group relative overflow-hidden`}>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </div>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-600 font-medium mb-1">{title}</p>
          <motion.p
            className="text-3xl font-bold text-slate-800"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {value}
          </motion.p>
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-slate-600 text-xs">vs mois dernier</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colors.bg} ${colors.glow} shadow-lg`}>
          <Icon className={`w-6 h-6 ${colors.icon}`} />
        </div>
      </div>
    </Card>
  )
}