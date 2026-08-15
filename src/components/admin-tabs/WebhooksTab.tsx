import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'
import { toast } from 'sonner'
import { DataTable } from '@/components/data-table/DataTable'
import { Pagination } from '@/components/data-table/Pagination'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { formatRelative } from '@/lib/format'
import { useAdminStore } from '@/stores/admin'
import type { AdminWebhookRow } from '@/lib/types'
import { useWebhooks, useDisableWebhook } from '@/app/pages/webhooks/queries'

const LIMIT = 10

interface ScopeProps {
  workspaceId?: string
  projectId?: string
}

function statusVariant(code: number | null) {
  if (code == null) return 'outline' as const
  if (code >= 200 && code < 300) return 'success' as const
  return 'error' as const
}

export function WebhooksTab({ workspaceId, projectId }: ScopeProps) {
  const role = useAdminStore((s) => s.me?.role)
  const [page, setPage] = useState(1)
  const [sorting, setSorting] = useState<SortingState>([])
  const [toDisable, setToDisable] = useState<AdminWebhookRow | null>(null)

  const { data, isLoading } = useWebhooks({ page, limit: LIMIT, workspaceId, projectId })
  const disable = useDisableWebhook()

  const canModerate = role === 'admin' || role === 'moderator'

  const columns: ColumnDef<AdminWebhookRow>[] = [
    {
      accessorKey: 'url',
      header: 'Endpoint',
      cell: ({ getValue }) => (
        <p className="max-w-sm truncate font-mono text-xs">{getValue<string>()}</p>
      ),
    },
    {
      accessorKey: 'events',
      header: 'Events',
      cell: ({ getValue }) => {
        const events = getValue<string[]>()
        return (
          <div className="flex flex-wrap gap-1">
            {events.slice(0, 3).map((e) => (
              <Badge key={e} variant="outline">{e}</Badge>
            ))}
            {events.length > 3 && (
              <span className="text-2xs text-muted-foreground">+{events.length - 3}</span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'active',
      header: 'State',
      cell: ({ row }) =>
        row.original.active ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="secondary">Disabled</Badge>
        ),
    },
    {
      accessorKey: 'lastStatus',
      header: 'Last',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <Badge variant={statusVariant(row.original.lastStatus)}>
            {row.original.lastStatus ?? '—'}
          </Badge>
          {row.original.lastFiredAt && (
            <span className="mt-0.5 text-2xs text-muted-foreground">
              {formatRelative(row.original.lastFiredAt)}
            </span>
          )}
        </div>
      ),
    },
    ...(canModerate
      ? [
          {
            id: 'actions',
            cell: ({ row }: { row: { original: AdminWebhookRow } }) =>
              row.original.active ? (
                <Button variant="destructive" size="xs" onClick={() => setToDisable(row.original)}>
                  Disable
                </Button>
              ) : null,
          } satisfies ColumnDef<AdminWebhookRow>,
        ]
      : []),
  ]

  const table = useReactTable({
    data: data?.items ?? [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
  })

  async function handleDisable() {
    if (!toDisable) return
    await disable.mutateAsync(toDisable.id)
    toast.success('Webhook disabled.')
    setToDisable(null)
  }

  return (
    <div className="space-y-4">
      <DataTable
        table={table}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No webhooks found."
      />
      <Pagination page={page} total={data?.total ?? 0} limit={LIMIT} onPage={setPage} />

      <ConfirmDialog
        open={Boolean(toDisable)}
        title="Disable webhook"
        description={`Stop delivering events to ${toDisable?.url}? It stays listed and can be re-enabled by the workspace.`}
        confirmLabel="Disable"
        destructive
        onConfirm={handleDisable}
        onCancel={() => setToDisable(null)}
      />
    </div>
  )
}
