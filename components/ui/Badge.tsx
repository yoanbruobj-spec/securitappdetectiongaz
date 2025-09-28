import { HTMLAttributes } from 'react'

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
    default: 'bg-slate-700/50 text-slate-300 border border-slate-600/50',
    success: 'bg-green-500/20 text-green-400 border border-green-500/30',
    warning: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
    danger: 'bg-red-500/20 text-red-400 border border-red-500/30',
    info: 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm'
  }

  return (
    <span
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}