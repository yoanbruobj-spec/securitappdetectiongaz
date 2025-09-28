import { forwardRef, InputHTMLAttributes, useState } from 'react'
import { motion } from 'framer-motion'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({
    label,
    error,
    icon,
    className = '',
    type = 'text',
    ...props
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false)
    const hasValue = props.value !== undefined && props.value !== ''

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-300 mb-2">
            {label}
          </label>
        )}
        <div className="flex items-center gap-3">
          {icon && (
            <div className="text-slate-400 flex-shrink-0">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={type}
            className={`
              flex-1 px-4 py-3
              bg-[#141B2D] border border-[#2D3B52]
              rounded-lg text-slate-100
              transition-all duration-300
              focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
              ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
              disabled:opacity-50 disabled:cursor-not-allowed
              placeholder:text-slate-500
              ${className}
            `}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
        </div>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-sm text-red-400"
          >
            {error}
          </motion.p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'