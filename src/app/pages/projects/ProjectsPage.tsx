import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable } from '@/components/data-table/DataTable'
import { FilterBar } from '@/components/data-table/FilterBar'
import { Pagination } from '@/components/data-table/Pagination'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { formatDate } from '@/lib/format'
import { useAdminStore } from '@/stores/admin'
import type { AdminProjectRow } from '@/lib/types'
import { useProjects, useDeleteProject } from './queries'

const LIMIT = 20

export function ProjectsPage() {
  const role = useAdminStore((s) => s.me?.role)
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [toDelete, setToDelete] = useState<AdminProjectRow | null>(null)

  const { data, isLoading } = useProjects({ page, limit: LIMIT, q: q || undefined })
  const deleteProject = useDeleteProject()

  const canDelete = role === 'admin'

  const columns: ColumnDef<AdminProjectRow>[] = [
    {
      accessorKey: 'name',
      header: 'Project',
      cell: ({ row }) => (
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium">{row.original.name}</p>
            {row.original.deleted && <Badge variant="error">Deleted</Badge>}
          </div>
          <p className="text-xs text-muted-foreground">/{row.original.slug}</p>
        </div>
      ),
    },
    {
      accessorKey: 'workspaceName',
      header: 'Workspace',
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">{getValue<string | null>() ?? '—'}</span>
      ),
    },
    {
      accessorKey: 'createdBy',
      header: 'Created by',
      cell: ({ getValue }) => (
        <span className="font-mono text-xs text-muted-foreground truncate max-w-[120px] block">
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
    ...(canDelete
      ? [
          {
            id: 'actions',
            cell: ({ row }: { row: { original: AdminProjectRow } }) =>
              !row.original.deleted ? (
                <Button
                  variant="destructive"
                  size="xs"
                  onClick={() => setToDelete(row.original)}
                >
                  Delete
                </Button>
              ) : null,
          } satisfies ColumnDef<AdminProjectRow>,
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

  async function handleDelete() {
    if (!toDelete) return
    await deleteProject.mutateAsync(toDelete.id)
    toast.success('Project deleted.')
    setToDelete(null)
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Projects" description="Cross-workspace project oversight." />

      <FilterBar
        value={q}
        onChange={(v) => { setQ(v); setPage(1) }}
        placeholder="Search by project or workspace name…"
      />

      <DataTable
        table={table}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No projects found."
      />

      <Pagination page={page} total={data?.total ?? 0} limit={LIMIT} onPage={setPage} />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete project"
        description={`Soft-delete "${toDelete?.name}"? Content will be removed from the platform.`}
        confirmLabel="Delete"
        destructive
        requireTyping={toDelete?.name}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}
