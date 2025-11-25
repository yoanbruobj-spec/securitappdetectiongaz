'use client'

import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md'
}

export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}: BadgeProps) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-full'

  const variants = {
    default: 'bg-slate-100 text-slate-600',
    success: 'bg-emerald-50 text-emerald-600',
    warning: 'bg-amber-50 text-amber-600',
    danger: 'bg-red-50 text-red-600',
    info: 'bg-blue-50 text-blue-600'
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs'
  }

  return (
    <span
      className={cn(baseClasses, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </span>
  )
}
