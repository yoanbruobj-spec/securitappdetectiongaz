'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface Activity {
  id: string
  icon: LucideIcon
  title: string
  description: string
  time: string
  color: 'emerald' | 'cyan' | 'blue' | 'purple' | 'orange' | 'pink'
}

interface ActivityTimelineProps {
  activities: Activity[]
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  const colorClasses = {
    emerald: {
      bg: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
      glow: 'shadow-emerald-500/50',
      border: 'border-emerald-300 dark:border-emerald-700',
      text: 'text-emerald-600 dark:text-emerald-400'
    },
    cyan: {
      bg: 'bg-gradient-to-br from-cyan-400 to-cyan-600',
      glow: 'shadow-cyan-500/50',
      border: 'border-cyan-300 dark:border-cyan-700',
      text: 'text-cyan-600 dark:text-cyan-400'
    },
    blue: {
      bg: 'bg-gradient-to-br from-blue-400 to-blue-600',
      glow: 'shadow-blue-500/50',
      border: 'border-blue-300 dark:border-blue-700',
      text: 'text-blue-600 dark:text-blue-400'
    },
    purple: {
      bg: 'bg-gradient-to-br from-purple-400 to-purple-600',
      glow: 'shadow-purple-500/50',
      border: 'border-purple-300 dark:border-purple-700',
      text: 'text-purple-600 dark:text-purple-400'
    },
    orange: {
      bg: 'bg-gradient-to-br from-orange-400 to-orange-600',
      glow: 'shadow-orange-500/50',
      border: 'border-orange-300 dark:border-orange-700',
      text: 'text-orange-600 dark:text-orange-400'
    },
    pink: {
      bg: 'bg-gradient-to-br from-pink-400 to-pink-600',
      glow: 'shadow-pink-500/50',
      border: 'border-pink-300 dark:border-pink-700',
      text: 'text-pink-600 dark:text-pink-400'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-white/80 via-white/60 to-white/80 dark:from-gray-800/80 dark:via-gray-900/60 dark:to-gray-800/80 backdrop-blur-2xl rounded-2xl p-6 shadow-2xl shadow-black/10 border border-gray-200/50 dark:border-gray-700/50"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
          Activité récente
        </h3>
        <motion.div
          className="w-2 h-2 rounded-full bg-emerald-500"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.5, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="space-y-6">
        {activities.map((activity, index) => {
          const Icon = activity.icon
          const colors = colorClasses[activity.color]

          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              whileHover={{ x: 4 }}
              className="relative flex gap-4 group"
            >
              {/* Timeline line */}
              {index !== activities.length - 1 && (
                <div className="absolute left-5 top-12 w-0.5 h-full bg-gradient-to-b from-gray-300 to-gray-200 dark:from-gray-600 dark:to-gray-700" />
              )}

              {/* Icon with glow */}
              <motion.div
                className={`relative z-10 w-10 h-10 ${colors.bg} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${colors.glow}`}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Icon className="w-5 h-5 text-white" strokeWidth={2.5} />

                {/* Subtle pulse glow */}
                <motion.div
                  className={`absolute inset-0 rounded-xl ${colors.bg} blur-md opacity-50`}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.3, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.2
                  }}
                />
              </motion.div>

              {/* Content with glass background */}
              <motion.div
                className="flex-1 pb-2 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-lg p-3 border border-gray-200/30 dark:border-gray-700/30 group-hover:border-gray-300/50 dark:group-hover:border-gray-600/50 transition-all"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 + 0.2 }}
              >
                <div className="flex items-start justify-between mb-1">
                  <h4 className={`font-semibold ${colors.text}`}>{activity.title}</h4>
                  <motion.span
                    className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100/50 dark:bg-gray-700/50 px-2 py-1 rounded-md"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                  >
                    {activity.time}
                  </motion.span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">{activity.description}</p>
              </motion.div>
            </motion.div>
          )
        })}
      </div>

      {activities.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-4 border-gray-300 dark:border-gray-600 border-t-emerald-500 rounded-full"
            />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Aucune activité récente</p>
        </motion.div>
      )}
    </motion.div>
  )
}
