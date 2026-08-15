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
import type { AdminApiKeyRow } from '@/lib/types'
import { useApiKeys, useRevokeApiKey } from '@/app/pages/api-keys/queries'

const LIMIT = 10

interface ScopeProps {
  workspaceId?: string
  projectId?: string
}

export function ApiKeysTab({ workspaceId, projectId }: ScopeProps) {
  const role = useAdminStore((s) => s.me?.role)
  const [page, setPage] = useState(1)
  const [sorting, setSorting] = useState<SortingState>([])
  const [toRevoke, setToRevoke] = useState<AdminApiKeyRow | null>(null)

  const { data, isLoading } = useApiKeys({ page, limit: LIMIT, workspaceId, projectId })
  const revoke = useRevokeApiKey()

  const canModerate = role === 'admin' || role === 'moderator'

  const columns: ColumnDef<AdminApiKeyRow>[] = [
    {
      accessorKey: 'name',
      header: 'Key',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          <p className="font-mono text-2xs text-muted-foreground">{row.original.prefix}…</p>
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
      accessorKey: 'lastUsedAt',
      header: 'Last used',
      cell: ({ getValue }) => {
        const v = getValue<string | null>()
        return <span className="text-muted-foreground">{v ? formatRelative(v) : 'never'}</span>
      },
    },
    {
      accessorKey: 'revokedAt',
      header: 'State',
      cell: ({ row }) =>
        row.original.revokedAt ? (
          <Badge variant="error">Revoked</Badge>
        ) : (
          <Badge variant="success">Active</Badge>
        ),
    },
    ...(canModerate
      ? [
          {
            id: 'actions',
            cell: ({ row }: { row: { original: AdminApiKeyRow } }) =>
              row.original.revokedAt ? null : (
                <Button variant="destructive" size="xs" onClick={() => setToRevoke(row.original)}>
                  Revoke
                </Button>
              ),
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
    await revoke.mutateAsync(toRevoke.id)
    toast.success('API key revoked.')
    setToRevoke(null)
  }

  return (
    <div className="space-y-4">
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
        description={`Revoke "${toRevoke?.name}"? Clients using it lose access immediately. Cannot be undone.`}
        confirmLabel="Revoke"
        destructive
        onConfirm={handleRevoke}
        onCancel={() => setToRevoke(null)}
      />
    </div>
  )
}
