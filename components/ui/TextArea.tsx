import { forwardRef, TextareaHTMLAttributes, useState } from 'react'
import { motion } from 'framer-motion'

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  variant?: 'default' | 'glass' | 'premium'
  helperText?: string
  showCount?: boolean
  maxCount?: number
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({
    label,
    error,
    variant = 'glass',
    helperText,
    showCount = false,
    maxCount,
    className = '',
    ...props
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false)
    const currentLength = typeof props.value === 'string' ? props.value.length : 0

    const variantStyles = {
      default: `
        bg-white
        border border-gray-200
        focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
      `,
      glass: `
        bg-white/60
        backdrop-blur-xl
        border border-gray-200/50
        shadow-lg shadow-black/5
        focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30
        focus:shadow-emerald-500/20 focus:shadow-xl
        hover:border-gray-300
        transition-all duration-300
      `,
      premium: `
        bg-gradient-to-br from-white/80 to-gray-50/80
        backdrop-blur-2xl
        border-2 border-gray-200/80
        shadow-2xl shadow-black/10
        focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/30
        focus:shadow-emerald-500/30 focus:shadow-2xl
        hover:border-gray-300
        hover:shadow-xl
        transition-all duration-500
      `
    }

    return (
      <div className="w-full">
        {label && (
          <motion.label
            className="block text-sm font-semibold text-gray-700 mb-2"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </motion.label>
        )}
        <motion.div
          className="relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <textarea
            ref={ref}
            className={`
              w-full px-4 py-3.5
              ${variantStyles[variant]}
              rounded-xl
              text-gray-900
              placeholder:text-gray-400
              disabled:opacity-50 disabled:cursor-not-allowed
              resize-none
              ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/30' : ''}
              ${className}
            `}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
          {/* Focus ring animation */}
          {isFocused && variant === 'premium' && (
            <motion.div
              className="absolute inset-0 rounded-xl border-2 border-emerald-400 pointer-events-none"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </motion.div>

        <div className="flex items-center justify-between mt-2">
          {/* Helper text or error */}
          <div className="flex-1">
            {helperText && !error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-gray-500"
              >
                {helperText}
              </motion.p>
            )}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-500 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </motion.p>
            )}
          </div>

          {/* Character count */}
          {showCount && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`text-xs ${
                maxCount && currentLength > maxCount
                  ? 'text-red-500'
                  : 'text-gray-500'
              }`}
            >
              {currentLength}{maxCount && ` / ${maxCount}`}
            </motion.p>
          )}
        </div>
      </div>
    )
  }
)

TextArea.displayName = 'TextArea'
