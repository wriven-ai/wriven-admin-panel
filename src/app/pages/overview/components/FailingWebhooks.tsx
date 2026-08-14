import { AlertCircle } from 'lucide-react'
import { formatRelative } from '@/lib/format'
import type { WebhookRow } from '@/lib/types'

interface FailingWebhooksProps {
  webhooks: WebhookRow[]
}

export function FailingWebhooks({ webhooks }: FailingWebhooksProps) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <p className="text-sm font-medium">Failing Webhooks</p>
        {webhooks.length > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-semibold text-destructive-foreground">
            {webhooks.length}
          </span>
        )}
      </div>
      {webhooks.length === 0 ? (
        <p className="text-xs text-muted-foreground">All webhooks healthy.</p>
      ) : (
        <ul className="space-y-3">
          {webhooks.map((w) => (
            <li key={w.id} className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <div className="min-w-0">
                <p className="truncate text-xs font-medium">{w.url}</p>
                <p className="text-xs text-muted-foreground">
                  {w.projectName} · {w.workspaceName}
                  {w.lastStatusCode && ` · HTTP ${w.lastStatusCode}`}
                  {w.lastFiredAt && ` · ${formatRelative(w.lastFiredAt)}`}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
