import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ApiError } from '@/lib/api'
import { formatDate } from '@/lib/format'
import { useAdminStore } from '@/stores/admin'
import type { AdminUserDetail } from '@/lib/types'
import { useDeleteUser, useUpdateUser } from '../../queries'

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

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

export function DetailsTab({ detail }: { detail: AdminUserDetail }) {
  const role = useAdminStore((s) => s.me?.role)
  const updateUser = useUpdateUser()
  const deleteUser = useDeleteUser()

  const [confirmSuspend, setConfirmSuspend] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canModerate = role === 'admin' || role === 'moderator'
  const canDelete = role === 'admin'

  async function handleSuspend() {
    setConfirmSuspend(false)
    try {
      await updateUser.mutateAsync({ id: detail.id, suspended: !detail.suspended })
      toast.success(detail.suspended ? 'User unsuspended.' : 'User suspended.')
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Update failed.')
    }
  }

  async function handleVerify() {
    setError(null)
    try {
      await updateUser.mutateAsync({ id: detail.id, emailVerified: !detail.emailVerified })
      toast.success(detail.emailVerified ? 'Marked unverified.' : 'Marked verified.')
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Update failed.')
    }
  }

  async function handleDelete() {
    setError(null)
    try {
      await deleteUser.mutateAsync(detail.id)
      toast.success('User deleted.')
      setConfirmDelete(false)
    } catch (e) {
      // Server wording (ownership CONFLICT) is user-ready — surface verbatim.
      setError(e instanceof ApiError ? e.message : 'Delete failed.')
      setConfirmDelete(false)
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-lg bg-card shadow-[var(--shadow-sm)] p-4">
        <p className="mb-3 text-sm font-medium">Profile</p>
        <dl className="divide-y">
          <Row label="User ID" value={<CopyId value={detail.id} />} />
          <Row label="Email" value={detail.email} />
          <Row label="Name" value={detail.name || '—'} />
          <Row
            label="Provider"
            value={<Badge variant="outline" className="capitalize">{detail.provider}</Badge>}
          />
          <Row
            label="Email verified"
            value={
              detail.emailVerified ? (
                <Badge variant="success">Verified</Badge>
              ) : (
                <Badge variant="warning">Unverified</Badge>
              )
            }
          />
          <Row
            label="Status"
            value={
              detail.suspended ? (
                <Badge variant="error">Suspended</Badge>
              ) : (
                <Badge variant="success">Active</Badge>
              )
            }
          />
          <Row label="Joined" value={<span className="text-muted-foreground">{formatDate(detail.createdAt)}</span>} />
        </dl>
      </div>

      {canModerate && (
        <div className="rounded-lg bg-card shadow-[var(--shadow-sm)] p-4">
          <p className="mb-3 text-sm font-medium">Actions</p>
          {error && (
            <p className="mb-3 rounded-md border border-status-error/30 bg-status-error/10 px-3 py-2 text-xs text-status-error">
              {error}
            </p>
          )}
          <div className="flex flex-col gap-2">
            <Button
              variant={detail.suspended ? 'secondary' : 'destructive'}
              size="sm"
              disabled={updateUser.isPending}
              onClick={() => setConfirmSuspend(true)}
            >
              {detail.suspended ? 'Unsuspend user' : 'Suspend user'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={updateUser.isPending}
              onClick={handleVerify}
            >
              {detail.emailVerified ? 'Mark unverified' : 'Mark verified'}
            </Button>
            {canDelete && (
              <Button
                variant="destructive"
                size="sm"
                disabled={deleteUser.isPending}
                onClick={() => setConfirmDelete(true)}
              >
                Delete user
              </Button>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmSuspend}
        title={detail.suspended ? 'Unsuspend user' : 'Suspend user'}
        description={
          detail.suspended
            ? `Restore access for "${detail.email}"?`
            : `Suspend "${detail.email}"? Suspending revokes all active sessions immediately — the user cannot log in until unsuspended.`
        }
        confirmLabel={detail.suspended ? 'Unsuspend' : 'Suspend'}
        destructive={!detail.suspended}
        onConfirm={handleSuspend}
        onCancel={() => setConfirmSuspend(false)}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="Delete user"
        description={`Permanently delete "${detail.email}"? This cannot be undone, and fails if the user owns workspaces or projects.`}
        confirmLabel="Delete"
        destructive
        requireTyping={detail.email}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}
