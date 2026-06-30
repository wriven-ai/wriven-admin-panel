import { Badge } from '@/components/ui/Badge'
import type { SupportStatus } from '@/lib/types'

const STATUS_VARIANT: Record<SupportStatus, 'success' | 'warning' | 'outline' | 'error'> = {
  open: 'success',
  pending: 'warning',
  resolved: 'outline',
  closed: 'error',
}

export function StatusBadge({ status }: { status: SupportStatus }) {
  return (
    <Badge variant={STATUS_VARIANT[status]} className="capitalize">
      {status}
    </Badge>
  )
}
