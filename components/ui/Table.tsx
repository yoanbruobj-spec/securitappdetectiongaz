'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface Column<T> {
  key: string
  label: string
  render?: (item: T, index: number) => ReactNode
  width?: string
  align?: 'left' | 'center' | 'right'
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  onRowClick?: (item: T, index: number) => void
  variant?: 'default' | 'glass' | 'premium'
  emptyMessage?: string
  loading?: boolean
  hoverable?: boolean
}

export function Table<T extends { id?: string | number }>({
  columns,
  data,
  onRowClick,
  variant = 'glass',
  emptyMessage = 'Aucune donnée disponible',
  loading = false,
  hoverable = true
}: TableProps<T>) {
  const variantStyles = {
    default: {
      wrapper: 'bg-white border border-gray-200',
      header: 'bg-gray-50 border-b border-gray-200',
      row: 'border-b border-gray-100 hover:bg-gray-50'
    },
    glass: {
      wrapper: 'bg-white/60 backdrop-blur-xl border border-gray-200/50 shadow-xl',
      header: 'bg-gradient-to-r from-gray-50/80 to-white/80 backdrop-blur-sm border-b border-gray-200/50',
      row: 'border-b border-gray-100/30 hover:bg-white/40 backdrop-blur-sm'
    },
    premium: {
      wrapper: 'bg-gradient-to-br from-white/80 via-white/60 to-white/80 backdrop-blur-2xl border-2 border-gray-200/80 shadow-2xl shadow-black/10',
      header: 'bg-gradient-to-r from-emerald-50/50 via-cyan-50/50 to-emerald-50/50 backdrop-blur-sm border-b-2 border-emerald-200/50',
      row: 'border-b border-gray-100/30 hover:bg-gradient-to-r hover:from-emerald-50/30 hover:to-cyan-50/30 backdrop-blur-sm'
    }
  }

  const styles = variantStyles[variant]

  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  }

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`${styles.wrapper} rounded-xl overflow-hidden`}
      >
        <div className="p-12 flex flex-col items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-gray-200 border-t-emerald-500 rounded-full mb-4"
          />
          <p className="text-sm text-gray-500">Chargement...</p>
        </div>
      </motion.div>
    )
  }

  if (data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${styles.wrapper} rounded-xl overflow-hidden`}
      >
        <div className="p-12 flex flex-col items-center justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4"
          >
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </motion.div>
          <p className="text-sm text-gray-500">{emptyMessage}</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`${styles.wrapper} rounded-xl overflow-hidden`}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={styles.header}>
              {columns.map((column, index) => (
                <motion.th
                  key={column.key}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className={`px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-700 ${alignmentClasses[column.align || 'left']}`}
                  style={{ width: column.width }}
                >
                  {column.label}
                </motion.th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, rowIndex) => (
              <motion.tr
                key={item.id || rowIndex}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: rowIndex * 0.05, duration: 0.3 }}
                className={`${styles.row} ${onRowClick ? 'cursor-pointer' : ''} ${hoverable ? 'transition-all duration-200' : ''}`}
                onClick={() => onRowClick?.(item, rowIndex)}
                whileHover={hoverable ? { x: 4 } : {}}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-6 py-4 text-sm text-gray-900 ${alignmentClasses[column.align || 'left']}`}
                  >
                    {column.render
                      ? column.render(item, rowIndex)
                      : (item as any)[column.key]}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}
