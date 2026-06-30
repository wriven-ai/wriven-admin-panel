import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { FilterBar } from '@/components/data-table/filter-bar'
import { Pagination } from '@/components/data-table/pagination'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { AuditEvent } from '@/lib/types'
import { useAuditLog } from './queries'

const LIMIT = 30

function AuditRow({ event }: { event: AuditEvent }) {
  const [expanded, setExpanded] = useState(false)
  const hasMetadata = Object.keys(event.metadata).length > 0

  return (
    <div className="border-b last:border-0">
      <button
        onClick={() => hasMetadata && setExpanded(!expanded)}
        className={cn(
          'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
          hasMetadata && 'cursor-pointer hover:bg-muted/30',
        )}
      >
        {hasMetadata ? (
          expanded ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )
        ) : (
          <span className="h-3.5 w-3.5 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-medium">{event.action}</span>
            {event.targetType && (
              <Badge variant="outline" className="text-xs capitalize">
                {event.targetType}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {event.adminEmail}
            {event.ip && ` · ${event.ip}`}
          </p>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {formatDateTime(event.createdAt)}
        </span>
      </button>

      {expanded && hasMetadata && (
        <div className="border-t bg-muted/20 px-12 py-3">
          <pre className="overflow-x-auto text-xs text-muted-foreground">
            {JSON.stringify(event.metadata, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

export function AuditPage() {
  const [page, setPage] = useState(1)
  const [action, setAction] = useState('')
  const [targetType, setTargetType] = useState('')

  const { data, isLoading } = useAuditLog({
    page,
    limit: LIMIT,
    action: action || undefined,
    targetType: targetType || undefined,
  })

  return (
    <div className="space-y-4">
      <PageHeader title="Audit Log" description="Append-only admin action history." />

      <FilterBar
        value={action}
        onChange={(v) => { setAction(v); setPage(1) }}
        placeholder="Filter by action…"
      >
        <select
          value={targetType}
          onChange={(e) => { setTargetType(e.target.value); setPage(1) }}
          className="h-9 rounded-md border bg-background px-3 text-sm outline-none ring-ring focus:ring-1"
        >
          <option value="">All targets</option>
          <option value="user">User</option>
          <option value="workspace">Workspace</option>
          <option value="project">Project</option>
          <option value="entry">Entry</option>
          <option value="api_key">API Key</option>
          <option value="webhook">Webhook</option>
          <option value="admin_user">Admin user</option>
          <option value="plan">Plan</option>
        </select>
      </FilterBar>

      <div className="overflow-hidden rounded-lg border bg-card">
        {isLoading ? (
          <div className="space-y-px">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse bg-muted/40" />
            ))}
          </div>
        ) : data?.items.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No audit events found.</p>
        ) : (
          data?.items.map((event) => <AuditRow key={event.id} event={event} />)
        )}
      </div>

      <Pagination page={page} total={data?.total ?? 0} limit={LIMIT} onPage={setPage} />
    </div>
  )
}
