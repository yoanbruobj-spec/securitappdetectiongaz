'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, AlertCircle, Info, X, Loader2 } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading'

interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContextType {
  toasts: Toast[]
  toast: (options: Omit<Toast, 'id'>) => string
  dismiss: (id: string) => void
  success: (title: string, description?: string) => string
  error: (title: string, description?: string) => string
  warning: (title: string, description?: string) => string
  info: (title: string, description?: string) => string
  loading: (title: string, description?: string) => string
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((options: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(7)
    const newToast: Toast = {
      ...options,
      id,
      duration: options.duration ?? 5000,
    }

    setToasts((prev) => [...prev, newToast])

    if (newToast.type !== 'loading' && newToast.duration) {
      setTimeout(() => dismiss(id), newToast.duration)
    }

    return id
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const success = useCallback((title: string, description?: string) => {
    return toast({ type: 'success', title, description })
  }, [toast])

  const error = useCallback((title: string, description?: string) => {
    return toast({ type: 'error', title, description })
  }, [toast])

  const warning = useCallback((title: string, description?: string) => {
    return toast({ type: 'warning', title, description })
  }, [toast])

  const info = useCallback((title: string, description?: string) => {
    return toast({ type: 'info', title, description })
  }, [toast])

  const loading = useCallback((title: string, description?: string) => {
    return toast({ type: 'loading', title, description, duration: undefined })
  }, [toast])

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss, success, error, warning, info, loading }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

function ToastContainer({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
    loading: <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />,
  }

  const backgrounds = {
    success: 'bg-white dark:bg-gray-800 border-l-4 border-emerald-500',
    error: 'bg-white dark:bg-gray-800 border-l-4 border-red-500',
    warning: 'bg-white dark:bg-gray-800 border-l-4 border-amber-500',
    info: 'bg-white dark:bg-gray-800 border-l-4 border-blue-500',
    loading: 'bg-white dark:bg-gray-800 border-l-4 border-gray-400',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`${backgrounds[toast.type]} rounded-xl shadow-xl p-4 pointer-events-auto flex items-start gap-3 min-w-[320px]`}
    >
      <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{toast.title}</p>
        {toast.description && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{toast.description}</p>
        )}
        {toast.action && (
          <button
            onClick={() => {
              toast.action?.onClick()
              onDismiss()
            }}
            className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 mt-2 transition-colors"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      {toast.type !== 'loading' && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      )}
    </motion.div>
  )
}
