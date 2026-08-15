import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router'
import { DataTable } from '@/components/data-table/DataTable'
import { FilterBar } from '@/components/data-table/FilterBar'
import { Pagination } from '@/components/data-table/Pagination'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/format'
import type { AdminProjectRow } from '@/lib/types'
import { useProjects } from '../../../projects/queries'

const LIMIT = 10

export function ProjectsTab({ workspaceId }: { workspaceId: string }) {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])

  const { data, isLoading } = useProjects({
    page,
    limit: LIMIT,
    workspaceId,
    q: q || undefined,
  })

  const columns: ColumnDef<AdminProjectRow>[] = [
    {
      accessorKey: 'name',
      header: 'Project',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          <p className="text-xs text-muted-foreground">/{row.original.slug}</p>
        </div>
      ),
    },
    {
      accessorKey: 'deleted',
      header: 'State',
      cell: ({ getValue }) =>
        getValue<boolean>() ? (
          <Badge variant="error">Deleted</Badge>
        ) : (
          <Badge variant="success">Active</Badge>
        ),
    },
    {
      accessorKey: 'createdBy',
      header: 'Created by',
      cell: ({ getValue }) => (
        <span className="font-mono text-2xs text-muted-foreground truncate max-w-[140px] inline-block">
          {getValue<string>()}
        </span>
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
      id: 'open',
      header: '',
      cell: () => <ChevronRight className="h-4 w-4 text-muted-foreground" />,
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
      <FilterBar
        value={q}
        onChange={(v) => { setQ(v); setPage(1) }}
        placeholder="Search projects by name or slug…"
      />

      <DataTable
        table={table}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No projects in this workspace."
        getRowClassName={() => 'cursor-pointer'}
        onRowClick={(row) => navigate(`/projects/${row.id}`)}
      />
      <Pagination page={page} total={data?.total ?? 0} limit={LIMIT} onPage={setPage} />
    </div>
  )
}
