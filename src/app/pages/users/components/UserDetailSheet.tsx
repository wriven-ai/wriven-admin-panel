import { X, Mail, Users } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { formatDate, formatRelative } from '@/lib/format'
import { useAdminStore } from '@/stores/admin'
import { useUserDetail, useSuspendUser, useResendVerification, useDeleteUser } from '../queries'
import type { TenantUser } from '@/lib/types'

interface UserDetailSheetProps {
  user: TenantUser | null
  onClose: () => void
}

type Dialog = 'suspend' | 'reactivate' | 'delete' | null

export function UserDetailSheet({ user, onClose }: UserDetailSheetProps) {
  const role = useAdminStore((s) => s.me?.role)
  const [dialog, setDialog] = useState<Dialog>(null)

  const { data: detail, isLoading } = useUserDetail(user?.id ?? '')
  const suspend = useSuspendUser()
  const resend = useResendVerification()
  const deleteUser = useDeleteUser()

  const canModerate = role === 'admin' || role === 'moderator'
  const canDelete = role === 'admin'

  if (!user) return null

  async function handleSuspend(reason?: string) {
    if (!user) return
    await suspend.mutateAsync({ id: user.id, suspended: !user.suspended, ...(reason ? { reason } : {}) })
    toast.success(user.suspended ? 'User reactivated.' : 'User suspended.')
    setDialog(null)
    onClose()
  }

  async function handleResend() {
    if (!user) return
    await resend.mutateAsync(user.id)
    toast.success('Verification email sent.')
  }

  async function handleDelete(reason?: string) {
    if (!user || !reason) return
    await deleteUser.mutateAsync({ id: user.id, reason })
    toast.success('User deleted.')
    setDialog(null)
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l bg-card shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-semibold">User Detail</h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="mb-5 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted text-lg font-semibold uppercase">
              {user.name[0]}
            </div>
            <div>
              <p className="font-semibold">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge variant={user.suspended ? 'error' : 'success'}>
                  {user.suspended ? 'Suspended' : 'Active'}
                </Badge>
                {user.emailVerified ? (
                  <Badge variant="secondary">Verified</Badge>
                ) : (
                  <Badge variant="warning">Unverified</Badge>
                )}
                <Badge variant="outline">{user.provider}</Badge>
              </div>
            </div>
          </div>

          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Joined</dt>
              <dd>{formatDate(user.createdAt)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Workspaces</dt>
              <dd>{user.workspaceCount}</dd>
            </div>
          </dl>

          {isLoading && (
            <div className="mt-6 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-md bg-muted" />
              ))}
            </div>
          )}

          {detail && detail.memberships.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Users className="h-3.5 w-3.5" /> Workspace memberships
              </p>
              <ul className="space-y-2">
                {detail.memberships.map((m) => (
                  <li
                    key={m.workspaceId}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <span className="truncate">{m.workspaceName}</span>
                    <Badge variant="outline" className="ml-2 shrink-0 capitalize">
                      {m.role}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {canModerate && (
          <div className="border-t px-5 py-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDialog(user.suspended ? 'reactivate' : 'suspend')}
              >
                {user.suspended ? 'Reactivate' : 'Suspend'}
              </Button>
              {!user.emailVerified && (
                <Button variant="outline" size="sm" onClick={handleResend}>
                  <Mail className="h-3.5 w-3.5" />
                  Resend verification
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="ml-auto"
                  onClick={() => setDialog('delete')}
                >
                  Delete / GDPR
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={dialog === 'suspend'}
        title="Suspend user"
        description={`Suspend ${user.name}? They will be unable to log in.`}
        confirmLabel="Suspend"
        destructive
        reasonLabel="Reason (required)"
        onConfirm={handleSuspend}
        onCancel={() => setDialog(null)}
      />
      <ConfirmDialog
        open={dialog === 'reactivate'}
        title="Reactivate user"
        description={`Reactivate ${user.name}? They will be able to log in again.`}
        confirmLabel="Reactivate"
        onConfirm={handleSuspend}
        onCancel={() => setDialog(null)}
      />
      <ConfirmDialog
        open={dialog === 'delete'}
        title="Delete user"
        description={`Permanently delete ${user.name} and all associated data. This cannot be undone.`}
        confirmLabel="Delete permanently"
        destructive
        requireTyping={user.email}
        reasonLabel="Reason (required, stored in audit log)"
        onConfirm={handleDelete}
        onCancel={() => setDialog(null)}
      />

    </>
  )
}
