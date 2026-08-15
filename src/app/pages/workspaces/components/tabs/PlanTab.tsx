import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatDate, formatPrice } from '@/lib/format'
import { useAdminStore } from '@/stores/admin'
import type { AdminWorkspaceRow } from '@/lib/types'
import { useAssignPlan, usePlans } from '../../queries'

export function PlanTab({ workspace }: { workspace: AdminWorkspaceRow }) {
  const role = useAdminStore((s) => s.me?.role)
  const [selectedPlanKey, setSelectedPlanKey] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { data: plans } = usePlans()
  const assignPlan = useAssignPlan()

  const canAdmin = role === 'admin'
  const currentPlan = plans?.find((p) => p.key === workspace.planKey)

  async function handleAssignPlan() {
    if (!selectedPlanKey) return
    setError(null)
    try {
      await assignPlan.mutateAsync({ id: workspace.id, dto: { planKey: selectedPlanKey } })
      toast.success('Plan updated.')
      setSelectedPlanKey('')
    } catch (e) {
      // Domain rejection (prerequisite/conflict) — surface the server wording verbatim.
      setError(e instanceof Error ? e.message : 'Plan assignment failed.')
    }
  }

  return (
    <div className="max-w-xl space-y-4">
      <div className="rounded-lg bg-card shadow-[var(--shadow-sm)] p-4">
        <div className="mb-2 flex items-center gap-2">
          <p className="text-sm font-medium">{currentPlan?.name ?? workspace.planName ?? 'No plan'}</p>
          {workspace.subscriptionStatus && (
            <Badge variant="outline">{workspace.subscriptionStatus.replace('_', ' ')}</Badge>
          )}
        </div>
        {currentPlan && (
          <p className="text-xs text-muted-foreground">
            {formatPrice(currentPlan.priceMonthly)} / month
            {currentPlan.priceYearly != null && ` · ${formatPrice(currentPlan.priceYearly)} / year`}
          </p>
        )}
        {currentPlan && Object.keys(currentPlan.limits).length > 0 && (
          <dl className="mt-3 divide-y divide-border text-xs">
            {Object.entries(currentPlan.limits).map(([k, v]) => (
              <div key={k} className="flex justify-between py-1.5 first:pt-2 last:pb-0">
                <dt className="capitalize text-muted-foreground">{k}</dt>
                <dd className="font-medium tabular-nums">{v ?? '∞'}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      {canAdmin && plans && (
        <div>
          <label className="mb-1 block text-xs font-medium">Change plan</label>
          <div className="flex gap-2">
            <select
              value={selectedPlanKey}
              onChange={(e) => setSelectedPlanKey(e.target.value)}
              className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring transition-shadow focus:ring-1"
            >
              <option value="">Select plan…</option>
              {plans.map((p) => (
                <option key={p.id} value={p.key}>
                  {p.name}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              disabled={!selectedPlanKey || assignPlan.isPending}
              onClick={handleAssignPlan}
            >
              Apply
            </Button>
          </div>
          {error && (
            <p className="mt-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}
          <p className="mt-2 text-2xs text-muted-foreground">
            Workspace created {formatDate(workspace.createdAt)}. Owner: {workspace.ownerEmail ?? '—'}
          </p>
        </div>
      )}
    </div>
  )
}
