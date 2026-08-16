import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table'
import { Link2, Link2Off, Plus } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable } from '@/components/data-table/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAdminStore } from '@/stores/admin'
import { formatPrice } from '@/lib/format'
import { PLAN_LIMIT_KEYS, type AdminPlanView } from '@/lib/types'
import { usePlans, useCreatePlan, useUpdatePlan } from './queries'
import type { CreatePlanDto, UpdatePlanDto } from './queries'
import { PlanForm } from './components/PlanForm'
import { PlanDetailSheet } from './components/PlanDetailSheet'

const columnHelper = createColumnHelper<AdminPlanView>()

export function PlansPage() {
  const role = useAdminStore((s) => s.me?.role)
  const canWrite = role === 'admin'

  const { data: plans, isLoading } = usePlans()
  const createPlan = useCreatePlan()
  const updatePlan = useUpdatePlan()

  const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AdminPlanView | null>(null)
  const [deactivating, setDeactivating] = useState<AdminPlanView | null>(null)
  const [formDirty, setFormDirty] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)

  const selected = useMemo(
    () => plans?.find((p) => p.id === selectedId) ?? null,
    [plans, selectedId],
  )

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Plan',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="font-medium">{row.original.name}</span>
            <Badge variant="outline" className="font-mono">
              {row.original.key}
            </Badge>
          </div>
        ),
      }),
      columnHelper.accessor('priceMonthly', {
        header: 'Price',
        cell: ({ row }) => {
          const { priceMonthly, priceYearly, yearlyDiscountPercent } = row.original
          if (priceMonthly == null && priceYearly == null) return 'Free'
          return (
            <div className="flex items-baseline gap-1.5">
              {priceMonthly != null && <span>{formatPrice(priceMonthly)} / mo</span>}
              {priceYearly != null && (
                <span className="text-xs text-muted-foreground">
                  {formatPrice(priceYearly)} / yr
                  {yearlyDiscountPercent != null && (
                    <span className="text-status-success"> (−{yearlyDiscountPercent}%)</span>
                  )}
                </span>
              )}
            </div>
          )
        },
      }),
      columnHelper.accessor('active', {
        header: 'Status',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            {row.original.active ? (
              <Badge variant="success">Active</Badge>
            ) : (
              <Badge variant="error">Inactive</Badge>
            )}
            {!row.original.isPublic && <Badge variant="secondary">Private</Badge>}
          </div>
        ),
      }),
      columnHelper.display({
        id: 'limits',
        header: 'Limits',
        cell: ({ row }) => {
          const limits = row.original.limits ?? {}
          const set = PLAN_LIMIT_KEYS.filter(({ key }) => limits[key] != null)
          if (set.length === 0) return <span className="text-muted-foreground">Unlimited</span>
          return (
            <span className="text-xs text-muted-foreground">
              {set
                .slice(0, 3)
                .map(
                  ({ key, label }) => (
                    <span key={key}>
                      {label}{' '}
                      <span className="font-medium text-foreground">{limits[key]}</span>
                    </span>
                  ),
                )
                .reduce<React.ReactNode[]>((acc, el, i) => (i === 0 ? [el] : [...acc, ' · ', el]), [])}
              {set.length > 3 && ` +${set.length - 3}`}
            </span>
          )
        },
      }),
      columnHelper.display({
        id: 'stripe',
        header: 'Stripe',
        cell: ({ row }) =>
          row.original.stripeProductId ? (
            <Link2 className="h-3.5 w-3.5 text-status-success" />
          ) : (
            <Link2Off className="h-3.5 w-3.5 text-muted-foreground" />
          ),
      }),
    ],
    [],
  )

  const table = useReactTable({
    data: plans ?? [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
    setFormDirty(false)
  }

  /** Close guard: warn before discarding unsaved form changes. */
  function requestCloseForm() {
    if (formDirty) setConfirmDiscard(true)
    else closeForm()
  }

  async function handleFormSubmit(payload: CreatePlanDto | (UpdatePlanDto & { id: string })) {
    if ('id' in payload) {
      await updatePlan.mutateAsync(payload)
      toast.success('Plan updated.')
    } else {
      await createPlan.mutateAsync(payload)
      toast.success('Plan created.')
    }
    closeForm()
  }

  async function handleToggleActive(plan: AdminPlanView) {
    try {
      await updatePlan.mutateAsync({ id: plan.id, active: !plan.active })
      toast.success(plan.active ? 'Plan deactivated.' : 'Plan reactivated.')
    } catch {
      toast.error('Failed to update the plan.')
    } finally {
      setDeactivating(null)
    }
  }

  return (
    <div>
      <PageHeader
        title="Plans"
        description="Define platform plans and their limits. Pricing is managed by Stripe."
        action={
          canWrite && (
            <Button
              size="sm"
              onClick={() => {
                setEditing(null)
                setFormOpen(true)
              }}
            >
              <Plus className="h-4 w-4" />
              New plan
            </Button>
          )
        }
      />

      <DataTable
        table={table}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No plans yet."
        getRowClassName={() => 'cursor-pointer'}
        onRowClick={(plan) => setSelectedId(plan.id)}
      />

      <PlanDetailSheet
        plan={selected}
        canWrite={canWrite}
        onClose={() => setSelectedId(null)}
        onEdit={(plan) => {
          setEditing(plan)
          setSelectedId(null)
          setFormOpen(true)
        }}
        onToggleActive={(plan) => {
          if (plan.active) {
            setDeactivating(plan)
          } else {
            handleToggleActive(plan)
          }
        }}
      />

      <Dialog open={formOpen} onOpenChange={(open) => { if (!open) requestCloseForm() }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.name}` : 'New plan'}</DialogTitle>
            <DialogDescription>
              {editing
                ? 'Update the plan\'s details, limits and features.'
                : 'Define a plan, its pricing and limits.'}
            </DialogDescription>
          </DialogHeader>
          <PlanForm
            key={editing?.id ?? 'create'}
            plan={editing ?? undefined}
            onSubmit={handleFormSubmit}
            onCancel={requestCloseForm}
            onDirtyChange={setFormDirty}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deactivating}
        title={`Deactivate ${deactivating?.name ?? ''}?`}
        description="This archives the plan's Stripe product and deactivates its prices. Workspaces on this plan keep access until reassigned. Reactivating here does not restore the Stripe product."
        confirmLabel="Deactivate"
        destructive
        onCancel={() => setDeactivating(null)}
        onConfirm={() => {
          if (deactivating) handleToggleActive(deactivating)
        }}
      />

      <ConfirmDialog
        open={confirmDiscard}
        title="Discard unsaved changes?"
        description="The plan form has changes that haven't been saved. Closing it will discard them."
        confirmLabel="Discard changes"
        destructive
        onCancel={() => setConfirmDiscard(false)}
        onConfirm={() => {
          setConfirmDiscard(false)
          closeForm()
        }}
      />
    </div>
  )
}
