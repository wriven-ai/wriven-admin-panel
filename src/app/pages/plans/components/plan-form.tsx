import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import { Button } from '@/components/ui/button'
import type { Plan } from '@/lib/types'

const schema = z.object({
  key: z.string().min(1).regex(/^[a-z0-9_]+$/, 'Lowercase letters, numbers, underscores only'),
  name: z.string().min(1),
  priceMonthly: z.preprocess(
    (v) => (v === '' || v === null ? null : Number(v)),
    z.number().min(0).nullable(),
  ),
  active: z.boolean(),
  limits: z.object({
    projects: z.preprocess((v) => (v === '' ? undefined : Number(v)), z.number().int().positive().optional()),
    members: z.preprocess((v) => (v === '' ? undefined : Number(v)), z.number().int().positive().optional()),
    storageMb: z.preprocess((v) => (v === '' ? undefined : Number(v)), z.number().int().positive().optional()),
    entries: z.preprocess((v) => (v === '' ? undefined : Number(v)), z.number().int().positive().optional()),
    apiKeys: z.preprocess((v) => (v === '' ? undefined : Number(v)), z.number().int().positive().optional()),
    webhooks: z.preprocess((v) => (v === '' ? undefined : Number(v)), z.number().int().positive().optional()),
  }),
})

type PlanFormValues = z.infer<typeof schema>

interface PlanFormProps {
  defaultValues?: Partial<Plan>
  onSubmit: (values: PlanFormValues) => Promise<void>
  onCancel: () => void
  isEdit?: boolean
}

export function PlanForm({ defaultValues, onSubmit, onCancel, isEdit }: PlanFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PlanFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      key: defaultValues?.key ?? '',
      name: defaultValues?.name ?? '',
      priceMonthly: defaultValues?.priceMonthly ?? null,
      active: defaultValues?.active ?? true,
      limits: {
        projects: defaultValues?.limits?.projects,
        members: defaultValues?.limits?.members,
        storageMb: defaultValues?.limits?.storageMb,
        entries: defaultValues?.limits?.entries,
        apiKeys: defaultValues?.limits?.apiKeys,
        webhooks: defaultValues?.limits?.webhooks,
      },
    },
  })

  const LIMIT_FIELDS: Array<{ name: keyof PlanFormValues['limits']; label: string }> = [
    { name: 'projects', label: 'Projects' },
    { name: 'members', label: 'Members' },
    { name: 'storageMb', label: 'Storage (MB)' },
    { name: 'entries', label: 'Entries' },
    { name: 'apiKeys', label: 'API Keys' },
    { name: 'webhooks', label: 'Webhooks' },
  ]

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium">Key</label>
          <input
            {...register('key')}
            disabled={isEdit}
            placeholder="free"
            className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none ring-ring focus:ring-1 disabled:opacity-50"
          />
          {errors.key && <p className="mt-1 text-xs text-destructive">{errors.key.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Name</label>
          <input
            {...register('name')}
            placeholder="Free"
            className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none ring-ring focus:ring-1"
          />
          {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Price / month (cents, blank = custom)</label>
          <input
            {...register('priceMonthly')}
            type="number"
            placeholder="0"
            className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none ring-ring focus:ring-1"
          />
        </div>
        <div className="flex items-center gap-2 self-end pb-1">
          <input type="checkbox" id="active" {...register('active')} className="rounded" />
          <label htmlFor="active" className="text-sm">Active</label>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Limits (blank = unlimited)</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {LIMIT_FIELDS.map((f) => (
            <div key={f.name}>
              <label className="mb-1 block text-xs text-muted-foreground">{f.label}</label>
              <input
                {...register(`limits.${f.name}`)}
                type="number"
                placeholder="∞"
                className="h-8 w-full rounded-md border bg-background px-3 text-sm outline-none ring-ring focus:ring-1"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : isEdit ? 'Update plan' : 'Create plan'}
        </Button>
      </div>
    </form>
  )
}
