import { useState } from 'react'
import { Check, Copy, Pencil } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { formatPrice } from '@/lib/format'
import {
  PLAN_FEATURE_DEFS,
  PLAN_LIMIT_KEYS,
  type AdminPlanView,
} from '@/lib/types'

interface PlanDetailSheetProps {
  plan: AdminPlanView | null
  canWrite: boolean
  onClose: () => void
  onEdit: (plan: AdminPlanView) => void
  onToggleActive: (plan: AdminPlanView) => void
}

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-2xs font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h3>
      {children}
    </section>
  )
}

export function PlanDetailSheet({
  plan,
  canWrite,
  onClose,
  onEdit,
  onToggleActive,
}: PlanDetailSheetProps) {
  return (
    <Sheet open={!!plan} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
        {plan && (
          <>
            <SheetHeader>
              <div className="flex flex-wrap items-center gap-2 pr-8">
                <SheetTitle className="text-lg font-semibold">{plan.name}</SheetTitle>
                <Badge variant="outline" className="font-mono">
                  {plan.key}
                </Badge>
                {plan.active ? (
                  <Badge variant="success">Active</Badge>
                ) : (
                  <Badge variant="error">Inactive</Badge>
                )}
                {!plan.isPublic && <Badge variant="secondary">Private</Badge>}
              </div>
              <SheetDescription>
                {plan.description || 'No description.'}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 px-6 pb-6">
              <Section title="Pricing">
                <div className="rounded-lg bg-card shadow-[var(--shadow-sm)] p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Monthly</span>
                    <span className="font-medium">
                      {plan.priceMonthly != null ? `${formatPrice(plan.priceMonthly)} / mo` : '—'}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-muted-foreground">Yearly</span>
                    <span className="font-medium">
                      {plan.priceYearly != null ? `${formatPrice(plan.priceYearly)} / yr` : '—'}
                    </span>
                  </div>
                  {plan.yearlyDiscountPercent != null && (
                    <p className="mt-2 text-xs text-status-success">
                      {plan.yearlyDiscountPercent}% yearly discount — saves{' '}
                      {formatPrice(plan.yearlyDiscountAmount)} / yr
                    </p>
                  )}
                  <p className="mt-2 text-2xs text-muted-foreground">
                    Managed by Stripe — pricing is set at creation.
                  </p>
                </div>
              </Section>

              <Section title="Limits">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-lg bg-card shadow-[var(--shadow-sm)] p-4 text-xs">
                  {PLAN_LIMIT_KEYS.map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium">
                        {plan.limits?.[key] ?? '∞'}
                      </span>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Features">
                <div className="space-y-1.5 rounded-lg bg-card shadow-[var(--shadow-sm)] p-4 text-xs">
                  {PLAN_FEATURE_DEFS.map(({ key, label }) => {
                    const value = plan.features?.[key]
                    if (key === 'supportTier') {
                      return (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-muted-foreground">{label}</span>
                          <span className="font-medium">{value ?? '—'}</span>
                        </div>
                      )
                    }
                    return (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-muted-foreground">{label}</span>
                        {value ? (
                          <Check className="h-3.5 w-3.5 text-status-success" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </Section>

              <Section title="Stripe linkage">
                <div className="space-y-1.5 rounded-lg bg-card shadow-[var(--shadow-sm)] p-4 text-xs">
                  {plan.stripeProductId ? (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">Product</span>
                        <CopyId value={plan.stripeProductId} />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">Price · monthly</span>
                        {plan.stripePriceIdMonthly ? (
                          <CopyId value={plan.stripePriceIdMonthly} />
                        ) : (
                          <span>—</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">Price · yearly</span>
                        {plan.stripePriceIdYearly ? (
                          <CopyId value={plan.stripePriceIdYearly} />
                        ) : (
                          <span>—</span>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground">
                      Not linked — free plans never touch Stripe.
                    </p>
                  )}
                </div>
              </Section>
            </div>

            {canWrite && (
              <div className="mt-auto flex gap-2 p-4">
                <Button variant="outline" size="sm" onClick={() => onEdit(plan)}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
                {plan.active ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onToggleActive(plan)}
                  >
                    Deactivate
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => onToggleActive(plan)}>
                    Reactivate
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
