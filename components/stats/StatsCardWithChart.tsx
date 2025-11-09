'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface StatsCardWithChartProps {
  title: string
  value: number | string
  icon: LucideIcon
  color: 'emerald' | 'cyan' | 'blue' | 'purple' | 'orange' | 'pink'
  trend?: {
    value: number
    isPositive: boolean
  }
  sparklineData?: number[]
  onClick?: () => void
}

export function StatsCardWithChart({
  title,
  value,
  icon: Icon,
  color,
  trend,
  sparklineData,
  onClick
}: StatsCardWithChartProps) {
  const colorClasses = {
    emerald: {
      bg: 'from-emerald-500 to-emerald-600',
      light: 'bg-emerald-50',
      text: 'text-emerald-600',
      ring: 'ring-emerald-500/20'
    },
    cyan: {
      bg: 'from-cyan-500 to-cyan-600',
      light: 'bg-cyan-50',
      text: 'text-cyan-600',
      ring: 'ring-cyan-500/20'
    },
    blue: {
      bg: 'from-blue-500 to-blue-600',
      light: 'bg-blue-50',
      text: 'text-blue-600',
      ring: 'ring-blue-500/20'
    },
    purple: {
      bg: 'from-purple-500 to-purple-600',
      light: 'bg-purple-50',
      text: 'text-purple-600',
      ring: 'ring-purple-500/20'
    },
    orange: {
      bg: 'from-orange-500 to-orange-600',
      light: 'bg-orange-50',
      text: 'text-orange-600',
      ring: 'ring-orange-500/20'
    },
    pink: {
      bg: 'from-pink-500 to-pink-600',
      light: 'bg-pink-50',
      text: 'text-pink-600',
      ring: 'ring-pink-500/20'
    }
  }

  const classes = colorClasses[color]

  // Generate sparkline path
  const generateSparkline = (data: number[]) => {
    if (!data || data.length === 0) return ''

    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min || 1
    const width = 100
    const height = 30

    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width
      const y = height - ((value - min) / range) * height
      return `${x},${y}`
    })

    return `M ${points.join(' L ')}`
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl ring-1 ${classes.ring} ${onClick ? 'cursor-pointer' : ''} transition-all overflow-hidden`}
    >
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
        <div className={`absolute inset-0 bg-gradient-to-br ${classes.bg} rounded-full blur-3xl`} />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
          </div>

          <div className={`${classes.light} p-3 rounded-xl`}>
            <Icon className={`w-6 h-6 ${classes.text}`} />
          </div>
        </div>

        {/* Trend & Sparkline */}
        <div className="flex items-end justify-between">
          {trend && (
            <div className="flex items-center gap-1">
              <span className={`text-xs font-semibold ${trend.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-gray-500">vs mois dernier</span>
            </div>
          )}

          {sparklineData && sparklineData.length > 0 && (
            <svg
              width="100"
              height="30"
              className="ml-auto"
              viewBox="0 0 100 30"
              preserveAspectRatio="none"
            >
              <path
                d={generateSparkline(sparklineData)}
                fill="none"
                stroke={`currentColor`}
                strokeWidth="2"
                className={classes.text}
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          )}
        </div>
      </div>
    </motion.div>
  )
}
