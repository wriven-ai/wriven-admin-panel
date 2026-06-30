import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable } from '@/components/data-table/DataTable'
import { FilterBar } from '@/components/data-table/FilterBar'
import { Pagination } from '@/components/data-table/Pagination'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/format'
import type { AdminUserRow } from '@/lib/types'
import { useUsers } from './queries'
import { UserDetailSheet } from './components/UserDetailSheet'

const LIMIT = 20

export function UsersPage() {
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [suspended, setSuspended] = useState<boolean | undefined>()
  const [sorting, setSorting] = useState<SortingState>([])
  const [selected, setSelected] = useState<AdminUserRow | null>(null)

  const { data, isLoading } = useUsers({ page, limit: LIMIT, q: q || undefined, suspended })

  const columns: ColumnDef<AdminUserRow>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          <p className="text-xs text-muted-foreground">{row.original.email}</p>
        </div>
      ),
    },
    {
      accessorKey: 'provider',
      header: 'Provider',
      cell: ({ getValue }) => (
        <Badge variant="outline" className="capitalize">{getValue<string>()}</Badge>
      ),
    },
    {
      accessorKey: 'emailVerified',
      header: 'Verified',
      cell: ({ getValue }) =>
        getValue<boolean>() ? (
          <Badge variant="success">Yes</Badge>
        ) : (
          <Badge variant="warning">No</Badge>
        ),
    },
    {
      accessorKey: 'suspended',
      header: 'Status',
      cell: ({ getValue }) =>
        getValue<boolean>() ? (
          <Badge variant="error">Suspended</Badge>
        ) : (
          <Badge variant="success">Active</Badge>
        ),
    },
    {
      accessorKey: 'workspaceCount',
      header: 'Workspaces',
      cell: ({ getValue }) => (
        <span className="tabular-nums">{getValue<number>()}</span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Joined',
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">{formatDate(getValue<string>())}</span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="xs"
          onClick={() => setSelected(row.original)}
        >
          View
        </Button>
      ),
    },
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

  return (
    <div className="space-y-4">
      <PageHeader title="Users" description="All tenant users across workspaces." />

      <FilterBar
        value={q}
        onChange={(v) => { setQ(v); setPage(1) }}
        placeholder="Search by name or email…"
      >
        <select
          value={suspended === undefined ? '' : String(suspended)}
          onChange={(e) => {
            setSuspended(e.target.value === '' ? undefined : e.target.value === 'true')
            setPage(1)
          }}
          className="h-9 rounded-md border bg-background px-3 text-sm outline-none ring-ring focus:ring-1"
        >
          <option value="">All users</option>
          <option value="false">Active</option>
          <option value="true">Suspended</option>
        </select>
      </FilterBar>

      <DataTable
        table={table}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No users found."
      />

      <Pagination
        page={page}
        total={data?.total ?? 0}
        limit={LIMIT}
        onPage={setPage}
      />

      <UserDetailSheet user={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
