import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
} from '@tanstack/react-table'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable } from '@/components/data-table/DataTable'
import { FilterBar } from '@/components/data-table/FilterBar'
import { Pagination } from '@/components/data-table/Pagination'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useAdminStore } from '@/stores/admin'
import type { AdminTicketRow, SupportStatus, SupportPriority, SupportScope } from '@/lib/types'
import { useTickets, useSupportMetrics } from './queries'
import { StatusBadge } from './components/StatusBadge'
import { PriorityBadge } from './components/PriorityBadge'
import { ScopeBadge } from './components/ScopeBadge'

const LIMIT = 25

const SCOPES: SupportScope[] = ['general', 'project', 'billing', 'account', 'technical']

type Preset = { label: string; status?: SupportStatus; priority?: SupportPriority; assignee?: string }
const PRESETS: Preset[] = [
  { label: 'Oldest open', status: 'open' },
  { label: 'Unassigned', assignee: 'unassigned' },
  { label: 'Urgent', priority: 'urgent' },
]

export function SupportQueuePage() {
  const navigate = useNavigate()
  const me = useAdminStore((s) => s.me)

  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<SupportStatus | ''>('')
  const [priority, setPriority] = useState<SupportPriority | ''>('')
  const [scope, setScope] = useState<SupportScope | ''>('')
  const [assignee, setAssignee] = useState('')

  const { data, isLoading, error } = useTickets({
    page,
    limit: LIMIT,
    q: q || undefined,
    status: status || undefined,
    priority: priority || undefined,
    scope: scope || undefined,
    assignee: assignee || undefined,
  })

  const { data: metrics } = useSupportMetrics()

  function applyPreset(preset: Preset) {
    setStatus(preset.status ?? '')
    setPriority(preset.priority ?? '')
    setAssignee(preset.assignee ?? '')
    setScope('')
    setQ('')
    setPage(1)
  }

  const columns: ColumnDef<AdminTicketRow>[] = [
    {
      accessorKey: 'number',
      header: '#',
      cell: ({ getValue }) => (
        <span className="font-mono text-xs text-muted-foreground">#{getValue<number>()}</span>
      ),
    },
    {
      accessorKey: 'subject',
      header: 'Subject',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.subject}</p>
          <p className="text-xs text-muted-foreground">{row.original.authorEmail}</p>
        </div>
      ),
    },
    {
      accessorKey: 'workspaceName',
      header: 'Workspace',
      cell: ({ getValue }) => (
        <span className="text-sm">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => <StatusBadge status={getValue<SupportStatus>()} />,
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ getValue }) => <PriorityBadge priority={getValue<SupportPriority>()} />,
    },
    {
      accessorKey: 'scopeType',
      header: 'Scope',
      cell: ({ getValue }) => <ScopeBadge scope={getValue<SupportScope>()} />,
    },
    {
      accessorKey: 'assignedAdminName',
      header: 'Assignee',
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">{getValue<string | null>() ?? '—'}</span>
      ),
    },
    {
      accessorKey: 'lastReplyAt',
      header: 'Last activity',
      cell: ({ row }) => (
        <span className={cn('text-xs', row.original.lastReplyBy === 'user' && 'font-semibold text-foreground')}>
          {row.original.lastReplyAt ? formatDate(row.original.lastReplyAt) : formatDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button variant="ghost" size="xs" onClick={() => navigate(`/support/${row.original.id}`)}>
          Open
        </Button>
      ),
    },
  ]

  const table = useReactTable({
    data: data?.items ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
  })

  return (
    <div className="space-y-4">
      <PageHeader title="Support" description="Cross-tenant ticket queue." />

      {error && (
        <p className="text-sm text-destructive">
          Failed to load tickets — {(error as Error).message}
        </p>
      )}

      {metrics && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 max-w-lg">
          <div className="rounded-lg bg-card shadow-[var(--shadow-sm)] p-4 text-center">
            <p className="text-2xl font-semibold">{metrics.open}</p>
            <p className="text-xs text-muted-foreground">Open</p>
          </div>
          <div className="rounded-lg bg-card shadow-[var(--shadow-sm)] p-4 text-center">
            <p className="text-2xl font-semibold">{metrics.unassigned}</p>
            <p className="text-xs text-muted-foreground">Unassigned</p>
          </div>
          <div className="rounded-lg bg-card shadow-[var(--shadow-sm)] p-4 text-center">
            <p className="text-2xl font-semibold">{metrics.awaitingCustomer}</p>
            <p className="text-xs text-muted-foreground">Awaiting customer</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <Button
            key={p.label}
            variant="outline"
            size="sm"
            onClick={() => applyPreset(p)}
          >
            {p.label}
          </Button>
        ))}
        {me && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setAssignee('me'); setPage(1) }}
          >
            Assigned to me
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setStatus(''); setPriority(''); setScope(''); setAssignee(''); setQ(''); setPage(1)
          }}
        >
          Clear filters
        </Button>
      </div>

      <FilterBar
        value={q}
        onChange={(v) => { setQ(v); setPage(1) }}
        placeholder="Search subject, #number, email…"
      >
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value as SupportStatus | ''); setPage(1) }}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-1"
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>

        <select
          value={priority}
          onChange={(e) => { setPriority(e.target.value as SupportPriority | ''); setPage(1) }}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-1"
        >
          <option value="">All priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>

        <select
          value={scope}
          onChange={(e) => { setScope(e.target.value as SupportScope | ''); setPage(1) }}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-1"
        >
          <option value="">All scopes</option>
          {SCOPES.map((s) => (
            <option key={s} value={s} className="capitalize">{s}</option>
          ))}
        </select>
      </FilterBar>

      <DataTable
        table={table}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No tickets found."
        getRowClassName={(row) =>
          row.original.lastReplyBy === 'user'
            ? 'bg-primary/5 font-medium'
            : undefined
        }
      />

      <Pagination
        page={page}
        total={data?.total ?? 0}
        limit={LIMIT}
        onPage={setPage}
      />
    </div>
  )
}
