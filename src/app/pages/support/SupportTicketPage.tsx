import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { ArrowLeft, Send } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/format'
import { useAdminStore } from '@/stores/admin'
import { useAdmins } from '../admins/queries'
import type { SupportStatus, SupportPriority } from '@/lib/types'
import { useTicketDetail, useReplyTicket, useUpdateTicket } from './queries'
import { StatusBadge } from './components/StatusBadge'
import { PriorityBadge } from './components/PriorityBadge'
import { ScopeBadge } from './components/ScopeBadge'
import { MessageBubble } from './components/MessageBubble'

export function SupportTicketPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const me = useAdminStore((s) => s.me)
  const canWrite = me?.role === 'admin' || me?.role === 'moderator'

  const { data: ticket, isLoading, error: ticketError } = useTicketDetail(id ?? '')
  const { data: admins, error: adminsError } = useAdmins()
  const reply = useReplyTicket()
  const update = useUpdateTicket()

  const [body, setBody] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const threadBottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    threadBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [ticket?.messages.length])

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    )
  }

  if (ticketError) {
    return <p className="text-sm text-destructive">Failed to load ticket.</p>
  }

  if (!ticket) {
    return <p className="text-sm text-muted-foreground">Ticket not found.</p>
  }

  async function handleUpdate(dto: {
    status?: SupportStatus
    priority?: SupportPriority
    assignedAdminId?: string | null
  }) {
    if (!ticket) return
    try {
      await update.mutateAsync({ id: ticket.id, ...dto })
      toast.success('Ticket updated.')
    } catch {
      toast.error('Failed to update ticket.')
    }
  }

  async function handleSend() {
    if (!body.trim() || !ticket) return
    try {
      await reply.mutateAsync({ id: ticket.id, body: body.trim(), internalNote: isInternal })
      setBody('')
      setIsInternal(false)
      toast.success(isInternal ? 'Internal note added.' : 'Reply sent.')
    } catch {
      toast.error('Failed to send reply.')
    }
  }

  const adminList = (admins?.items ?? []).filter((a) => a.active)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate('/support')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title={`#${ticket.number} — ${ticket.subject}`}
          description={`${ticket.workspaceName} · ${ticket.authorEmail} · opened ${formatDate(ticket.createdAt)}`}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={ticket.status} />
        <PriorityBadge priority={ticket.priority} />
        <ScopeBadge scope={ticket.scopeType} />
      </div>

      {canWrite && (
        <div className="flex flex-wrap items-end gap-3 rounded-lg bg-card shadow-[var(--shadow-sm)] p-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <select
              value={ticket.status}
              onChange={(e) => handleUpdate({ status: e.target.value as SupportStatus })}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-1"
            >
              <option value="open">Open</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Priority</label>
            <select
              value={ticket.priority}
              onChange={(e) => handleUpdate({ priority: e.target.value as SupportPriority })}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-1"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">
              Assignee
              {adminsError && <span className="ml-2 text-destructive">(failed to load)</span>}
            </label>
            <div className="flex gap-2">
              <select
                value={ticket.assignedAdminId ?? ''}
                onChange={(e) => handleUpdate({ assignedAdminId: e.target.value || null })}
                disabled={!!adminsError}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-1 disabled:opacity-50"
              >
                <option value="">Unassigned</option>
                {adminList.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              {me && ticket.assignedAdminId !== me.id && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUpdate({ assignedAdminId: me.id })}
                >
                  Assign to me
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg bg-card shadow-[var(--shadow-sm)] p-4">
        <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Description
        </h3>
        <p className="whitespace-pre-wrap text-sm">{ticket.description}</p>
        {ticket.attachments.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {ticket.attachments.map((a) => (
              <a
                key={a.id}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block h-20 w-20 overflow-hidden rounded border border-border"
              >
                {a.mime?.startsWith('image/') ? (
                  <img src={a.url} alt={a.originalFilename ?? ''} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                    {a.originalFilename ?? 'file'}
                  </span>
                )}
              </a>
            ))}
          </div>
        )}
      </div>

      {ticket.messages.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Conversation
          </h3>
          {ticket.messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          <div ref={threadBottomRef} />
        </div>
      )}

      {canWrite && (
        <div className="rounded-lg bg-card shadow-[var(--shadow-sm)] p-4 space-y-3">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="rounded"
              />
              <span className={isInternal ? 'text-amber-600 font-medium' : 'text-muted-foreground'}>
                Internal note (not visible to customer)
              </span>
            </label>
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={isInternal ? 'Add an internal note…' : 'Reply to customer…'}
            rows={4}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring placeholder:text-muted-foreground focus:ring-1 resize-none"
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              disabled={!body.trim() || reply.isPending}
              onClick={handleSend}
            >
              <Send className="mr-1.5 h-3.5 w-3.5" />
              {isInternal ? 'Add note' : 'Send reply'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
