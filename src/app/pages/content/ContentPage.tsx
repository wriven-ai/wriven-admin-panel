import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable } from '@/components/data-table/DataTable'
import { FilterBar } from '@/components/data-table/FilterBar'
import { Pagination } from '@/components/data-table/Pagination'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { formatDate } from '@/lib/format'
import { useAdminStore } from '@/stores/admin'
import type { AdminEntryRow } from '@/lib/types'
import { useContent, useTakedownContent } from './queries'

const LIMIT = 20

const STATUS_VARIANT = {
  published: 'success',
  draft: 'secondary',
  archived: 'error',
} as const

export function ContentPage() {
  const role = useAdminStore((s) => s.me?.role)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [toTakedown, setToTakedown] = useState<AdminEntryRow | null>(null)

  const { data, isLoading } = useContent({
    page,
    limit: LIMIT,
    status: status || undefined,
  })

  const takedown = useTakedownContent()
  const canModerate = role === 'admin' || role === 'moderator'

  const columns: ColumnDef<AdminEntryRow>[] = [
    {
      accessorKey: 'slug',
      header: 'Entry',
      cell: ({ row }) => (
        <div>
          <p className="font-mono text-xs font-medium">{row.original.slug}</p>
          <p className="text-xs text-muted-foreground">type: {row.original.contentTypeId}</p>
        </div>
      ),
    },
    {
      accessorKey: 'workspaceId',
      header: 'Workspace',
      cell: ({ row }) => (
        <div>
          <p className="font-mono text-xs">{row.original.workspaceId}</p>
          <p className="text-xs text-muted-foreground">{row.original.projectId}</p>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const s = getValue<'draft' | 'published' | 'archived'>()
        return <Badge variant={STATUS_VARIANT[s]} className="capitalize">{s}</Badge>
      },
    },
    {
      accessorKey: 'updatedAt',
      header: 'Updated',
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">{formatDate(getValue<string>())}</span>
      ),
    },
    ...(canModerate
      ? [
          {
            id: 'actions',
            cell: ({ row }: { row: { original: AdminEntryRow } }) =>
              row.original.status !== 'archived' ? (
                <Button
                  variant="destructive"
                  size="xs"
                  onClick={() => setToTakedown(row.original)}
                >
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
    toast.success('Entry taken down.')
    setToTakedown(null)
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Content" description="Global content moderation browser." />

      <FilterBar>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-1"
        >
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </FilterBar>

      <DataTable
        table={table}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No content entries found."
      />

      <Pagination page={page} total={data?.total ?? 0} limit={LIMIT} onPage={setPage} />

      <ConfirmDialog
        open={Boolean(toTakedown)}
        title="Take down entry"
        description={`Archive "${toTakedown?.slug}"? Entry will be removed from public access.`}
        confirmLabel="Take down"
        destructive
        onConfirm={handleTakedown}
        onCancel={() => setToTakedown(null)}
      />
    </div>
  )
}
