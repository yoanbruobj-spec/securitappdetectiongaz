'use client'

import { forwardRef, InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { AlertCircle } from 'lucide-react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
  helperText?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({
    label,
    error,
    icon,
    helperText,
    className = '',
    type = 'text',
    ...props
  }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            type={type}
            className={cn(
              'w-full h-11 px-3 bg-white border border-slate-200 rounded-lg',
              'text-slate-900 text-[15px] placeholder:text-slate-400',
              'transition-all duration-150',
              'hover:border-slate-300',
              'focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20',
              'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
              icon && 'pl-10',
              error && 'border-red-300 focus:border-red-500 focus:ring-red-500/20',
              className
            )}
            {...props}
          />
        </div>

        {helperText && !error && (
          <p className="mt-1.5 text-sm text-slate-500">
            {helperText}
          </p>
        )}

        {error && (
          <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
