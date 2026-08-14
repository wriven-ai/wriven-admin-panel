import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable } from '@/components/data-table/DataTable'
import { FilterBar } from '@/components/data-table/FilterBar'
import { Pagination } from '@/components/data-table/Pagination'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { formatRelative } from '@/lib/format'
import { useAdminStore } from '@/stores/admin'
import { cn } from '@/lib/utils'
import type { AdminWebhookRow } from '@/lib/types'
import { useWebhooks, useDisableWebhook } from './queries'

const LIMIT = 20

function isFailingWebhook(w: AdminWebhookRow) {
  return w.lastStatus !== null && (w.lastStatus < 200 || w.lastStatus >= 300)
}

export function WebhooksPage() {
  const role = useAdminStore((s) => s.me?.role)
  const [page, setPage] = useState(1)
  const [sorting, setSorting] = useState<SortingState>([])
  const [toDisable, setToDisable] = useState<AdminWebhookRow | null>(null)

  const { data, isLoading } = useWebhooks({ page, limit: LIMIT })

  const disable = useDisableWebhook()
  const canModerate = role === 'admin' || role === 'moderator'

  const columns: ColumnDef<AdminWebhookRow>[] = [
    {
      accessorKey: 'url',
      header: 'URL',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {isFailingWebhook(row.original) && (
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />
          )}
          <div className="min-w-0">
            <p className="max-w-xs truncate text-xs font-mono">{row.original.url}</p>
            <p className="text-xs text-muted-foreground">{row.original.events.join(', ')}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'active',
      header: 'Status',
      cell: ({ row }) => {
        const failing = isFailingWebhook(row.original)
        return row.original.active ? (
          <Badge variant={failing ? 'warning' : 'success'}>
            {failing ? 'Failing' : 'Active'}
          </Badge>
        ) : (
          <Badge variant="error">Disabled</Badge>
        )
      },
    },
    {
      accessorKey: 'lastStatus',
      header: 'Last code',
      cell: ({ getValue }) => {
        const code = getValue<number | null>()
        if (code === null) return <span className="text-muted-foreground">—</span>
        const ok = code >= 200 && code < 300
        return (
          <span className={cn('font-mono text-xs font-medium', !ok && 'text-destructive')}>
            {code}
          </span>
        )
      },
    },
    {
      accessorKey: 'lastFiredAt',
      header: 'Last fired',
      cell: ({ getValue }) => {
        const v = getValue<string | null>()
        return <span className="text-muted-foreground">{v ? formatRelative(v) : '—'}</span>
      },
    },
    ...(canModerate
      ? [
          {
            id: 'actions',
            cell: ({ row }: { row: { original: AdminWebhookRow } }) =>
              row.original.active ? (
                <Button
                  variant="destructive"
                  size="xs"
                  onClick={() => setToDisable(row.original)}
                >
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
      <PageHeader title="Webhooks" description="Platform-wide webhook subscriptions." />

      <FilterBar value="" onChange={() => {}} placeholder="Filter…" />

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
        description={`Disable webhook "${toDisable?.url}"? No further events will be delivered.`}
        confirmLabel="Disable"
        destructive
        onConfirm={handleDisable}
        onCancel={() => setToDisable(null)}
      />
    </div>
  )
}
