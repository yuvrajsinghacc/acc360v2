import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'orange' | 'yellow' | 'pale' | 'teal' | 'red' | 'blue'
  className?: string
}

const variants = {
  default: 'bg-card text-muted border border-border',
  orange:  'bg-[#FFA300] text-[#28282b]',
  yellow:  'bg-[#FECD42] text-[#28282b]',
  pale:    'bg-[#FFB621] text-[#28282b]',
  teal:    'bg-[#A7BDB1] text-[#28282b]',
  red:     'bg-red-500/10 text-red-400 border border-red-500/20',
  blue:    'bg-blue-500/10 text-blue-400 border border-blue-500/20',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
