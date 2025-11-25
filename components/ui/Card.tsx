'use client'

import { forwardRef, HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'bordered'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({
    children,
    variant = 'default',
    padding = 'md',
    className = '',
    ...props
  }, ref) => {
    const baseClasses = 'bg-white rounded-xl border border-slate-200'

    const variants = {
      default: 'shadow-sm',
      interactive: 'shadow-sm transition-all duration-150 hover:border-emerald-200 hover:shadow-md cursor-pointer active:scale-[0.99]',
      bordered: 'border-2'
    }

    const paddings = {
      none: '',
      sm: 'p-3',
      md: 'p-4 sm:p-5',
      lg: 'p-5 sm:p-6'
    }

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          variants[variant],
          paddings[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

// Card Header component
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ title, subtitle, action, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-start justify-between gap-4 mb-4', className)}
        {...props}
      >
        <div>
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
    )
  }
)

CardHeader.displayName = 'CardHeader'

// Card Content component
export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <div ref={ref} className={cn('', className)} {...props}>
        {children}
      </div>
    )
  }
)

CardContent.displayName = 'CardContent'

// Card Footer component
export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center gap-3 mt-4 pt-4 border-t border-slate-100', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

CardFooter.displayName = 'CardFooter'
