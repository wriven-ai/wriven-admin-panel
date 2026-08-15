import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'
import { DataTable } from '@/components/data-table/DataTable'
import { Pagination } from '@/components/data-table/Pagination'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/format'
import type { AdminProjectRow } from '@/lib/types'
import { useProjects } from '../../../projects/queries'

const LIMIT = 10

export function ProjectsTab({ workspaceId }: { workspaceId: string }) {
  const [page, setPage] = useState(1)
  const [sorting, setSorting] = useState<SortingState>([])

  const { data, isLoading } = useProjects({ page, limit: LIMIT, workspaceId })

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
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">{formatDate(getValue<string>())}</span>
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
      <DataTable
        table={table}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No projects in this workspace."
      />
      <Pagination page={page} total={data?.total ?? 0} limit={LIMIT} onPage={setPage} />
    </div>
  )
}
