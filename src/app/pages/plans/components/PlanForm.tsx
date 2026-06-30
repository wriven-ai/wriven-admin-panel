import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import { Button } from '@/components/ui/Button'
import type { PlanView } from '@/lib/types'

const schema = z.object({
  key: z.string().min(1).regex(/^[a-z0-9_]+$/, 'Lowercase letters, numbers, underscores only'),
  name: z.string().min(1),
  description: z.string().optional(),
  priceMonthly: z.preprocess(
    (v) => (v === '' || v === null ? null : Number(v)),
    z.number().min(0).nullable().optional(),
  ),
  priceYearly: z.preprocess(
    (v) => (v === '' || v === null ? null : Number(v)),
    z.number().min(0).nullable().optional(),
  ),
  active: z.boolean(),
  isPublic: z.boolean(),
  trialDays: z.preprocess(
    (v) => (v === '' ? 0 : Number(v)),
    z.number().int().min(0),
  ),
  limits: z.record(z.string(), z.preprocess(
    (v) => (v === '' || v === null ? null : Number(v)),
    z.number().int().positive().nullable().optional(),
  )).optional(),
})

export type PlanFormValues = z.infer<typeof schema>

interface PlanFormProps {
  defaultValues?: Partial<PlanView>
  onSubmit: (values: PlanFormValues) => Promise<void>
  onCancel: () => void
  isEdit?: boolean
}

const LIMIT_KEYS = [
  'projects', 'members', 'environments', 'contentTypes',
  'entries', 'locales', 'storageMb', 'assetBandwidthGb',
  'apiRequestsPerMonth', 'apiKeys', 'webhooks',
]

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
      description: defaultValues?.description ?? '',
      priceMonthly: defaultValues?.priceMonthly ?? null,
      priceYearly: defaultValues?.priceYearly ?? null,
      active: defaultValues?.active ?? true,
      isPublic: defaultValues?.isPublic ?? true,
      trialDays: defaultValues?.trialDays ?? 0,
      limits: LIMIT_KEYS.reduce<Record<string, number | null | undefined>>((acc, k) => {
        acc[k] = (defaultValues?.limits as Record<string, number | null> | undefined)?.[k]
        return acc
      }, {}),
    },
  })

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
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium">Description</label>
          <input
            {...register('description')}
            placeholder="Optional description…"
            className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none ring-ring focus:ring-1"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Price / month (cents)</label>
          <input
            {...register('priceMonthly')}
            type="number"
            placeholder="0"
            className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none ring-ring focus:ring-1"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Price / year (cents)</label>
          <input
            {...register('priceYearly')}
            type="number"
            placeholder="0"
            className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none ring-ring focus:ring-1"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Trial days</label>
          <input
            {...register('trialDays')}
            type="number"
            placeholder="0"
            className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none ring-ring focus:ring-1"
          />
        </div>
        <div className="flex items-center gap-4 self-end pb-1">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" id="active" {...register('active')} className="rounded" />
            Active
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" id="isPublic" {...register('isPublic')} className="rounded" />
            Public
          </label>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Limits (blank = unlimited)</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {LIMIT_KEYS.map((k) => (
            <div key={k}>
              <label className="mb-1 block text-xs text-muted-foreground capitalize">
                {k.replace(/([A-Z])/g, ' $1').toLowerCase()}
              </label>
              <input
                {...register(`limits.${k}`)}
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
