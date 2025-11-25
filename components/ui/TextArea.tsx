'use client'

import { forwardRef, TextareaHTMLAttributes } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  showCount?: boolean
  maxCount?: number
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({
    label,
    error,
    helperText,
    showCount = false,
    maxCount,
    className = '',
    ...props
  }, ref) => {
    const currentLength = typeof props.value === 'string' ? props.value.length : 0

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          className={cn(
            'w-full px-3 py-3 bg-white border border-slate-200 rounded-lg',
            'text-slate-900 text-[15px] placeholder:text-slate-400',
            'transition-all duration-150',
            'hover:border-slate-300',
            'focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20',
            'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
            'resize-none',
            error && 'border-red-300 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
          {...props}
        />

        <div className="flex items-center justify-between mt-1.5">
          <div className="flex-1">
            {helperText && !error && (
              <p className="text-sm text-slate-500">
                {helperText}
              </p>
            )}
            {error && (
              <p className="text-sm text-red-500 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </p>
            )}
          </div>

          {showCount && (
            <p className={cn(
              'text-xs',
              maxCount && currentLength > maxCount ? 'text-red-500' : 'text-slate-500'
            )}>
              {currentLength}{maxCount && ` / ${maxCount}`}
            </p>
          )}
        </div>
      </div>
    )
  }
)

TextArea.displayName = 'TextArea'
