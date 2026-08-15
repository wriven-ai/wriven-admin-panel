import { Badge } from '@/components/ui/Badge'
import type { SupportPriority } from '@/lib/types'

const PRIORITY_VARIANT: Record<SupportPriority, 'outline' | 'secondary' | 'warning' | 'error'> = {
  low: 'outline',
  normal: 'secondary',
  high: 'warning',
  urgent: 'error',
}

export function PriorityBadge({ priority }: { priority: SupportPriority }) {
  return (
    <Badge variant={PRIORITY_VARIANT[priority]} className="capitalize">
      {priority}
    </Badge>
  )
}
