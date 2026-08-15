import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'
import { toast } from 'sonner'
import { Check, Copy } from 'lucide-react'
import { DataTable } from '@/components/data-table/DataTable'
import { Pagination } from '@/components/data-table/Pagination'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { formatDateTime, formatRelative } from '@/lib/format'
import { useAdminStore } from '@/stores/admin'
import type { AdminEntryRow } from '@/lib/types'
import { useContent, useContentDetail, useTakedownContent } from '@/app/pages/content/queries'
import { useContentTypes } from '@/app/pages/workspaces/queries'
import { EntryFields } from '@/components/content/EntryFields'

interface ScopeProps {
  workspaceId?: string
  projectId?: string
}

const LIMIT = 10

function statusVariant(s: string) {
  if (s === 'published') return 'success' as const
  if (s === 'draft') return 'secondary' as const
  return 'error' as const
}

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

export function ContentTab({ workspaceId, projectId }: ScopeProps) {
  const role = useAdminStore((s) => s.me?.role)
  const [page, setPage] = useState(1)
  const [sorting, setSorting] = useState<SortingState>([])
  const [toTakedown, setToTakedown] = useState<AdminEntryRow | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data, isLoading } = useContent({ page, limit: LIMIT, workspaceId, projectId })
  const { data: entry } = useContentDetail(selectedId ?? '')
  // Field defs for the selected entry's content type (scoped to its workspace).
  const { data: ctPage } = useContentTypes({
    page: 1,
    limit: 100,
    workspaceId: entry?.workspaceId,
  })
  const contentType = ctPage?.items.find((ct) => ct.id === entry?.contentTypeId) ?? null
  const takedown = useTakedownContent()

  const canModerate = role === 'admin' || role === 'moderator'

  const columns: ColumnDef<AdminEntryRow>[] = [
    {
      accessorKey: 'slug',
      header: 'Entry',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.slug}</p>
          <p className="font-mono text-2xs text-muted-foreground truncate max-w-xs">
            {row.original.contentTypeId}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => (
        <Badge variant={statusVariant(getValue<string>())} className="capitalize">
          {getValue<string>()}
        </Badge>
      ),
    },
    {
      accessorKey: 'publishedAt',
      header: 'Published',
      cell: ({ getValue }) => {
        const v = getValue<string | null>()
        return (
          <span className="text-muted-foreground">{v ? formatRelative(v) : '—'}</span>
        )
      },
    },
    {
      accessorKey: 'updatedAt',
      header: 'Updated',
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">{formatRelative(getValue<string>())}</span>
      ),
    },
    ...(canModerate
      ? [
          {
            id: 'actions',
            cell: ({ row }: { row: { original: AdminEntryRow } }) =>
              row.original.status === 'published' ? (
                <Button
                  variant="destructive"
                  size="xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    setToTakedown(row.original)
                  }}
                >
                  Takedown
                </Button>
              ) : null,
          } satisfies ColumnDef<AdminEntryRow>,
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

  async function handleTakedown() {
    if (!toTakedown) return
    await takedown.mutateAsync(toTakedown.id)
    toast.success('Entry archived.')
    setToTakedown(null)
  }

  return (
    <div className="space-y-4">
      <DataTable
        table={table}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No content entries found."
        getRowClassName={() => 'cursor-pointer'}
        onRowClick={(row) => setSelectedId(row.id)}
      />
      <Pagination page={page} total={data?.total ?? 0} limit={LIMIT} onPage={setPage} />

      <Sheet open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
          {entry && (
            <>
              <SheetHeader>
                <SheetTitle className="font-mono">{entry.slug}</SheetTitle>
                <SheetDescription>
                  <Badge variant={statusVariant(entry.status)} className="capitalize">
                    {entry.status}
                  </Badge>
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 px-4 pb-6">
                <section className="space-y-2">
                  <h3 className="text-2xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Identifiers
                  </h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-xs text-muted-foreground">Entry ID</dt>
                      <dd><CopyId value={entry.id} /></dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-xs text-muted-foreground">Content type</dt>
                      <dd><CopyId value={entry.contentTypeId} /></dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-xs text-muted-foreground">Project</dt>
                      <dd><CopyId value={entry.projectId} /></dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-xs text-muted-foreground">Author</dt>
                      <dd><CopyId value={entry.authorId} /></dd>
                    </div>
                  </dl>
                </section>

                <section className="space-y-3">
                  <h3 className="text-2xs font-semibold tracking-wide text-muted-foreground uppercase">
                    {contentType ? `Content · ${contentType.name}` : 'Content'}
                  </h3>
                  {contentType ? (
                    <EntryFields fields={contentType.fields} data={entry.data} />
                  ) : (
                    <pre className="max-h-96 overflow-auto rounded-md bg-muted/50 p-3 font-mono text-2xs leading-relaxed">
                      {JSON.stringify(entry.data, null, 2)}
                    </pre>
                  )}
                </section>

                <p className="text-2xs text-muted-foreground">
                  Created {formatDateTime(entry.createdAt)} · Updated {formatDateTime(entry.updatedAt)}
                  {entry.publishedAt && ` · Published ${formatDateTime(entry.publishedAt)}`}
                </p>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={Boolean(toTakedown)}
        title="Archive entry"
        description={`Archive "${toTakedown?.slug}"? It is unpublished from the delivery API immediately.`}
        confirmLabel="Archive"
        destructive
        onConfirm={handleTakedown}
        onCancel={() => setToTakedown(null)}
      />
    </div>
  )
}
