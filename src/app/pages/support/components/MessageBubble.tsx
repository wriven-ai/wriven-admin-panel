import { Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/format'
import type { AdminTicketMessage } from '@/lib/types'

interface MessageBubbleProps {
  message: AdminTicketMessage
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isAdmin = message.authorType === 'admin'
  const isInternal = message.isInternalNote

  return (
    <div
      className={cn(
        'flex flex-col gap-1',
        isAdmin ? 'items-end' : 'items-start',
      )}
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {isInternal && (
          <span className="flex items-center gap-1 text-amber-600">
            <Lock className="h-3 w-3" />
            internal note
          </span>
        )}
        <span className="font-medium">{message.authorName}</span>
        <span>·</span>
        <span>{formatDate(message.createdAt)}</span>
      </div>
      <div
        className={cn(
          'max-w-prose rounded-lg px-4 py-3 text-sm',
          isInternal
            ? 'border border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100'
            : isAdmin
              ? 'bg-primary text-primary-foreground'
              : 'border bg-card text-card-foreground',
        )}
      >
        <p className="whitespace-pre-wrap">{message.body}</p>
        {message.attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.attachments.map((a) => (
              <a
                key={a.id}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block h-16 w-16 overflow-hidden rounded border border-border"
              >
                {a.mime?.startsWith('image/') ? (
                  <img src={a.url} alt={a.originalFilename ?? ''} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-xs">
                    {a.originalFilename ?? 'file'}
                  </span>
                )}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
