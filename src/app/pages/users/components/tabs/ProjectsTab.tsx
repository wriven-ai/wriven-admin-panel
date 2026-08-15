import { useReactTable, getCoreRowModel, type ColumnDef } from '@tanstack/react-table'
import { useNavigate } from 'react-router'
import { Badge } from '@/components/ui/Badge'
import { DataTable } from '@/components/data-table/DataTable'
import type { AdminUserDetail } from '@/lib/types'

export function ProjectsTab({ projects }: { projects: AdminUserDetail['projects'] }) {
  const navigate = useNavigate()

  const columns: ColumnDef<AdminUserDetail['projects'][number]>[] = [
    {
      accessorKey: 'name',
      header: 'Project',
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: 'workspaceId',
      header: 'Workspace',
      cell: ({ getValue }) => (
        <span className="font-mono text-2xs text-muted-foreground">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ getValue }) => (
        <Badge variant="outline" className="capitalize">{getValue<string>()}</Badge>
      ),
    },
  ]

  const table = useReactTable({
    data: projects,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <DataTable
      table={table}
      columns={columns}
      emptyMessage="This user is not a member of any project."
      getRowClassName={() => 'cursor-pointer'}
      onRowClick={(row) => navigate(`/projects/${row.id}`)}
    />
  )
}
