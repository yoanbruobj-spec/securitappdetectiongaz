import { HTMLAttributes } from 'react'

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string
  height?: string
  variant?: 'text' | 'rectangular' | 'circular'
}

export const Skeleton = ({
  width,
  height,
  variant = 'rectangular',
  className = '',
  ...props
}: SkeletonProps) => {
  const baseClasses = 'animate-pulse bg-gradient-to-r from-slate-700/30 via-slate-600/30 to-slate-700/30 bg-[length:200%_100%]'

  const variants = {
    text: 'rounded h-4',
    rectangular: 'rounded-lg',
    circular: 'rounded-full'
  }

  const style = {
    width: width || '100%',
    height: height || (variant === 'text' ? '1rem' : '100%')
  }

  return (
    <div
      className={`${baseClasses} ${variants[variant]} ${className}`}
      style={style}
      {...props}
    />
  )
}