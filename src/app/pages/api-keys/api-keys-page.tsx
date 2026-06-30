import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
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
import type { ApiKeyRow, ApiKeyScope } from '@/lib/types'
import { useApiKeys, useRevokeApiKey } from './queries'

const LIMIT = 20
const SCOPE_VARIANT: Record<ApiKeyScope, 'default' | 'secondary' | 'outline'> = {
  manage: 'default',
  preview: 'secondary',
  read: 'outline',
}

export function ApiKeysPage() {
  const role = useAdminStore((s) => s.me?.role)
  const [page, setPage] = useState(1)
  const [revoked, setRevoked] = useState<boolean | undefined>()
  const [scope, setScope] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [toRevoke, setToRevoke] = useState<ApiKeyRow | null>(null)

  const { data, isLoading } = useApiKeys({
    page,
    limit: LIMIT,
    revoked,
    scope: scope || undefined,
  })

  const revokeKey = useRevokeApiKey()
  const canModerate = role === 'admin' || role === 'moderator'

  const columns: ColumnDef<ApiKeyRow>[] = [
    {
      accessorKey: 'prefix',
      header: 'Key',
      cell: ({ row }) => (
        <div>
          <p className="font-mono text-xs">{row.original.prefix}…</p>
          <p className="text-xs text-muted-foreground">{row.original.workspaceName}</p>
        </div>
      ),
    },
    {
      accessorKey: 'scope',
      header: 'Scope',
      cell: ({ getValue }) => {
        const s = getValue<ApiKeyScope>()
        return <Badge variant={SCOPE_VARIANT[s]} className="capitalize">{s}</Badge>
      },
    },
    {
      accessorKey: 'projectName',
      header: 'Project',
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: 'revoked',
      header: 'Status',
      cell: ({ getValue }) =>
        getValue<boolean>() ? (
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
            cell: ({ row }: { row: { original: ApiKeyRow } }) =>
              !row.original.revoked ? (
                <Button
                  variant="destructive"
                  size="xs"
                  onClick={() => setToRevoke(row.original)}
                >
                  Revoke
                </Button>
              ) : null,
          } satisfies ColumnDef<ApiKeyRow>,
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

  async function handleRevoke(reason?: string) {
    if (!toRevoke || !reason) return
    await revokeKey.mutateAsync({ id: toRevoke.id, reason })
    toast.success('API key revoked.')
    setToRevoke(null)
  }

  return (
    <div className="space-y-4">
      <PageHeader title="API Keys" description="Platform-wide key oversight. Raw tokens are never shown." />

      <FilterBar value="" onChange={() => {}}>
        <select
          value={revoked === undefined ? '' : String(revoked)}
          onChange={(e) => {
            setRevoked(e.target.value === '' ? undefined : e.target.value === 'true')
            setPage(1)
          }}
          className="h-9 rounded-md border bg-background px-3 text-sm outline-none ring-ring focus:ring-1"
        >
          <option value="">All keys</option>
          <option value="false">Active</option>
          <option value="true">Revoked</option>
        </select>
        <select
          value={scope}
          onChange={(e) => { setScope(e.target.value); setPage(1) }}
          className="h-9 rounded-md border bg-background px-3 text-sm outline-none ring-ring focus:ring-1"
        >
          <option value="">All scopes</option>
          <option value="read">Read</option>
          <option value="preview">Preview</option>
          <option value="manage">Manage</option>
        </select>
      </FilterBar>

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
        description={`Revoke key ${toRevoke?.prefix}…? Any requests using this key will fail immediately.`}
        confirmLabel="Revoke"
        destructive
        reasonLabel="Reason (required)"
        onConfirm={handleRevoke}
        onCancel={() => setToRevoke(null)}
      />
    </div>
  )
}
