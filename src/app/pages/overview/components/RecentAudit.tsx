import { formatRelative } from '@/lib/format'
import type { AuditEvent } from '@/lib/types'

interface RecentAuditProps {
  events: AuditEvent[]
}

export function RecentAudit({ events }: RecentAuditProps) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <p className="mb-3 text-sm font-medium">Recent Activity</p>
      {events.length === 0 ? (
        <p className="text-xs text-muted-foreground">No recent activity.</p>
      ) : (
        <ul className="space-y-3">
          {events.map((e) => (
            <li key={e.id} className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold uppercase text-muted-foreground">
                {e.adminEmail[0]}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium">{e.action}</p>
                <p className="text-xs text-muted-foreground">
                  {e.adminEmail} · {formatRelative(e.createdAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
