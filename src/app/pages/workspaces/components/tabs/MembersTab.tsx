import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'
import { DataTable } from '@/components/data-table/DataTable'
import { Badge } from '@/components/ui/Badge'
import type { AdminWorkspaceDetail } from '@/lib/types'

interface MemberRow {
  userId: string
  email: string
  name: string
  role: string
}

function roleVariant(role: string) {
  if (role === 'owner') return 'default' as const
  if (role === 'admin') return 'secondary' as const
  return 'outline' as const
}

export function MembersTab({ detail }: { detail: AdminWorkspaceDetail }) {
  const [sorting, setSorting] = useState<SortingState>([])

  const columns: ColumnDef<MemberRow>[] = [
    {
      accessorKey: 'name',
      header: 'Member',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          <p className="text-xs text-muted-foreground">{row.original.email}</p>
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ getValue }) => (
        <Badge variant={roleVariant(getValue<string>())} className="capitalize">
          {getValue<string>()}
        </Badge>
      ),
    },
    {
      accessorKey: 'userId',
      header: 'User ID',
      cell: ({ getValue }) => (
        <span className="font-mono text-2xs text-muted-foreground">{getValue<string>()}</span>
      ),
    },
  ]

  const table = useReactTable({
    data: detail.members,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <DataTable
      table={table}
      columns={columns}
      emptyMessage="No members in this workspace."
    />
  )
}
