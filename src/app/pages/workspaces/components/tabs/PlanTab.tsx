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
      <div className="rounded-lg border bg-card p-4">
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
          <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
            {Object.entries(currentPlan.limits).map(([k, v]) => (
              <li key={k} className="flex justify-between">
                <span className="capitalize">{k}</span>
                <span>{v ?? '∞'}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {canAdmin && plans && (
        <div>
          <label className="mb-1 block text-xs font-medium">Change plan</label>
          <div className="flex gap-2">
            <select
              value={selectedPlanKey}
              onChange={(e) => setSelectedPlanKey(e.target.value)}
              className="h-9 flex-1 rounded-md border bg-background px-3 text-sm outline-none"
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
