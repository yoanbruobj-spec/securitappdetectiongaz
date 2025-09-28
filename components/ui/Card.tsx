import { forwardRef, HTMLAttributes } from 'react'
import { motion } from 'framer-motion'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass' | 'bordered'
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({
    children,
    variant = 'default',
    hover = false,
    padding = 'md',
    className = '',
    ...props
  }, ref) => {
    const baseClasses = 'rounded-xl transition-all duration-300'

    const variants = {
      default: 'bg-[#141B2D] border border-[#2D3B52]',
      elevated: 'bg-[#1E2A3F] border border-[#2D3B52] shadow-lg',
      glass: 'bg-[#1E2A3F]/50 backdrop-blur-xl border border-[#2D3B52]/50',
      bordered: 'bg-transparent border-2 border-[#2D3B52]'
    }

    const paddings = {
      none: '',
      sm: 'p-3',
      md: 'p-6',
      lg: 'p-8'
    }

    const hoverClasses = hover
      ? 'hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 hover:border-blue-500/30 cursor-pointer'
      : ''

    return (
      <motion.div
        ref={ref}
        className={`${baseClasses} ${variants[variant]} ${paddings[padding]} ${hoverClasses} ${className}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

Card.displayName = 'Card'