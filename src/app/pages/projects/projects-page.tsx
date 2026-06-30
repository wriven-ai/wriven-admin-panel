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
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { formatDate } from '@/lib/format'
import { useAdminStore } from '@/stores/admin'
import type { ProjectRow } from '@/lib/types'
import { useProjects, useDeleteProject } from './queries'

const LIMIT = 20

export function ProjectsPage() {
  const role = useAdminStore((s) => s.me?.role)
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [toDelete, setToDelete] = useState<ProjectRow | null>(null)

  const { data, isLoading } = useProjects({ page, limit: LIMIT, q: q || undefined })
  const deleteProject = useDeleteProject()

  const canDelete = role === 'admin'

  const columns: ColumnDef<ProjectRow>[] = [
    {
      accessorKey: 'name',
      header: 'Project',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          <p className="text-xs text-muted-foreground">{row.original.workspaceName}</p>
        </div>
      ),
    },
    {
      accessorKey: 'createdByEmail',
      header: 'Created by',
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: 'typeCount',
      header: 'Types',
      cell: ({ getValue }) => <span className="tabular-nums">{getValue<number>()}</span>,
    },
    {
      accessorKey: 'entryCount',
      header: 'Entries',
      cell: ({ getValue }) => <span className="tabular-nums">{getValue<number>()}</span>,
    },
    {
      accessorKey: 'keyCount',
      header: 'API Keys',
      cell: ({ getValue }) => <span className="tabular-nums">{getValue<number>()}</span>,
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
            cell: ({ row }: { row: { original: ProjectRow } }) => (
              <Button
                variant="destructive"
                size="xs"
                onClick={() => setToDelete(row.original)}
              >
                Delete
              </Button>
            ),
          } satisfies ColumnDef<ProjectRow>,
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

  async function handleDelete(reason?: string) {
    if (!toDelete || !reason) return
    await deleteProject.mutateAsync({ id: toDelete.id, reason })
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
        reasonLabel="Reason (required)"
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}
