'use client'

import { motion } from 'framer-motion'

interface ProgressRingProps {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  color?: 'emerald' | 'cyan' | 'blue' | 'purple' | 'orange' | 'pink' | 'red'
  label?: string
  showValue?: boolean
  children?: React.ReactNode
}

export function ProgressRing({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  color = 'emerald',
  label,
  showValue = true,
  children,
}: ProgressRingProps) {
  const percentage = Math.min((value / max) * 100, 100)
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percentage / 100) * circumference

  const colorMap = {
    emerald: { stroke: '#10b981', glow: 'rgba(16, 185, 129, 0.3)' },
    cyan: { stroke: '#06b6d4', glow: 'rgba(6, 182, 212, 0.3)' },
    blue: { stroke: '#3b82f6', glow: 'rgba(59, 130, 246, 0.3)' },
    purple: { stroke: '#a855f7', glow: 'rgba(168, 85, 247, 0.3)' },
    orange: { stroke: '#f97316', glow: 'rgba(249, 115, 22, 0.3)' },
    pink: { stroke: '#ec4899', glow: 'rgba(236, 72, 153, 0.3)' },
    red: { stroke: '#ef4444', glow: 'rgba(239, 68, 68, 0.3)' },
  }

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <filter id={`glow-${color}`}>
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200"
        />

        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colorMap[color].stroke}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          animate={{
            strokeDashoffset: offset,
          }}
          transition={{
            duration: 1.5,
            ease: 'easeInOut',
          }}
          style={{
            filter: `drop-shadow(0 0 8px ${colorMap[color].glow})`,
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children ? (
          children
        ) : (
          <>
            {showValue && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                className="text-2xl font-bold text-gray-900"
              >
                {Math.round(percentage)}%
              </motion.div>
            )}
            {label && (
              <div className="text-xs text-gray-600 mt-1">{label}</div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
