'use client'

import { motion } from 'framer-motion'
import { LucideIcon, TrendingUp, TrendingDown, Sparkles } from 'lucide-react'

interface QuickStatGlassProps {
  title: string
  value: string | number
  icon: LucideIcon
  color?: 'emerald' | 'cyan' | 'blue' | 'purple' | 'orange' | 'pink'
  trend?: {
    value: number
    isPositive: boolean
  }
  onClick?: () => void
}

export function QuickStatGlass({
  title,
  value,
  icon: Icon,
  color = 'emerald',
  trend,
  onClick,
}: QuickStatGlassProps) {
  const colorClasses = {
    emerald: {
      gradient: 'from-emerald-500 to-emerald-600',
      glow: 'group-hover:shadow-[0_0_40px_rgba(16,185,129,0.6)]',
      ring: 'ring-emerald-500/30',
      text: 'text-emerald-600 dark:text-emerald-400',
    },
    cyan: {
      gradient: 'from-cyan-500 to-cyan-600',
      glow: 'group-hover:shadow-[0_0_40px_rgba(6,182,212,0.6)]',
      ring: 'ring-cyan-500/30',
      text: 'text-cyan-600 dark:text-cyan-400',
    },
    blue: {
      gradient: 'from-blue-500 to-blue-600',
      glow: 'group-hover:shadow-[0_0_40px_rgba(59,130,246,0.6)]',
      ring: 'ring-blue-500/30',
      text: 'text-blue-600 dark:text-blue-400',
    },
    purple: {
      gradient: 'from-purple-500 to-purple-600',
      glow: 'group-hover:shadow-[0_0_40px_rgba(168,85,247,0.6)]',
      ring: 'ring-purple-500/30',
      text: 'text-purple-600 dark:text-purple-400',
    },
    orange: {
      gradient: 'from-orange-500 to-orange-600',
      glow: 'group-hover:shadow-[0_0_40px_rgba(249,115,22,0.6)]',
      ring: 'ring-orange-500/30',
      text: 'text-orange-600 dark:text-orange-400',
    },
    pink: {
      gradient: 'from-pink-500 to-pink-600',
      glow: 'group-hover:shadow-[0_0_40px_rgba(236,72,153,0.6)]',
      ring: 'ring-pink-500/30',
      text: 'text-pink-600 dark:text-pink-400',
    },
  }

  const colors = colorClasses[color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{
        y: -8,
        scale: 1.03,
        transition: { type: 'spring', stiffness: 400, damping: 17 }
      }}
      whileTap={onClick ? { scale: 0.97 } : {}}
      onClick={onClick}
      className={`
        group relative glass rounded-3xl p-6
        ${onClick ? 'cursor-pointer' : ''}
        ring-2 ${colors.ring}
        shadow-xl ${colors.glow}
        transition-all duration-300
        overflow-hidden
      `}
    >
      {/* Gradient animé en fond */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'linear'
        }}
        style={{ backgroundSize: '200% 200%' }}
      />

      {/* Particules décoratives */}
      <motion.div
        className="absolute top-4 right-4 opacity-20"
        animate={{
          rotate: 360,
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      >
        <Sparkles className={`w-6 h-6 ${colors.text}`} />
      </motion.div>

      {/* Header avec icon 3D */}
      <div className="relative flex items-start justify-between mb-4">
        <motion.div
          whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
          transition={{ duration: 0.5 }}
          className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center shadow-2xl`}
        >
          {/* Glow effect */}
          <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${colors.gradient} blur-xl opacity-50 animate-pulse-glow`} />
          <Icon className="relative w-8 h-8 text-white drop-shadow-lg" />
        </motion.div>

        {trend && (
          <motion.div
            initial={{ scale: 0, x: 20 }}
            animate={{ scale: 1, x: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl shadow-lg ${
              trend.isPositive
                ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
            }`}
          >
            <motion.div
              animate={{ y: trend.isPositive ? [-2, 2, -2] : [2, -2, 2] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {trend.isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
            </motion.div>
            <span className="text-sm font-bold">{Math.abs(trend.value)}%</span>
          </motion.div>
        )}
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wider">
        {title}
      </h3>

      {/* Value avec animation de compteur */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="text-4xl font-black text-gray-900 dark:text-gray-100 mb-2"
      >
        <motion.span
          initial={{ filter: 'blur(10px)' }}
          animate={{ filter: 'blur(0px)' }}
          transition={{ duration: 0.5 }}
        >
          {value}
        </motion.span>
      </motion.div>

      {/* Hover indicator - Arrow */}
      {onClick && (
        <motion.div
          className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <svg
            className={`w-6 h-6 ${colors.text}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </motion.div>
      )}

      {/* Shimmer effect on hover */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100"
        initial={false}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 animate-shimmer" />
      </motion.div>
    </motion.div>
  )
}
