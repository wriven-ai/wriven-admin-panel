import { useState } from 'react'
import { Button } from './button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  destructive?: boolean
  requireTyping?: string
  reasonLabel?: string
  onConfirm: (reason?: string) => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  destructive = false,
  requireTyping,
  reasonLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState('')
  const [reason, setReason] = useState('')

  if (!open) return null

  const canConfirm =
    (!requireTyping || typed === requireTyping) &&
    (!reasonLabel || reason.trim().length > 0)

  function handleConfirm() {
    if (!canConfirm) return
    onConfirm(reason || undefined)
    setTyped('')
    setReason('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>

        {reasonLabel && (
          <div className="mt-4">
            <label className="mb-1 block text-xs font-medium">{reasonLabel}</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-1"
              placeholder="Enter reason…"
            />
          </div>
        )}

        {requireTyping && (
          <div className="mt-4">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Type <span className="font-mono font-semibold text-foreground">{requireTyping}</span> to confirm
            </label>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none ring-ring focus:ring-1"
            />
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button
            variant={destructive ? 'destructive' : 'default'}
            disabled={!canConfirm}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
