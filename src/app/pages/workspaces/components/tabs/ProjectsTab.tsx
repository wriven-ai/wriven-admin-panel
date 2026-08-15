import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { DataTable } from '@/components/data-table/DataTable'
import { FilterBar } from '@/components/data-table/FilterBar'
import { Pagination } from '@/components/data-table/Pagination'
import { Badge } from '@/components/ui/Badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { formatDate } from '@/lib/format'
import type { AdminProjectRow } from '@/lib/types'
import { useProjects, useProjectDetail } from '../../../projects/queries'

const LIMIT = 10

function CopyId({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      onClick={() => {
        navigator.clipboard.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
    >
      <span className="font-mono">{value}</span>
      {copied ? (
        <Check className="h-3 w-3 text-status-success" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </button>
  )
}

export function ProjectsTab({ workspaceId }: { workspaceId: string }) {
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data, isLoading } = useProjects({
    page,
    limit: LIMIT,
    workspaceId,
    q: q || undefined,
  })
  const { data: project } = useProjectDetail(selectedId ?? '')

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
        onRowClick={(row) => setSelectedId(row.id)}
      />
      <Pagination page={page} total={data?.total ?? 0} limit={LIMIT} onPage={setPage} />

      <Sheet open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          {project && (
            <>
              <SheetHeader>
                <SheetTitle>{project.name}</SheetTitle>
                <SheetDescription className="font-mono">/{project.slug}</SheetDescription>
              </SheetHeader>
              <div className="space-y-4 px-4 pb-6">
                <div className="flex items-center gap-2">
                  {project.deleted ? (
                    <Badge variant="error">Deleted</Badge>
                  ) : (
                    <Badge variant="success">Active</Badge>
                  )}
                  {project.workspaceName && (
                    <Badge variant="outline">{project.workspaceName}</Badge>
                  )}
                </div>

                <section className="space-y-2">
                  <h3 className="text-2xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Identifiers
                  </h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-xs text-muted-foreground">Project ID</dt>
                      <dd><CopyId value={project.id} /></dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-xs text-muted-foreground">Workspace ID</dt>
                      <dd><CopyId value={project.workspaceId} /></dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-xs text-muted-foreground">Created by</dt>
                      <dd><CopyId value={project.createdBy} /></dd>
                    </div>
                  </dl>
                </section>

                <p className="text-2xs text-muted-foreground">
                  Created {formatDate(project.createdAt)}
                </p>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
