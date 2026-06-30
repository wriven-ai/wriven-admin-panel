import { Plus, Pencil } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatPrice } from '@/lib/format'
import type { Plan } from '@/lib/types'
import { usePlans, useCreatePlan, useUpdatePlan } from './queries'
import { PlanForm } from './components/PlanForm'

type Mode = { type: 'create' } | { type: 'edit'; plan: Plan } | null

export function PlansPage() {
  const [mode, setMode] = useState<Mode>(null)
  const { data: plans, isLoading } = usePlans()
  const createPlan = useCreatePlan()
  const updatePlan = useUpdatePlan()

  async function handleSubmit(values: Parameters<typeof createPlan.mutateAsync>[0]) {
    if (mode?.type === 'edit') {
      await updatePlan.mutateAsync({ id: mode.plan.id, ...values })
      toast.success('Plan updated.')
    } else {
      await createPlan.mutateAsync(values)
      toast.success('Plan created.')
    }
    setMode(null)
  }

  if (mode) {
    return (
      <div className="space-y-4">
        <PageHeader
          title={mode.type === 'create' ? 'New plan' : `Edit ${mode.type === 'edit' ? mode.plan.name : ''}`}
        />
        <div className="max-w-2xl rounded-lg border bg-card p-6">
          <PlanForm
            defaultValues={mode.type === 'edit' ? mode.plan : undefined}
            isEdit={mode.type === 'edit'}
            onSubmit={handleSubmit}
            onCancel={() => setMode(null)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Plans"
        description="Define platform plans and their limits."
        action={
          <Button size="sm" onClick={() => setMode({ type: 'create' })}>
            <Plus className="h-4 w-4" />
            New plan
          </Button>
        }
      />

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg border bg-muted" />
          ))}
        </div>
      )}

      <div className="space-y-3">
        {plans?.map((plan) => (
          <div key={plan.id} className="rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{plan.name}</p>
                  <Badge variant="outline" className="font-mono text-xs">{plan.key}</Badge>
                  {!plan.active && <Badge variant="error">Inactive</Badge>}
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {formatPrice(plan.priceMonthly)} / month
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setMode({ type: 'edit', plan })}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>

            {Object.keys(plan.limits).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {Object.entries(plan.limits).map(([k, v]) => (
                  <span key={k}>
                    <span className="capitalize">{k}</span>: <strong className="text-foreground">{v ?? '∞'}</strong>
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        {plans?.length === 0 && (
          <p className="text-sm text-muted-foreground">No plans yet. Create one.</p>
        )}
      </div>
    </div>
  )
}
