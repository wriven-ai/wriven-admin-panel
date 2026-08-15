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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { formatDate } from '@/lib/format'
import type { AdminContentTypeRow } from '@/lib/types'
import { useContentTypes } from '@/app/pages/workspaces/queries'

const LIMIT = 10

interface ScopeProps {
  workspaceId?: string
  projectId?: string
}

export function ContentTypesTab({ workspaceId, projectId }: ScopeProps) {
  const [page, setPage] = useState(1)
  const [sorting, setSorting] = useState<SortingState>([])
  const [selected, setSelected] = useState<AdminContentTypeRow | null>(null)

  const { data, isLoading } = useContentTypes({ page, limit: LIMIT, workspaceId, projectId })

  const columns: ColumnDef<AdminContentTypeRow>[] = [
    {
      accessorKey: 'name',
      header: 'Content type',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          <p className="font-mono text-xs text-muted-foreground">{row.original.apiId}</p>
        </div>
      ),
    },
    {
      accessorKey: 'fields',
      header: 'Fields',
      cell: ({ getValue }) => (
        <span className="tabular-nums">{getValue<AdminContentTypeRow['fields']>().length}</span>
      ),
    },
    {
      accessorKey: 'updatedAt',
      header: 'Updated',
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
        emptyMessage="No content types found."
        getRowClassName={() => 'cursor-pointer'}
        onRowClick={(row) => setSelected(row)}
      />
      <Pagination page={page} total={data?.total ?? 0} limit={LIMIT} onPage={setPage} />

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.name}</SheetTitle>
                <SheetDescription className="font-mono">{selected.apiId}</SheetDescription>
              </SheetHeader>
              <div className="space-y-4 px-4 pb-6">
                <section className="space-y-2">
                  <h3 className="text-2xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Fields ({selected.fields.length})
                  </h3>
                  <ul className="space-y-1.5">
                    {selected.fields.map((f) => (
                      <li
                        key={f.key}
                        className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                      >
                        <div>
                          <p className="font-medium">{f.label}</p>
                          <p className="font-mono text-2xs text-muted-foreground">{f.key}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {f.required && <Badge variant="secondary">required</Badge>}
                          {f.multiple && <Badge variant="outline">multiple</Badge>}
                          <Badge variant="outline">{f.type}</Badge>
                        </div>
                      </li>
                    ))}
                    {selected.fields.length === 0 && (
                      <p className="text-sm text-muted-foreground">No fields defined.</p>
                    )}
                  </ul>
                </section>
                <p className="text-2xs text-muted-foreground">
                  Created {formatDate(selected.createdAt)} · Updated {formatDate(selected.updatedAt)}
                </p>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
