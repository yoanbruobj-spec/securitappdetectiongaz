'use client'

import { motion } from 'framer-motion'

interface MiniChartProps {
  data: number[]
  color?: 'emerald' | 'cyan' | 'blue' | 'purple' | 'orange' | 'pink'
  height?: number
  width?: number
  showGradient?: boolean
}

export function MiniChart({ data, color = 'emerald', height = 40, width = 100, showGradient = true }: MiniChartProps) {
  if (!data || data.length === 0) return null

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  // Générer les points du path SVG
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width
    const y = height - ((value - min) / range) * height
    return `${x},${y}`
  }).join(' ')

  const colorMap = {
    emerald: { stroke: '#10b981', fill: 'url(#gradient-emerald)' },
    cyan: { stroke: '#06b6d4', fill: 'url(#gradient-cyan)' },
    blue: { stroke: '#3b82f6', fill: 'url(#gradient-blue)' },
    purple: { stroke: '#a855f7', fill: 'url(#gradient-purple)' },
    orange: { stroke: '#f97316', fill: 'url(#gradient-orange)' },
    pink: { stroke: '#ec4899', fill: 'url(#gradient-pink)' },
  }

  const gradientColors = {
    emerald: ['#10b981', '#059669'],
    cyan: ['#06b6d4', '#0891b2'],
    blue: ['#3b82f6', '#2563eb'],
    purple: ['#a855f7', '#9333ea'],
    orange: ['#f97316', '#ea580c'],
    pink: ['#ec4899', '#db2777'],
  }

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={gradientColors[color][0]} stopOpacity="0.3" />
          <stop offset="100%" stopColor={gradientColors[color][1]} stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* Area fill */}
      {showGradient && (
        <motion.polygon
          points={`0,${height} ${points} ${width},${height}`}
          fill={colorMap[color].fill}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
      )}

      {/* Line */}
      <motion.polyline
        points={points}
        fill="none"
        stroke={colorMap[color].stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: 'easeInOut' }}
      />

      {/* Dots */}
      {data.map((value, index) => {
        const x = (index / (data.length - 1)) * width
        const y = height - ((value - min) / range) * height

        return (
          <motion.circle
            key={index}
            cx={x}
            cy={y}
            r="3"
            fill={colorMap[color].stroke}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8 + index * 0.05, duration: 0.3 }}
            className="drop-shadow-lg"
          />
        )
      })}
    </svg>
  )
}
