import { Check, X } from 'lucide-react'
import { RichTextViewer } from './RichTextViewer'
import { type FieldDef } from '@/lib/types'

function FieldValue({ field, value }: { field: FieldDef; value: unknown }) {
  if (value == null || value === '') {
    return <span className="text-sm text-muted-foreground">—</span>
  }

  switch (field.type) {
    case 'richtext':
      return <RichTextViewer value={value} />
    case 'boolean':
      return value ? (
        <span className="inline-flex items-center gap-1 text-sm text-status-success">
          <Check className="h-3.5 w-3.5" /> Yes
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <X className="h-3.5 w-3.5" /> No
        </span>
      )
    case 'number':
      return <span className="text-sm tabular-nums">{String(value)}</span>
    case 'date':
      return <span className="text-sm">{String(value)}</span>
    case 'select':
      return Array.isArray(value) ? (
        <span className="text-sm">{value.join(', ')}</span>
      ) : (
        <span className="text-sm">{String(value)}</span>
      )
    case 'media':
    case 'reference':
      // Ids only — the admin API has no asset/entry lookup-by-id to resolve names.
      return Array.isArray(value) ? (
        <ul className="space-y-0.5">
          {value.map((v, i) => (
            <li key={i} className="font-mono text-xs text-muted-foreground">{String(v)}</li>
          ))}
        </ul>
      ) : (
        <span className="font-mono text-xs text-muted-foreground">{String(value)}</span>
      )
    default:
      return <span className="text-sm">{String(value)}</span>
  }
}

/**
 * Renders an entry's data payload through its content-type field definitions —
 * the same shapes the client editor shows, instead of raw JSON.
 */
export function EntryFields({
  fields,
  data,
}: {
  fields: FieldDef[]
  data: Record<string, unknown>
}) {
  const known = new Set(fields.map((f) => f.key))
  const extra = Object.keys(data ?? {}).filter((k) => !known.has(k))

  return (
    <div className="space-y-5">
      {fields.map((field) => (
        <section key={field.key} className="space-y-1.5">
          <h3 className="flex items-center gap-1.5 text-2xs font-semibold tracking-wide text-muted-foreground uppercase">
            {field.label}
            <span className="font-mono font-normal normal-case">[{field.type}]</span>
          </h3>
          <FieldValue field={field} value={data?.[field.key]} />
        </section>
      ))}

      {extra.length > 0 && (
        <section className="space-y-1.5">
          <h3 className="text-2xs font-semibold tracking-wide text-muted-foreground uppercase">
            Other data
          </h3>
          <pre className="overflow-auto rounded-md bg-muted/50 p-3 font-mono text-2xs leading-relaxed">
            {JSON.stringify(
              Object.fromEntries(extra.map((k) => [k, data[k]])),
              null,
              2,
            )}
          </pre>
        </section>
      )}
    </div>
  )
}
