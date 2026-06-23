'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { LoadingSpinner } from './LoadingSpinner'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      icon,
      children,
      ...props
    },
    ref
  ) => {
    const base =
      'inline-flex items-center justify-center gap-2 font-medium rounded-2xl transition-all duration-[1200ms] focus:outline-none focus:ring-1 focus:ring-[#FFA300] disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.97]'

    const variants = {
      primary:
        'bg-[#FFA300] hover:bg-[#FFB621] text-[#28282b] shadow-md shadow-[#FFA300]/20 hover:shadow-xl hover:shadow-[#FFA300]/40',
      secondary:
        'bg-card hover:bg-[#424245] text-light border border-border shadow-sm shadow-black/20 hover:shadow-md hover:shadow-black/40',
      ghost:
        'bg-transparent hover:bg-card text-muted hover:text-light hover:shadow-sm hover:shadow-black/20',
      danger:
        'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 shadow-sm shadow-red-500/10 hover:shadow-md hover:shadow-red-500/20',
      outline:
        'bg-transparent border border-border hover:border-[#FFA300] text-light shadow-sm shadow-black/20 hover:shadow-md hover:shadow-black/30',
    }

    const sizes = {
      sm: 'text-xs px-3 py-1.5',
      md: 'text-sm px-4 py-2',
      lg: 'text-base px-6 py-3',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading ? (
          <LoadingSpinner size="sm" />
        ) : (
          icon && <span className="shrink-0">{icon}</span>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
