import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import { Button } from '@/components/ui/Button'
import { ApiError } from '@/lib/api'
import { formatPrice } from '@/lib/format'
import {
  computeYearlyPrice,
  PLAN_FEATURE_DEFS,
  PLAN_LIMIT_KEYS,
  type AdminPlanView,
} from '@/lib/types'
import type { CreatePlanDto, UpdatePlanDto } from '../queries'

const centsField = z.preprocess(
  (v) => (v === '' || v === null ? null : Number(v)),
  z.number().int().min(0).nullable(),
)
const percentField = z.preprocess(
  (v) => (v === '' || v === null ? null : Number(v)),
  z.number().int().min(0).max(100).nullable(),
)
const limitField = z.preprocess(
  (v) => (v === '' || v == null ? null : Number(v)),
  z.number().int().min(1).nullable(),
)

const inputCls =
  'h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-1 disabled:opacity-50'

interface PlanFormProps {
  /** Present = edit mode (prices locked, key locked). */
  plan?: AdminPlanView
  onSubmit: (payload: CreatePlanDto | (UpdatePlanDto & { id: string })) => Promise<void>
  onCancel: () => void
}

export function PlanForm({ plan, onSubmit, onCancel }: PlanFormProps) {
  const isEdit = !!plan

  const schema = useMemo(
    () =>
      z
        .object({
          key: z
            .string()
            .regex(/^[a-z0-9_]{2,40}$/, '2–40 chars: lowercase, numbers, underscores'),
          name: z.string().min(2, 'At least 2 characters').max(80),
          description: z.string().max(200).optional(),
          priceMonthly: centsField,
          yearlyDiscountPercent: percentField,
          active: z.boolean(),
          limits: z.record(z.string(), limitField).optional(),
          features: z.record(z.string(), z.union([z.boolean(), z.string()])).optional(),
        })
        .superRefine((val, ctx) => {
          if (isEdit) return
          // Mirror backend: a paid plan needs at least one price — the form only
          // offers the monthly + discount path, so monthly is required.
          if (val.key !== 'free' && val.priceMonthly == null) {
            ctx.addIssue({
              code: 'custom',
              path: ['priceMonthly'],
              message: 'A paid plan needs a monthly price (free plan: leave empty).',
            })
          }
          if (val.yearlyDiscountPercent != null && val.priceMonthly == null) {
            ctx.addIssue({
              code: 'custom',
              path: ['yearlyDiscountPercent'],
              message: 'A discount needs a monthly price to discount from.',
            })
          }
        }),
    [isEdit],
  )

  type PlanFormInput = z.input<typeof schema>
  type PlanFormValues = z.output<typeof schema>

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PlanFormInput, unknown, PlanFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      key: plan?.key ?? '',
      name: plan?.name ?? '',
      description: plan?.description ?? '',
      // Prices are display-only in edit mode — never submitted.
      priceMonthly: plan?.priceMonthly ?? null,
      yearlyDiscountPercent: plan?.yearlyDiscountPercent ?? null,
      active: plan?.active ?? true,
      limits: Object.fromEntries(
        PLAN_LIMIT_KEYS.map(({ key }) => [key, plan?.limits?.[key] ?? null]),
      ),
      features: { ...(plan?.features ?? {}) },
    },
  })

  // Live preview — mirrors the server-side computation exactly.
  const monthly = watch('priceMonthly')
  const percent = watch('yearlyDiscountPercent')
  const yearlyPreview = useMemo(() => {
    if (isEdit) return null
    if (typeof monthly !== 'number' || typeof percent !== 'number') return null
    return computeYearlyPrice(monthly, percent)
  }, [isEdit, monthly, percent])

  async function submit(values: PlanFormValues) {
    const limits = Object.fromEntries(
      PLAN_LIMIT_KEYS.map(({ key }) => [key, values.limits?.[key] ?? null]),
    )
    const features = Object.fromEntries(
      PLAN_FEATURE_DEFS.flatMap(({ key }) =>
        values.features?.[key] === undefined ? [] : [[key, values.features![key]]],
      ),
    )

    const payload: CreatePlanDto | (UpdatePlanDto & { id: string }) = isEdit
      ? {
          id: plan.id,
          name: values.name,
          description: values.description || undefined,
          active: values.active,
          limits,
          features,
        }
      : {
          key: values.key,
          name: values.name,
          description: values.description || undefined,
          ...(values.priceMonthly != null ? { priceMonthly: values.priceMonthly } : {}),
          ...(values.yearlyDiscountPercent != null && values.priceMonthly != null
            ? { yearlyDiscountPercent: values.yearlyDiscountPercent }
            : {}),
          limits,
          features,
        }

    try {
      await onSubmit(payload)
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.code === 'CONFLICT') {
          setError('key', { message: e.message })
        } else {
          setError('root', { message: e.message })
        }
        return
      }
      throw e
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium">Key</label>
          <input
            {...register('key')}
            disabled={isEdit}
            placeholder="free"
            className={inputCls}
          />
          {errors.key && <p className="mt-1 text-xs text-destructive">{errors.key.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Name</label>
          <input {...register('name')} placeholder="Free" className={inputCls} />
          {errors.name && (
            <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium">Description</label>
          <input {...register('description')} placeholder="Optional description…" className={inputCls} />
          {errors.description && (
            <p className="mt-1 text-xs text-destructive">{errors.description.message}</p>
          )}
        </div>

        {isEdit ? (
          <p className="sm:col-span-2 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
            Pricing is set at creation and managed by Stripe — edit the plan's name,
            limits and features here.
          </p>
        ) : (
          <>
            <div>
              <label className="mb-1 block text-xs font-medium">Price / month (cents)</label>
              <input
                {...register('priceMonthly')}
                type="number"
                placeholder="0"
                className={inputCls}
              />
              {errors.priceMonthly && (
                <p className="mt-1 text-xs text-destructive">{errors.priceMonthly.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Yearly discount (%)</label>
              <input
                {...register('yearlyDiscountPercent')}
                type="number"
                placeholder="e.g. 17"
                className={inputCls}
              />
              {errors.yearlyDiscountPercent && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.yearlyDiscountPercent.message}
                </p>
              )}
            </div>
            <div className="sm:col-span-2 flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-xs">
              <span className="text-muted-foreground">Final yearly price</span>
              {yearlyPreview ? (
                <span className="font-medium">
                  {formatPrice(yearlyPreview.priceYearly)} / year{' '}
                  <span className="text-status-success">
                    (saves {formatPrice(yearlyPreview.discountAmount)}/yr)
                  </span>
                </span>
              ) : (
                <span className="text-muted-foreground">
                  Enter a monthly price + discount to preview
                </span>
              )}
            </div>
          </>
        )}

        {isEdit && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('active')} className="rounded" />
            Active
          </label>
        )}
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          Limits (blank = unlimited)
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {PLAN_LIMIT_KEYS.map(({ key, label }) => (
            <div key={key}>
              <label className="mb-1 block text-xs text-muted-foreground">{label}</label>
              <input
                {...register(`limits.${key}`)}
                type="number"
                placeholder="∞"
                className="h-8 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-1"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Features</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {PLAN_FEATURE_DEFS.map((f) =>
            f.type === 'boolean' ? (
              <label key={f.key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  {...register(`features.${f.key}`)}
                  className="rounded"
                />
                {f.label}
              </label>
            ) : (
              <div key={f.key}>
                <label className="mb-1 block text-xs text-muted-foreground">{f.label}</label>
                <select {...register(`features.${f.key}`)} className="h-8 rounded-md border border-input bg-background px-2 text-sm">
                  <option value="">—</option>
                  {f.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            ),
          )}
        </div>
      </div>

      {errors.root && (
        <p className="rounded-md bg-status-error/10 px-3 py-2 text-xs text-status-error">
          {errors.root.message}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : isEdit ? 'Update plan' : 'Create plan'}
        </Button>
      </div>
    </form>
  )
}
