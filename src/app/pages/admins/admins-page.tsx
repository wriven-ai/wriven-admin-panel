import { Plus, RotateCcw, UserX } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import { toast } from 'sonner'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { formatDate, formatRelative } from '@/lib/format'
import { useAdminStore } from '@/stores/admin'
import type { AdminUser, AdminRole } from '@/lib/types'
import { useAdmins, useInviteAdmin, useUpdateAdmin, useDeleteAdmin } from './queries'

const inviteSchema = z.object({
  email: z.email(),
  name: z.string().min(1),
  role: z.enum(['admin', 'moderator', 'member']),
})

type InviteValues = z.infer<typeof inviteSchema>

const ROLE_VARIANT: Record<AdminRole, 'default' | 'secondary' | 'outline'> = {
  admin: 'default',
  moderator: 'secondary',
  member: 'outline',
}

export function AdminsPage() {
  const me = useAdminStore((s) => s.me)
  const [showInvite, setShowInvite] = useState(false)
  const [toDelete, setToDelete] = useState<AdminUser | null>(null)

  const { data: admins, isLoading } = useAdmins()
  const invite = useInviteAdmin()
  const update = useUpdateAdmin()
  const deleteAdmin = useDeleteAdmin()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: 'member' },
  })

  async function handleInvite(values: InviteValues) {
    await invite.mutateAsync(values)
    toast.success(`Invited ${values.email}.`)
    reset()
    setShowInvite(false)
  }

  async function handleResetMfa(admin: AdminUser) {
    await update.mutateAsync({ id: admin.id, resetMfa: true })
    toast.success('MFA reset.')
  }

  async function handleToggleActive(admin: AdminUser) {
    await update.mutateAsync({ id: admin.id, active: !admin.active })
    toast.success(admin.active ? 'Admin deactivated.' : 'Admin reactivated.')
  }

  async function handleDelete() {
    if (!toDelete) return
    await deleteAdmin.mutateAsync(toDelete.id)
    toast.success('Admin deleted.')
    setToDelete(null)
  }

  const activeAdmins = admins?.filter((a) => a.active && a.role === 'admin') ?? []
  const isLastAdmin = (admin: AdminUser) =>
    admin.role === 'admin' && admin.active && activeAdmins.length <= 1

  return (
    <div className="space-y-4">
      <PageHeader
        title="Admins"
        description="Manage admin panel users."
        action={
          <Button size="sm" onClick={() => setShowInvite(!showInvite)}>
            <Plus className="h-4 w-4" />
            Invite admin
          </Button>
        }
      />

      {showInvite && (
        <form
          onSubmit={handleSubmit(handleInvite)}
          className="rounded-lg border bg-card p-4"
        >
          <p className="mb-3 text-sm font-medium">Invite new admin</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <input
                {...register('email')}
                placeholder="Email"
                className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none ring-ring focus:ring-1"
              />
              {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div>
              <input
                {...register('name')}
                placeholder="Name"
                className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none ring-ring focus:ring-1"
              />
            </div>
            <select
              {...register('role')}
              className="h-9 rounded-md border bg-background px-3 text-sm outline-none"
            >
              <option value="member">Member (read-only)</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Admin (full access)</option>
            </select>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowInvite(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              Send invite
            </Button>
          </div>
        </form>
      )}

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg border bg-muted" />
          ))}
        </div>
      )}

      <div className="space-y-2">
        {admins?.map((admin) => (
          <div
            key={admin.id}
            className="flex items-center gap-4 rounded-lg border bg-card px-4 py-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold uppercase">
              {admin.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{admin.name}</p>
                {admin.id === me?.adminUserId && (
                  <Badge variant="outline" className="text-xs">You</Badge>
                )}
                <Badge variant={ROLE_VARIANT[admin.role]} className="capitalize">{admin.role}</Badge>
                {!admin.active && <Badge variant="error">Inactive</Badge>}
                {admin.mfaEnabled && <Badge variant="success">MFA</Badge>}
              </div>
              <p className="text-xs text-muted-foreground">
                {admin.email} · Joined {formatDate(admin.createdAt)}
                {admin.lastLoginAt && ` · Last login ${formatRelative(admin.lastLoginAt)}`}
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              {admin.mfaEnabled && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Reset MFA"
                  onClick={() => handleResetMfa(admin)}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              )}
              {admin.id !== me?.adminUserId && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(admin)}
                    disabled={isLastAdmin(admin)}
                    title={isLastAdmin(admin) ? 'Cannot deactivate last admin' : undefined}
                  >
                    {admin.active ? 'Deactivate' : 'Reactivate'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon-sm"
                    disabled={isLastAdmin(admin)}
                    onClick={() => setToDelete(admin)}
                  >
                    <UserX className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete admin"
        description={`Remove ${toDelete?.name} from the admin panel permanently.`}
        confirmLabel="Delete"
        destructive
        requireTyping={toDelete?.email}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}
