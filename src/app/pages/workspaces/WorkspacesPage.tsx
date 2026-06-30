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
import type { WorkspacePlanStatus, WorkspaceRow } from '@/lib/types'
import { useWorkspaces } from './queries'
import { StorageBar } from './components/StorageBar'
import { WorkspaceDetailSheet } from './components/WorkspaceDetailSheet'

const LIMIT = 20

const STATUS_VARIANT: Record<WorkspacePlanStatus, 'success' | 'warning' | 'error' | 'secondary'> = {
  active: 'success',
  past_due: 'warning',
  suspended: 'error',
  trialing: 'secondary',
}

export function WorkspacesPage() {
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [selected, setSelected] = useState<WorkspaceRow | null>(null)

  const { data, isLoading } = useWorkspaces({
    page,
    limit: LIMIT,
    q: q || undefined,
    status: status || undefined,
  })

  const columns: ColumnDef<WorkspaceRow>[] = [
    {
      accessorKey: 'name',
      header: 'Workspace',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          <p className="text-xs text-muted-foreground">/{row.original.slug}</p>
        </div>
      ),
    },
    {
      accessorKey: 'ownerEmail',
      header: 'Owner',
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const s = getValue<WorkspacePlanStatus>()
        return <Badge variant={STATUS_VARIANT[s]} className="capitalize">{s.replace('_', ' ')}</Badge>
      },
    },
    {
      accessorKey: 'planKey',
      header: 'Plan',
      cell: ({ getValue }) => (
        <Badge variant="outline" className="capitalize">{getValue<string>()}</Badge>
      ),
    },
    {
      accessorKey: 'memberCount',
      header: 'Members',
      cell: ({ getValue }) => <span className="tabular-nums">{getValue<number>()}</span>,
    },
    {
      accessorKey: 'projectCount',
      header: 'Projects',
      cell: ({ getValue }) => <span className="tabular-nums">{getValue<number>()}</span>,
    },
    {
      accessorKey: 'storageUsedMb',
      header: 'Storage',
      cell: ({ row }) => (
        <StorageBar usedMb={row.original.storageUsedMb} capMb={100} />
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">{formatDate(getValue<string>())}</span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button variant="ghost" size="xs" onClick={() => setSelected(row.original)}>
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
      <PageHeader title="Workspaces" description="All workspaces across the platform." />

      <FilterBar
        value={q}
        onChange={(v) => { setQ(v); setPage(1) }}
        placeholder="Search by name or slug…"
      >
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="h-9 rounded-md border bg-background px-3 text-sm outline-none ring-ring focus:ring-1"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="past_due">Past due</option>
          <option value="suspended">Suspended</option>
          <option value="trialing">Trialing</option>
        </select>
      </FilterBar>

      <DataTable
        table={table}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No workspaces found."
      />

      <Pagination
        page={page}
        total={data?.total ?? 0}
        limit={LIMIT}
        onPage={setPage}
      />

      <WorkspaceDetailSheet workspace={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
