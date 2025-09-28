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
    bg: 'from-blue-600/20 to-blue-500/20',
    icon: 'text-blue-400',
    border: 'border-blue-500/30',
    glow: 'shadow-blue-500/20'
  },
  green: {
    bg: 'from-green-600/20 to-green-500/20',
    icon: 'text-green-400',
    border: 'border-green-500/30',
    glow: 'shadow-green-500/20'
  },
  orange: {
    bg: 'from-orange-600/20 to-orange-500/20',
    icon: 'text-orange-400',
    border: 'border-orange-500/30',
    glow: 'shadow-orange-500/20'
  },
  red: {
    bg: 'from-red-600/20 to-red-500/20',
    icon: 'text-red-400',
    border: 'border-red-500/30',
    glow: 'shadow-red-500/20'
  },
  purple: {
    bg: 'from-purple-600/20 to-purple-500/20',
    icon: 'text-purple-400',
    border: 'border-purple-500/30',
    glow: 'shadow-purple-500/20'
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
    <Card variant="glass" padding="md" hover className={`border ${colors.border}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-400 font-medium mb-1">{title}</p>
          <motion.p
            className="text-3xl font-bold text-slate-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {value}
          </motion.p>
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${
              trend.isPositive ? 'text-green-400' : 'text-red-400'
            }`}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-slate-500 text-xs">vs mois dernier</span>
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