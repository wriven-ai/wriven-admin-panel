import { Badge } from '@/components/ui/Badge'
import type { SupportScope } from '@/lib/types'

export function ScopeBadge({ scope }: { scope: SupportScope }) {
  return (
    <Badge variant="outline" className="capitalize">
      {scope}
    </Badge>
  )
}
