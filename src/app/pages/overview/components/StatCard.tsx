import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  /** Icon accent — defaults to muted; `secondary` uses the amber brand tint. */
  accent?: 'muted' | 'secondary'
  className?: string
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  accent = 'muted',
  className,
}: StatCardProps) {
  return (
    <div className={cn('rounded-lg bg-card shadow-[var(--shadow-sm)] p-5', className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <Icon
          className={cn(
            'h-4 w-4',
            accent === 'secondary' ? 'text-secondary-foreground' : 'text-muted-foreground',
          )}
        />
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {description && (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  )
}
