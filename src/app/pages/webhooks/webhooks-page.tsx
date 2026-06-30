import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/layout/page-header'
import { DataTable } from '@/components/data-table/data-table'
import { FilterBar } from '@/components/data-table/filter-bar'
import { Pagination } from '@/components/data-table/pagination'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { formatRelative } from '@/lib/format'
import { useAdminStore } from '@/stores/admin'
import { cn } from '@/lib/utils'
import type { WebhookRow } from '@/lib/types'
import { useWebhooks, useDisableWebhook } from './queries'

const LIMIT = 20

function isFailingWebhook(w: WebhookRow) {
  return w.lastStatusCode !== null && (w.lastStatusCode < 200 || w.lastStatusCode >= 300)
}

export function WebhooksPage() {
  const role = useAdminStore((s) => s.me?.role)
  const [page, setPage] = useState(1)
  const [failingOnly, setFailingOnly] = useState(false)
  const [sorting, setSorting] = useState<SortingState>([])
  const [toDisable, setToDisable] = useState<WebhookRow | null>(null)

  const { data, isLoading } = useWebhooks({
    page,
    limit: LIMIT,
    failing: failingOnly || undefined,
  })

  const disable = useDisableWebhook()
  const canModerate = role === 'admin' || role === 'moderator'

  const columns: ColumnDef<WebhookRow>[] = [
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
            <p className="text-xs text-muted-foreground">{row.original.workspaceName}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'projectName',
      header: 'Project',
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">{getValue<string>()}</span>
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
      accessorKey: 'lastStatusCode',
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
            cell: ({ row }: { row: { original: WebhookRow } }) =>
              row.original.active ? (
                <Button
                  variant="destructive"
                  size="xs"
                  onClick={() => setToDisable(row.original)}
                >
                  Disable
                </Button>
              ) : null,
          } satisfies ColumnDef<WebhookRow>,
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

  async function handleDisable(reason?: string) {
    if (!toDisable || !reason) return
    await disable.mutateAsync({ id: toDisable.id, reason })
    toast.success('Webhook disabled.')
    setToDisable(null)
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Webhooks" description="Platform-wide webhook subscriptions." />

      <FilterBar value="" onChange={() => {}}>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={failingOnly}
            onChange={(e) => { setFailingOnly(e.target.checked); setPage(1) }}
            className="rounded border-border"
          />
          Failing only
        </label>
      </FilterBar>

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
        description={`Disable webhook for "${toDisable?.url}"? No further events will be delivered.`}
        confirmLabel="Disable"
        destructive
        reasonLabel="Reason (required)"
        onConfirm={handleDisable}
        onCancel={() => setToDisable(null)}
      />
    </div>
  )
}
