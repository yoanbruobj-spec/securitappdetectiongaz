'use client'

import { forwardRef, ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'icon'
  loading?: boolean
  icon?: React.ReactNode
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    fullWidth = false,
    className = '',
    disabled,
    ...props
  }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]'

    const variants = {
      primary: 'bg-emerald-500 text-white hover:bg-emerald-600 focus-visible:ring-emerald-500',
      secondary: 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 focus-visible:ring-slate-500',
      ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-500',
      danger: 'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500',
      success: 'bg-emerald-500 text-white hover:bg-emerald-600 focus-visible:ring-emerald-500'
    }

    const sizes = {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-base',
      xl: 'h-14 px-8 text-base',
      icon: 'h-10 w-10'
    }

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : icon ? (
          icon
        ) : null}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
