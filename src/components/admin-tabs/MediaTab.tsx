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
import { formatBytes, formatRelative } from '@/lib/format'
import { useAdminStore } from '@/stores/admin'
import type { AdminMediaRow } from '@/lib/types'
import { useMediaAssets, useWorkspaceStorage, usePurgeMedia } from '@/app/pages/media/queries'

const LIMIT = 10

interface ScopeProps {
  workspaceId?: string
  projectId?: string
}

export function MediaTab({ workspaceId, projectId }: ScopeProps) {
  const role = useAdminStore((s) => s.me?.role)
  const [page, setPage] = useState(1)
  const [sorting, setSorting] = useState<SortingState>([])
  const [toPurge, setToPurge] = useState<AdminMediaRow | null>(null)

  const { data, isLoading } = useMediaAssets({ page, limit: LIMIT, workspaceId, projectId })
  const { data: usage } = useWorkspaceStorage()
  const purge = usePurgeMedia()

  const canModerate = role === 'admin' || role === 'moderator'
  // Media usage is reported per workspace — only shown in workspace scope.
  const wsUsage = workspaceId ? usage?.find((u) => u.workspaceId === workspaceId) : undefined

  const columns: ColumnDef<AdminMediaRow>[] = [
    {
      accessorKey: 'originalFilename',
      header: 'File',
      cell: ({ row }) => (
        <div>
          <p className="max-w-xs truncate font-mono text-xs">
            {row.original.originalFilename ?? row.original.id}
          </p>
          <p className="text-xs text-muted-foreground">{row.original.mime ?? row.original.kind}</p>
        </div>
      ),
    },
    {
      accessorKey: 'kind',
      header: 'Kind',
      cell: ({ getValue }) => (
        <Badge variant="outline" className="capitalize">{getValue<string>()}</Badge>
      ),
    },
    {
      accessorKey: 'sizeBytes',
      header: 'Size',
      cell: ({ getValue }) => {
        const v = getValue<number | null>()
        return <span className="tabular-nums">{v != null ? formatBytes(v) : '—'}</span>
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Uploaded',
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">{formatRelative(getValue<string>())}</span>
      ),
    },
    ...(canModerate
      ? [
          {
            id: 'actions',
            cell: ({ row }: { row: { original: AdminMediaRow } }) => (
              <Button variant="destructive" size="xs" onClick={() => setToPurge(row.original)}>
                Purge
              </Button>
            ),
          } satisfies ColumnDef<AdminMediaRow>,
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

  async function handlePurge() {
    if (!toPurge) return
    await purge.mutateAsync(toPurge.id)
    toast.success('File purged.')
    setToPurge(null)
  }

  return (
    <div className="space-y-4">
      {wsUsage && (
        <div className="flex items-center gap-4 rounded-lg border bg-card px-4 py-3 text-sm">
          <span className="font-medium">Storage</span>
          <span className="tabular-nums">{formatBytes(wsUsage.totalBytes)}</span>
          <span className="text-xs text-muted-foreground">{wsUsage.assetCount} files</span>
        </div>
      )}

      <DataTable
        table={table}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No media assets found."
      />
      <Pagination page={page} total={data?.total ?? 0} limit={LIMIT} onPage={setPage} />

      <ConfirmDialog
        open={Boolean(toPurge)}
        title="Purge file"
        description={`Permanently delete "${toPurge?.originalFilename ?? toPurge?.id}" from storage. Cannot be undone.`}
        confirmLabel="Purge"
        destructive
        onConfirm={handlePurge}
        onCancel={() => setToPurge(null)}
      />
    </div>
  )
}
