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
import { StorageBar } from '@/app/pages/workspaces/components/StorageBar'
import { formatBytes, formatRelative } from '@/lib/format'
import { useAdminStore } from '@/stores/admin'
import type { MediaAsset, MediaKind } from '@/lib/types'
import { useMediaAssets, useWorkspaceStorage, usePurgeMedia } from './queries'

const LIMIT = 20
const KIND_LABEL: Record<MediaKind, string> = { image: 'Image', video: 'Video', file: 'File' }

export function MediaPage() {
  const role = useAdminStore((s) => s.me?.role)
  const [page, setPage] = useState(1)
  const [kind, setKind] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [toPurge, setToPurge] = useState<MediaAsset | null>(null)

  const { data, isLoading } = useMediaAssets({ page, limit: LIMIT, kind: kind || undefined })
  const { data: storage } = useWorkspaceStorage()
  const purge = usePurgeMedia()

  const canModerate = role === 'admin' || role === 'moderator'

  const columns: ColumnDef<MediaAsset>[] = [
    {
      accessorKey: 'key',
      header: 'File',
      cell: ({ row }) => (
        <div>
          <p className="max-w-xs truncate font-mono text-xs">{row.original.key}</p>
          <p className="text-xs text-muted-foreground">{row.original.workspaceName}</p>
        </div>
      ),
    },
    {
      accessorKey: 'kind',
      header: 'Kind',
      cell: ({ getValue }) => (
        <Badge variant="outline">{KIND_LABEL[getValue<MediaKind>()]}</Badge>
      ),
    },
    {
      accessorKey: 'sizeBytes',
      header: 'Size',
      cell: ({ getValue }) => (
        <span className="tabular-nums">{formatBytes(getValue<number>())}</span>
      ),
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
            cell: ({ row }: { row: { original: MediaAsset } }) => (
              <Button
                variant="destructive"
                size="xs"
                onClick={() => setToPurge(row.original)}
              >
                Purge
              </Button>
            ),
          } satisfies ColumnDef<MediaAsset>,
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

  async function handlePurge(reason?: string) {
    if (!toPurge || !reason) return
    await purge.mutateAsync({ id: toPurge.id, reason })
    toast.success('File purged.')
    setToPurge(null)
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Media" description="Storage usage and file oversight." />

      {storage && storage.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <p className="mb-3 text-sm font-medium">Storage by workspace</p>
          <div className="space-y-3">
            {storage
              .sort((a, b) => b.usedBytes - a.usedBytes)
              .slice(0, 8)
              .map((ws) => (
                <div key={ws.workspaceId} className="flex items-center gap-4">
                  <span className="w-40 truncate text-xs">{ws.workspaceName}</span>
                  <div className="flex-1">
                    <StorageBar
                      usedMb={ws.usedBytes / 1024 / 1024}
                      capMb={ws.capBytes / 1024 / 1024}
                    />
                  </div>
                  <span className="w-16 text-right text-xs text-muted-foreground">
                    {ws.fileCount} files
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      <FilterBar value="" onChange={() => {}} placeholder="Filter by workspace…">
        <select
          value={kind}
          onChange={(e) => { setKind(e.target.value); setPage(1) }}
          className="h-9 rounded-md border bg-background px-3 text-sm outline-none ring-ring focus:ring-1"
        >
          <option value="">All types</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
          <option value="file">Files</option>
        </select>
      </FilterBar>

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
        description={`Permanently delete "${toPurge?.key}" from R2 storage. Cannot be undone.`}
        confirmLabel="Purge"
        destructive
        reasonLabel="Reason (required)"
        onConfirm={handlePurge}
        onCancel={() => setToPurge(null)}
      />
    </div>
  )
}
