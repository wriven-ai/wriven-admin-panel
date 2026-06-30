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
import { formatRelative } from '@/lib/format'
import { useAdminStore } from '@/stores/admin'
import type { AdminApiKeyRow } from '@/lib/types'
import { useApiKeys, useRevokeApiKey } from './queries'

const LIMIT = 20

export function ApiKeysPage() {
  const role = useAdminStore((s) => s.me?.role)
  const [page, setPage] = useState(1)
  const [sorting, setSorting] = useState<SortingState>([])
  const [toRevoke, setToRevoke] = useState<AdminApiKeyRow | null>(null)

  const { data, isLoading } = useApiKeys({ page, limit: LIMIT })

  const revokeKey = useRevokeApiKey()
  const canModerate = role === 'admin' || role === 'moderator'

  const columns: ColumnDef<AdminApiKeyRow>[] = [
    {
      accessorKey: 'prefix',
      header: 'Key',
      cell: ({ row }) => (
        <div>
          <p className="font-mono text-xs">{row.original.prefix}…</p>
          <p className="text-xs text-muted-foreground">{row.original.name}</p>
        </div>
      ),
    },
    {
      accessorKey: 'scope',
      header: 'Scope',
      cell: ({ getValue }) => (
        <Badge variant="outline" className="capitalize">{getValue<string>()}</Badge>
      ),
    },
    {
      accessorKey: 'revokedAt',
      header: 'Status',
      cell: ({ getValue }) =>
        getValue<string | null>() !== null ? (
          <Badge variant="error">Revoked</Badge>
        ) : (
          <Badge variant="success">Active</Badge>
        ),
    },
    {
      accessorKey: 'lastUsedAt',
      header: 'Last used',
      cell: ({ getValue }) => {
        const v = getValue<string | null>()
        return (
          <span className="text-muted-foreground">
            {v ? formatRelative(v) : '—'}
          </span>
        )
      },
    },
    ...(canModerate
      ? [
          {
            id: 'actions',
            cell: ({ row }: { row: { original: AdminApiKeyRow } }) =>
              row.original.revokedAt === null ? (
                <Button
                  variant="destructive"
                  size="xs"
                  onClick={() => setToRevoke(row.original)}
                >
                  Revoke
                </Button>
              ) : null,
          } satisfies ColumnDef<AdminApiKeyRow>,
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

  async function handleRevoke() {
    if (!toRevoke) return
    await revokeKey.mutateAsync(toRevoke.id)
    toast.success('API key revoked.')
    setToRevoke(null)
  }

  return (
    <div className="space-y-4">
      <PageHeader title="API Keys" description="Platform-wide key oversight. Raw tokens are never shown." />

      <FilterBar value="" onChange={() => {}} placeholder="Filter…" />

      <DataTable
        table={table}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No API keys found."
      />

      <Pagination page={page} total={data?.total ?? 0} limit={LIMIT} onPage={setPage} />

      <ConfirmDialog
        open={Boolean(toRevoke)}
        title="Revoke API key"
        description={`Revoke key ${toRevoke?.prefix}…? Requests using this key will fail immediately.`}
        confirmLabel="Revoke"
        destructive
        onConfirm={handleRevoke}
        onCancel={() => setToRevoke(null)}
      />
    </div>
  )
}
