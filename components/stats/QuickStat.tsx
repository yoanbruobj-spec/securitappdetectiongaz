'use client'

import { motion } from 'framer-motion'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { MiniChart } from '../charts/MiniChart'

interface QuickStatProps {
  title: string
  value: string | number
  icon: LucideIcon
  color?: 'emerald' | 'cyan' | 'blue' | 'purple' | 'orange' | 'pink'
  trend?: {
    value: number
    isPositive: boolean
  }
  sparklineData?: number[]
  onClick?: () => void
  loading?: boolean
}

export function QuickStat({
  title,
  value,
  icon: Icon,
  color = 'emerald',
  trend,
  sparklineData,
  onClick,
  loading = false,
}: QuickStatProps) {
  const colorClasses = {
    emerald: {
      bg: 'from-emerald-500 to-emerald-600',
      ring: 'ring-emerald-500/20',
      text: 'text-emerald-600',
      hover: 'hover:ring-emerald-500/40',
    },
    cyan: {
      bg: 'from-cyan-500 to-cyan-600',
      ring: 'ring-cyan-500/20',
      text: 'text-cyan-600',
      hover: 'hover:ring-cyan-500/40',
    },
    blue: {
      bg: 'from-blue-500 to-blue-600',
      ring: 'ring-blue-500/20',
      text: 'text-blue-600',
      hover: 'hover:ring-blue-500/40',
    },
    purple: {
      bg: 'from-purple-500 to-purple-600',
      ring: 'ring-purple-500/20',
      text: 'text-purple-600',
      hover: 'hover:ring-purple-500/40',
    },
    orange: {
      bg: 'from-orange-500 to-orange-600',
      ring: 'ring-orange-500/20',
      text: 'text-orange-600',
      hover: 'hover:ring-orange-500/40',
    },
    pink: {
      bg: 'from-pink-500 to-pink-600',
      ring: 'ring-pink-500/20',
      text: 'text-pink-600',
      hover: 'hover:ring-pink-500/40',
    },
  }

  const colors = colorClasses[color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      className={`
        relative bg-white rounded-2xl p-6 shadow-lg ring-1 ${colors.ring}
        ${onClick ? `cursor-pointer transition-all duration-300 ${colors.hover}` : ''}
        overflow-hidden group
      `}
    >
      {/* Glow effect on hover */}
      {onClick && (
        <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
      )}

      {/* Header avec icon et trend */}
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors.bg} flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>

        {trend && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
              trend.isPositive
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {trend.isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span className="text-xs font-semibold">{Math.abs(trend.value)}%</span>
          </motion.div>
        )}
      </div>

      {/* Title */}
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>

      {/* Value */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="text-3xl font-bold text-gray-900 mb-3"
      >
        {value}
      </motion.div>

      {/* Sparkline */}
      {sparklineData && sparklineData.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 pt-4 border-t border-gray-200"
        >
          <MiniChart data={sparklineData} color={color} height={32} width={180} />
        </motion.div>
      )}

      {/* Hover arrow indicator */}
      {onClick && (
        <motion.div
          className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <svg
            className={`w-5 h-5 ${colors.text}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </motion.div>
      )}
    </motion.div>
  )
}
