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
import type { AdminEntryRow } from '@/lib/types'
import { useContent, useTakedownContent } from '../../../content/queries'

const LIMIT = 10

function statusVariant(s: string) {
  if (s === 'published') return 'success' as const
  if (s === 'draft') return 'secondary' as const
  return 'error' as const
}

export function ContentTab({ workspaceId }: { workspaceId: string }) {
  const role = useAdminStore((s) => s.me?.role)
  const [page, setPage] = useState(1)
  const [sorting, setSorting] = useState<SortingState>([])
  const [toTakedown, setToTakedown] = useState<AdminEntryRow | null>(null)

  const { data, isLoading } = useContent({ page, limit: LIMIT, workspaceId })
  const takedown = useTakedownContent()

  const canModerate = role === 'admin' || role === 'moderator'

  const columns: ColumnDef<AdminEntryRow>[] = [
    {
      accessorKey: 'slug',
      header: 'Entry',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.slug}</p>
          <p className="font-mono text-2xs text-muted-foreground truncate max-w-xs">
            {row.original.contentTypeId}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => (
        <Badge variant={statusVariant(getValue<string>())} className="capitalize">
          {getValue<string>()}
        </Badge>
      ),
    },
    {
      accessorKey: 'publishedAt',
      header: 'Published',
      cell: ({ getValue }) => {
        const v = getValue<string | null>()
        return (
          <span className="text-muted-foreground">{v ? formatRelative(v) : '—'}</span>
        )
      },
    },
    {
      accessorKey: 'updatedAt',
      header: 'Updated',
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">{formatRelative(getValue<string>())}</span>
      ),
    },
    ...(canModerate
      ? [
          {
            id: 'actions',
            cell: ({ row }: { row: { original: AdminEntryRow } }) =>
              row.original.status === 'published' ? (
                <Button variant="destructive" size="xs" onClick={() => setToTakedown(row.original)}>
                  Takedown
                </Button>
              ) : null,
          } satisfies ColumnDef<AdminEntryRow>,
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

  async function handleTakedown() {
    if (!toTakedown) return
    await takedown.mutateAsync(toTakedown.id)
    toast.success('Entry archived.')
    setToTakedown(null)
  }

  return (
    <div className="space-y-4">
      <DataTable
        table={table}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No content entries in this workspace."
      />
      <Pagination page={page} total={data?.total ?? 0} limit={LIMIT} onPage={setPage} />

      <ConfirmDialog
        open={Boolean(toTakedown)}
        title="Archive entry"
        description={`Archive "${toTakedown?.slug}"? It is unpublished from the delivery API immediately.`}
        confirmLabel="Archive"
        destructive
        onConfirm={handleTakedown}
        onCancel={() => setToTakedown(null)}
      />
    </div>
  )
}
