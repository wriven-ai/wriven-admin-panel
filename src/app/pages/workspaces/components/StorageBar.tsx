import { formatBytes } from '@/lib/format'
import { cn } from '@/lib/utils'

interface StorageBarProps {
  usedMb: number
  capMb?: number
}

export function StorageBar({ usedMb, capMb }: StorageBarProps) {
  if (!capMb) {
    return <span className="text-xs text-muted-foreground">{formatBytes(usedMb * 1024 * 1024)}</span>
  }

  const pct = Math.min(100, (usedMb / capMb) * 100)
  const isNearCap = pct >= 80
  const isOver = pct >= 100

  return (
    <div className="min-w-24">
      <div className="mb-1 flex justify-between text-xs">
        <span>{formatBytes(usedMb * 1024 * 1024)}</span>
        <span className={cn('text-muted-foreground', isNearCap && 'text-warning', isOver && 'text-destructive')}>
          {pct.toFixed(0)}%
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            isOver ? 'bg-destructive' : isNearCap ? 'bg-warning' : 'bg-brand-accent',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
