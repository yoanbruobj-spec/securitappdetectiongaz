import { forwardRef, SelectHTMLAttributes, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
  variant?: 'default' | 'glass' | 'premium'
  helperText?: string
  options?: Array<{ value: string; label: string }>
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({
    label,
    error,
    icon,
    variant = 'glass',
    helperText,
    options,
    className = '',
    children,
    ...props
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false)

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

    const iconWrapperStyles = {
      default: 'text-gray-400',
      glass: 'text-gray-500',
      premium: 'text-emerald-600'
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
          <div className="relative flex items-center">
            {icon && (
              <motion.div
                className={`absolute left-4 ${iconWrapperStyles[variant]} transition-colors duration-300 z-10`}
                animate={isFocused ? { scale: 1.1 } : { scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                {icon}
              </motion.div>
            )}
            <select
              ref={ref}
              className={`
                w-full px-4 py-3.5
                ${icon ? 'pl-12' : ''}
                pr-10
                ${variantStyles[variant]}
                rounded-xl
                text-gray-900
                appearance-none
                cursor-pointer
                disabled:opacity-50 disabled:cursor-not-allowed
                ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/30' : ''}
                ${className}
              `}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              {...props}
            >
              {options ? (
                options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))
              ) : (
                children
              )}
            </select>
            {/* Chevron icon */}
            <motion.div
              className={`absolute right-4 ${iconWrapperStyles[variant]} transition-colors duration-300 pointer-events-none`}
              animate={isFocused ? { rotate: 180 } : { rotate: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown className="w-5 h-5" />
            </motion.div>
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
          </div>
        </motion.div>

        {/* Helper text */}
        {helperText && !error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-xs text-gray-500"
          >
            {helperText}
          </motion.p>
        )}

        {/* Error message */}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-sm text-red-500 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </motion.p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'
