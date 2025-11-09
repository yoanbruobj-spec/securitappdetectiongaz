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
    emerald: 'bg-emerald-500',
    cyan: 'bg-cyan-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    pink: 'bg-pink-500'
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg ring-1 ring-gray-200">
      <h3 className="text-lg font-bold text-gray-900 mb-6">Activité récente</h3>

      <div className="space-y-6">
        {activities.map((activity, index) => {
          const Icon = activity.icon
          const bgColor = colorClasses[activity.color]

          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative flex gap-4"
            >
              {/* Timeline line */}
              {index !== activities.length - 1 && (
                <div className="absolute left-5 top-12 w-0.5 h-full bg-gray-200" />
              )}

              {/* Icon */}
              <div className={`relative z-10 w-10 h-10 ${bgColor} rounded-xl flex items-center justify-center flex-shrink-0 shadow-md`}>
                <Icon className="w-5 h-5 text-white" />
              </div>

              {/* Content */}
              <div className="flex-1 pb-2">
                <div className="flex items-start justify-between mb-1">
                  <h4 className="font-semibold text-gray-900">{activity.title}</h4>
                  <span className="text-xs text-gray-500">{activity.time}</span>
                </div>
                <p className="text-sm text-gray-600">{activity.description}</p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
