import { X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatDate, formatPrice } from '@/lib/format'
import { useAdminStore } from '@/stores/admin'
import { cn } from '@/lib/utils'
import { useWorkspaceDetail, useAssignPlan, usePlans } from '../queries'
import type { AdminWorkspaceRow } from '@/lib/types'

interface WorkspaceDetailSheetProps {
  workspace: AdminWorkspaceRow | null
  onClose: () => void
}

type Tab = 'members' | 'projects' | 'plan'

export function WorkspaceDetailSheet({ workspace, onClose }: WorkspaceDetailSheetProps) {
  const role = useAdminStore((s) => s.me?.role)
  const [tab, setTab] = useState<Tab>('members')
  const [selectedPlanKey, setSelectedPlanKey] = useState('')

  const { data: detail, isLoading } = useWorkspaceDetail(workspace?.id ?? '')
  const { data: plans } = usePlans()
  const assignPlan = useAssignPlan()

  const canAdmin = role === 'admin'

  if (!workspace) return null

  async function handleAssignPlan() {
    if (!workspace || !selectedPlanKey) return
    await assignPlan.mutateAsync({ id: workspace.id, dto: { planKey: selectedPlanKey } })
    toast.success('Plan updated.')
    setSelectedPlanKey('')
  }

  const currentPlan = plans?.find((p) => p.key === workspace.planKey)

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col border-l bg-card shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="font-semibold">{workspace.name}</h2>
            <p className="text-xs text-muted-foreground">/{workspace.slug}</p>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="border-b px-5">
          <div className="flex gap-4">
            {(['members', 'projects', 'plan'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'border-b-2 py-3 text-sm capitalize transition-colors',
                  tab === t
                    ? 'border-brand-accent font-medium text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="mb-4 flex flex-wrap gap-2">
            {workspace.subscriptionStatus && (
              <Badge variant="outline">{workspace.subscriptionStatus.replace('_', ' ')}</Badge>
            )}
            {workspace.planKey && <Badge variant="outline">{workspace.planKey}</Badge>}
            <span className="text-xs text-muted-foreground">
              Owner: {workspace.ownerEmail ?? '—'}
            </span>
          </div>

          <dl className="mb-5 grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-md border p-3 text-center">
              <dd className="text-lg font-semibold">{workspace.memberCount}</dd>
              <dt className="text-xs text-muted-foreground">Members</dt>
            </div>
            <div className="rounded-md border p-3 text-center">
              <dd className="text-lg font-semibold">{workspace.projectCount}</dd>
              <dt className="text-xs text-muted-foreground">Projects</dt>
            </div>
            <div className="rounded-md border p-3 text-center">
              <dd className="text-xs font-semibold">{formatDate(workspace.createdAt)}</dd>
              <dt className="text-xs text-muted-foreground">Created</dt>
            </div>
          </dl>

          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-md bg-muted" />
              ))}
            </div>
          )}

          {tab === 'members' && detail && (
            <ul className="space-y-2">
              {detail.members.map((m) => (
                <li
                  key={m.userId}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.email}</p>
                  </div>
                  <Badge variant="outline" className="capitalize">{m.role}</Badge>
                </li>
              ))}
              {detail.members.length === 0 && (
                <p className="text-sm text-muted-foreground">No members.</p>
              )}
            </ul>
          )}

          {tab === 'projects' && detail && (
            <ul className="space-y-2">
              {detail.projects.map((p) => (
                <li key={p.id} className="rounded-md border px-3 py-2 text-sm">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">/{p.slug}</p>
                </li>
              ))}
              {detail.projects.length === 0 && (
                <p className="text-sm text-muted-foreground">No projects.</p>
              )}
            </ul>
          )}

          {tab === 'plan' && (
            <div className="space-y-4">
              {currentPlan && (
                <div className="rounded-md border p-4">
                  <p className="mb-1 text-sm font-medium">{currentPlan.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatPrice(currentPlan.priceMonthly)} / month
                    {currentPlan.priceYearly && ` · ${formatPrice(currentPlan.priceYearly)} / year`}
                  </p>
                  {Object.keys(currentPlan.limits).length > 0 && (
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
              )}

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
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
