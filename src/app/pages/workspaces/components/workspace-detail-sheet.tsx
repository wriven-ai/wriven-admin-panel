import { X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { formatDate, formatPrice } from '@/lib/format'
import { useAdminStore } from '@/stores/admin'
import { cn } from '@/lib/utils'
import {
  useWorkspaceDetail,
  useSuspendWorkspace,
  useAssignPlan,
  usePlans,
} from '../queries'
import type { WorkspaceRow } from '@/lib/types'

interface WorkspaceDetailSheetProps {
  workspace: WorkspaceRow | null
  onClose: () => void
}

type Tab = 'members' | 'plan'
type Dialog = 'suspend' | 'reactivate' | null

const STATUS_VARIANT = {
  active: 'success',
  past_due: 'warning',
  suspended: 'error',
  trialing: 'secondary',
} as const

export function WorkspaceDetailSheet({ workspace, onClose }: WorkspaceDetailSheetProps) {
  const role = useAdminStore((s) => s.me?.role)
  const [tab, setTab] = useState<Tab>('members')
  const [dialog, setDialog] = useState<Dialog>(null)
  const [selectedPlan, setSelectedPlan] = useState('')

  const { data: detail, isLoading } = useWorkspaceDetail(workspace?.id ?? '')
  const { data: plans } = usePlans()
  const suspend = useSuspendWorkspace()
  const assignPlan = useAssignPlan()

  const canModerate = role === 'admin' || role === 'moderator'
  const canAdmin = role === 'admin'

  if (!workspace) return null

  async function handleSuspend(reason?: string) {
    if (!workspace) return
    const isSuspended = workspace.status === 'suspended'
    await suspend.mutateAsync({ id: workspace.id, suspended: !isSuspended, reason })
    toast.success(isSuspended ? 'Workspace reactivated.' : 'Workspace suspended.')
    setDialog(null)
    onClose()
  }

  async function handleAssignPlan() {
    if (!workspace || !selectedPlan) return
    await assignPlan.mutateAsync({ id: workspace.id, planId: selectedPlan })
    toast.success('Plan updated.')
  }

  const isSuspended = workspace.status === 'suspended'

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
            {(['members', 'plan'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'border-b-2 py-3 text-sm capitalize transition-colors',
                  tab === t
                    ? 'border-brand-accent text-foreground font-medium'
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
            <Badge variant={STATUS_VARIANT[workspace.status]}>{workspace.status}</Badge>
            <Badge variant="outline">{workspace.planKey}</Badge>
            <span className="text-xs text-muted-foreground">Owner: {workspace.ownerEmail}</span>
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

          {tab === 'plan' && detail && (
            <div className="space-y-4">
              {detail.plan && (
                <div className="rounded-md border p-4">
                  <p className="mb-1 text-sm font-medium">{detail.plan.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatPrice(detail.plan.priceMonthly)} / month
                  </p>
                  {detail.plan.limits && (
                    <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                      {Object.entries(detail.plan.limits).map(([k, v]) => (
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
                      value={selectedPlan}
                      onChange={(e) => setSelectedPlan(e.target.value)}
                      className="h-9 flex-1 rounded-md border bg-background px-3 text-sm outline-none"
                    >
                      <option value="">Select plan…</option>
                      {plans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      disabled={!selectedPlan || assignPlan.isPending}
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

        {canModerate && (
          <div className="border-t px-5 py-4">
            <Button
              variant={isSuspended ? 'outline' : 'destructive'}
              size="sm"
              onClick={() => setDialog(isSuspended ? 'reactivate' : 'suspend')}
            >
              {isSuspended ? 'Reactivate workspace' : 'Suspend workspace'}
            </Button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={dialog === 'suspend'}
        title="Suspend workspace"
        description={`Suspend "${workspace.name}"? Members will lose access.`}
        confirmLabel="Suspend"
        destructive
        reasonLabel="Reason (required)"
        onConfirm={handleSuspend}
        onCancel={() => setDialog(null)}
      />
      <ConfirmDialog
        open={dialog === 'reactivate'}
        title="Reactivate workspace"
        description={`Reactivate "${workspace.name}"? Members will regain access.`}
        confirmLabel="Reactivate"
        onConfirm={handleSuspend}
        onCancel={() => setDialog(null)}
      />
    </>
  )
}
