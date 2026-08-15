import { useReactTable, getCoreRowModel, type ColumnDef } from '@tanstack/react-table'
import { useNavigate } from 'react-router'
import { Badge } from '@/components/ui/Badge'
import { DataTable } from '@/components/data-table/DataTable'
import type { AdminUserDetail } from '@/lib/types'

export function WorkspacesTab({ workspaces }: { workspaces: AdminUserDetail['workspaces'] }) {
  const navigate = useNavigate()

  const columns: ColumnDef<AdminUserDetail['workspaces'][number]>[] = [
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
      accessorKey: 'role',
      header: 'Role',
      cell: ({ getValue }) => (
        <Badge variant="outline" className="capitalize">{getValue<string>()}</Badge>
      ),
    },
  ]

  const table = useReactTable({
    data: workspaces,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <DataTable
      table={table}
      columns={columns}
      emptyMessage="This user is not a member of any workspace."
      getRowClassName={() => 'cursor-pointer'}
      onRowClick={(row) => navigate(`/workspaces/${row.id}`)}
    />
  )
}
