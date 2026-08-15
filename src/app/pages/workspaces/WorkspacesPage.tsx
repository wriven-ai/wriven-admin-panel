import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable } from '@/components/data-table/DataTable'
import { FilterBar } from '@/components/data-table/FilterBar'
import { Pagination } from '@/components/data-table/Pagination'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/format'
import type { AdminWorkspaceRow } from '@/lib/types'
import { useWorkspaces } from './queries'

const LIMIT = 20

function statusVariant(s: string | null) {
  if (s === 'active') return 'success' as const
  if (s === 'past_due') return 'warning' as const
  if (s === 'canceled' || s === 'paused') return 'error' as const
  if (s === 'trialing') return 'secondary' as const
  return 'outline' as const
}

export function WorkspacesPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])

  const { data, isLoading } = useWorkspaces({ page, limit: LIMIT, q: q || undefined })

  const columns: ColumnDef<AdminWorkspaceRow>[] = [
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
        <span className="text-sm text-muted-foreground">{getValue<string | null>() ?? '—'}</span>
      ),
    },
    {
      accessorKey: 'subscriptionStatus',
      header: 'Status',
      cell: ({ getValue }) => {
        const s = getValue<string | null>()
        return <Badge variant={statusVariant(s)}>{s?.replace('_', ' ') ?? '—'}</Badge>
      },
    },
    {
      accessorKey: 'planKey',
      header: 'Plan',
      cell: ({ getValue }) => {
        const v = getValue<string | null>()
        return v ? <Badge variant="outline">{v}</Badge> : <span className="text-muted-foreground">—</span>
      },
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
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">{formatDate(getValue<string>())}</span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button variant="ghost" size="xs" onClick={() => navigate(`/workspaces/${row.original.id}`)}>
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
      />

      <DataTable
        table={table}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No workspaces found."
        getRowClassName={() => 'cursor-pointer'}
        onRowClick={(row) => navigate(`/workspaces/${row.id}`)}
      />

      <Pagination
        page={page}
        total={data?.total ?? 0}
        limit={LIMIT}
        onPage={setPage}
      />
    </div>
  )
}
