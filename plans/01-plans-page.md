# Plan 01 — Plans page rebuild (table + detail sheet + correct CRUD)

Date: 2026-08-15
Scope: `wriven-admin-panel` — `src/app/pages/plans/**`, `src/lib/types.ts`, shared UI.

## 1. Why

The backend plan API evolved (Stripe-backed plans, stricter DTOs, new limit keys)
and the admin panel Plans page drifted out of sync — its create/update payloads
are now **rejected by the gateway**. The UI is also a rough draft (card list,
inline edit screen) instead of the professional table-based design the rest of
the console uses.

## 2. Backend reality (source of truth: `@wriven/contracts` + gateway controller)

Gateway: `wriven/apps/api-gateway/src/admin/admin-plans.controller.ts`
Service: `wriven/apps/auth-service/src/admin/admin-plans.service.ts`
DTOs: `wriven/libs/shared/contracts/src/lib/dto/admin.dto.ts` (§ `CreatePlanDto`, `UpdatePlanDto`)

**Endpoints (there is NO delete):**

| Method | Path | DTO | Notes |
|---|---|---|---|
| GET | `/admin/plans` | — | Returns `AdminPlanView[]`, ordered by `sortOrder` |
| POST | `/admin/plans` | `CreatePlanDto` | `admin` role only, audited `plan.create` |
| PATCH | `/admin/plans/:id` | `UpdatePlanDto` | `admin` role only, audited `plan.update` |

**`CreatePlanDto` accepts ONLY:** `key` (2–40 chars), `name` (2–80),
`description?` (≤200), `priceMonthly?` (int cents ≥0), `priceYearly?` (int cents
≥0), `limits?`, `features?`.
→ NOT accepted: `isPublic`, `active`, `trialDays`, `currency`, `sortOrder`.

**`UpdatePlanDto` accepts ONLY:** `name?`, `description?`, `active?`, `limits?`,
`features?`.
→ Prices are **read-only after create** (Stripe owns pricing — change = new
Stripe Price, not this API). `key` immutable.

**Gateway `ValidationPipe` has `whitelist: true, forbidNonWhitelisted: true`** —
extra properties cause a **400**, not silent stripping.

**Domain rules the UI must surface:**
- Duplicate `key` → `CONFLICT` ("A plan with that key already exists.")
- Paid plan (`key !== 'free'`) with no monthly AND no yearly price →
  `VALIDATION_ERROR` ("needs at least one price")
- Stripe product/price creation or archival can fail → `STRIPE_SYNC_FAILED`
- Setting `active: false` on a Stripe-linked plan **archives the Stripe Product
  and deactivates its Prices** (retire). Reactivation does NOT un-archive on
  Stripe — show a warning about this in the deactivate confirm dialog.

**`AdminPlanView` = `PlanView` + `stripeProductId`, `stripePriceIdMonthly`,
`stripePriceIdYearly`** (all `string | null`). Free plan (`key === 'free'`) never
touches Stripe → null ids.

**Current `PlanLimits` keys (13):** `projects`, `members`, `environments`,
`contentTypes`, `entries`, `locales`, `storageMb`, `assetBandwidthGb`,
`apiRequestsPerMonth`, `apiKeys`, `webhooks`, `revisionsPerEntry`,
`aiTextRequestsPerMonth`, `aiImageRequestsPerMonth`. `null`/absent = unlimited.

**Current `PlanFeatures` keys:** `scheduledPublishing`, `revisionHistory`,
`customRoles`, `auditLog`, `previewApi`, `supportTier` (`community` | `email` |
`priority`). (No `sso`.)

## 3. Gaps found in the admin panel today

1. **`queries.ts` create payload is wrong** — form sends `isPublic`, `active`,
   `trialDays` on create → gateway 400 (forbidden properties). Creating a plan
   from the panel is currently **broken**.
2. **`queries.ts` update payload is wrong** — form sends `priceMonthly` /
   `priceYearly` on update → gateway 400. Prices are read-only after create.
3. **`PlanView` type missing Stripe fields** — panel type lacks
   `stripeProductId` / `stripePriceIdMonthly` / `stripePriceIdYearly`; API
   actually returns `AdminPlanView`. No place displays the Stripe linkage.
4. **`PlanLimits` type stale** — missing `revisionsPerEntry`,
   `aiTextRequestsPerMonth`, `aiImageRequestsPerMonth`; `PlanFeatures` has
   non-contract `sso`.
5. **Form `LIMIT_KEYS` stale** — same 3 missing keys; no `features` editing at
   all (DTO accepts `features` on create + update).
6. **No error surfacing** — domain errors (CONFLICT duplicate key, paid-plan
   needs price, STRIPE_SYNC_FAILED) not mapped to form-field or toast messages.
7. **UI is draft** — stacked cards, full-page replace for edit, no table, no
   detail view, no deactivate flow despite AGENT.MD §5/§6 conventions (table +
   sheet inspect + dialog create, status badges, confirm on destructive).

## 4. Target design

Per AGENT.MD §5/§6 conventions, brand palette from §7 (Sovereign Emerald accent,
Manrope, `--shadow-sm` cards, soft status badges):

```
PageHeader ("Plans" + description + "New plan" primary button, admin-only)
└─ DataTable (shadcn table) — client-side sorted (list endpoint returns all)
     columns: Plan (name + key mono badge) · Price (monthly/yearly, "Free" when
              null/null) · Status (Active/Inactive + Public/Private badges) ·
              Limits (top 3 compact "members 5 · projects 3 …" + "+n") ·
              Stripe (linked ✓ / — ) · row ⋯ actions (View · Edit ·
              Deactivate/Reactivate)
└─ Row click → detail Sheet (right side, keeps table context)
     Plan header: name, key badge, status badges, price
     Sections: Description · Pricing (monthly/yearly final/currency — display
     only, "managed by Stripe"; yearly row shows discount % + amount saved
     when present) · Limits grid (all 13 keys, ∞ =
     unlimited) · Features (checkmarks + support tier) · Stripe linkage
     (product/price ids, mono, copy button, "not linked — free plan" state)
     Footer: Edit button (admin), Deactivate/Reactivate (admin, confirm)
└─ Create/Edit → Dialog (RHF + zod form, §6 spec)
└─ Deactivate → ConfirmDialog (states Stripe archival blast radius, audited)
```

Role gating: all write actions hidden unless `admin` (server enforces anyway);
`member`/`moderator` get read-only table + sheet.

## 5. Implementation steps

### 5.0 Backend (wriven repo) — discount breakdown in DB

**5.0.1 Schema** — `apps/auth-service/src/db/schema/index.ts`, `plans` table,
next to `priceMonthly`/`priceYearly`:

```ts
// Yearly pricing breakdown: percent given → final computed server-side.
// priceYearly always holds the FINAL amount Stripe is charged.
yearlyDiscountPercent: integer('yearly_discount_percent'), // 0–100, null = none
yearlyDiscountAmount: integer('yearly_discount_amount'),    // cents saved vs monthly×12
```

Then `pnpm db:auth:generate` + `pnpm db:auth:migrate` (both nullable → no
backfill; existing rows read as "no discount, explicit yearly").

**5.0.2 Contracts** — `libs/shared/contracts`:

- `CreatePlanDto`: add `@IsOptional() @Type(() => Number) @IsInt() @Min(0)
  @Max(100) yearlyDiscountPercent?: number`. Rule: if set, `priceMonthly` is
  required and `priceYearly` must NOT also be sent (server computes it —
  sending both = `VALIDATION_ERROR`).
- `AdminPlanView` **and** `PlanView`: add `yearlyDiscountPercent: number |
  null` and `yearlyDiscountAmount: number | null` (tenant pricing page can
  render "save X%" from it). `toAdminView` maps them.

**5.0.3 `AdminPlansService.create`** (`apps/auth-service/src/admin/admin-plans.service.ts`):

- Compute when `yearlyDiscountPercent` present:
  `priceYearly = Math.round(monthly * 12 * (1 - percent / 100))`,
  `yearlyDiscountAmount = monthly * 12 - priceYearly`.
- Store all three columns; pass computed `priceYearly` to `createPrices` as
  the Stripe `unit_amount` (unchanged signature).
- Add `metadata: { planKey, billingCycle: 'yearly', yearlyDiscountPercent }`
  to the yearly Stripe Price for traceability.
- `UpdatePlanDto` unchanged — prices/discount stay create-only.

Commit backend separately (`feat: store yearly discount breakdown on plans`)
before touching the panel.

### 5.1 shadcn components — install, do NOT hand-write

```bash
pnpm dlx shadcn@latest add table sheet dialog
```

(`table` powers the DataTable rewrite; `sheet` the detail view; `dialog` the
create/edit form. Reuse existing `Badge`, `Button`, `ConfirmDialog`.)

### 5.2 `src/lib/types.ts` — sync with contracts

- Extend plan types: add `AdminPlanView extends PlanView` with the 3 Stripe
  fields; `usePlans` etc. typed as `AdminPlanView`.
- `PlanLimits`: add `revisionsPerEntry`, `aiTextRequestsPerMonth`,
  `aiImageRequestsPerMonth`.
- `PlanView`: add `yearlyDiscountPercent` / `yearlyDiscountAmount` (per §5.0.2).
- `PlanFeatures`: remove `sso` (not in contracts).
- Export a `PLAN_LIMIT_KEYS` ordered list (13 keys + display labels) and
  `PLAN_FEATURE_DEFS` (feature key → label + type: boolean | supportTier enum)
  so form + sheet share one definition.

### 5.3 `src/app/pages/plans/queries.ts` — fix payloads

- `CreatePlanDto` (local interface) = exactly the contract fields: `key`, `name`,
  `description?`, `priceMonthly?`, `priceYearly?`, `yearlyDiscountPercent?`,
  `limits?`, `features?` — but the form only ever sends `priceMonthly` +
  `yearlyDiscountPercent` (server computes `priceYearly`).
- `UpdatePlanDto` = `name?`, `description?`, `active?`, `limits?`, `features?`.
- Return type `AdminPlanView`; invalidate `qk.plans.list()` (keep).

### 5.4 `components/PlanForm.tsx` — rebuild (dialog-sized)

- **Prices: create-only.** Create mode has price inputs; edit mode has none
  (Stripe owns pricing after create — view prices display-only in table/sheet).
- Create mode: key (regex `^[a-z0-9_]{2,40}$`, disabled in edit), name,
  description (≤200), then pricing block:
  - `priceMonthly` (int cents, required for paid plans)
  - `yearlyDiscountPercent` (0–100, optional)
  - Final yearly price = **read-only derived field**, live-computed with the
    same formula as the server (`round(monthly × 12 × (1 − p/100))`), shown as
    currency + "saves $X/yr". Not a payload field — server is authoritative.
  - Validation: percent requires monthly; at least one price dimension unless
    `key === 'free'` (mirror backend, server still authoritative).
- **Yearly pricing via discount — DB stores the breakdown:** today there is no
  discount column, no discount DTO field, and Stripe gets raw `unit_amount`
  cents. Target: admin enters monthly price + "Yearly discount %" → final
  yearly price is **computed server-side** (`priceYearly = round(monthly × 12 ×
  (1 − p/100))` cents) and Stripe receives that calculated amount, while the DB
  stores `yearlyDiscountPercent` + `yearlyDiscountAmount` (cents saved vs
  monthly×12) alongside the final `priceYearly`. See §5.0 backend work.
- Edit mode: key disabled; name/description/active toggle editable. No price
  fields, no discount field.
- **No trial fields** — `trialDays` is not in either DTO; remove from the form
  and from the sheet.
- Limits section: grid over `PLAN_LIMIT_KEYS`, blank = unlimited (null).
- Features section: checkboxes + `supportTier` select.
- Map API errors to the form: `CONFLICT` → key field ("Key already in use"),
  `VALIDATION_ERROR` → form-level, `STRIPE_SYNC_FAILED` → toast.

### 5.5 `components/PlanDetailSheet.tsx` — new

Read-only inspect sheet per §4. All sections; Stripe ids with copy-to-clipboard;
`∞` for null limits; feature checkmarks; footer actions gated on role.

### 5.6 `PlansPage.tsx` — rebuild

- TanStack Table (client sort — no server pagination on this endpoint),
  `DataTable` wrapper, shadcn table styling, loading skeleton rows, empty state
  with "New plan" CTA.
- Row click → sheet (selected plan id state); ⋯ menu → View / Edit (dialog) /
  Deactivate|Reactivate.
- Deactivate via existing `ConfirmDialog`: states "Archives the Stripe product
  and deactivates its prices; workspaces on this plan keep access until
  reassigned. Reactivating here does not restore the Stripe product."
- Success/error toasts (sonner) on all mutations.

### 5.7 Verify

```bash
pnpm lint && pnpm build
pnpm dev   # manual pass against local gateway: list, open sheet, create free
           # plan, create paid plan (monthly + discount → auto yearly),
           # duplicate-key error, edit name/limits/features,
           # deactivate confirm flow
```

## 6. Out of scope

- Plan assignment to workspaces (lives on workspace detail screen,
  `AssignPlanDto` — separate task).
- Delete endpoint (does not exist; deactivation IS the retire path).
- Editing `trialDays` / `isPublic` / `sortOrder` / `currency` (not in either
  DTO — display-only).
- Backend changes beyond §5.0 (schema + contracts + create-path compute only —
  no update-path or billing-flow changes).

## 7. Definition of done

- Create free + paid plans from the panel succeeds (no 400 from extra props);
  duplicate key shows field error; paid plan without price blocked with clear
  message; discount % auto-computes the yearly price correctly.
- Edit updates name/description/limits/features/active only; no price, no
  discount, no trial fields in edit; prices display-only in table + sheet.
- Table + sheet + dialog follow the Wriven brand system (light + dark).
- Stripe linkage ids visible and copyable in the sheet.
- Deactivate requires confirm that states the Stripe archival effect.
- `pnpm lint` and `pnpm build` pass.
