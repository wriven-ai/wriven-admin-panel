# Guideline — Wriven Admin Panel

Working guide for any agent (or human) touching this repo. Read `AGENT.MD` for
the original build spec; **this file is the living source of truth** for how to
keep the panel correct and how to build UI. When the two disagree, this file
wins (and AGENT.MD should be updated).

---

## 1. Mission

Two standing goals, in priority order:

1. **API lockstep** — every screen uses the *current* Wriven backend
   (`/admin/*` on the gateway). The backend evolves fast; when it gains fields,
   endpoints, or validation rules, this panel must follow. A form that sends a
   property the DTO doesn't declare is a **guaranteed 400** (see §3.2) — that
   is a bug, not a nitpick.
2. **Professional UI** — no draft/sketch screens. Dense, calm, ops-console
   quality on the Wriven brand palette, light + dark. The **Plans page is the
   reference implementation** (`src/app/pages/plans/`) — match its structure,
   components, and polish level when rebuilding any other screen.

---

## 2. Where the backend truth lives

This repo is standalone — it must NOT import `@wriven/contracts`. Contracts are
**hand-mirrored** into `src/lib/types.ts`. When syncing, read (do not copy
blindly — translate):

| What | Where in the `wriven/` monorepo |
|---|---|
| Admin DTOs (request shapes) | `libs/shared/contracts/src/lib/dto/admin.dto.ts` |
| Response types (views/rows) | `libs/shared/contracts/src/lib/types/admin.types.ts` |
| Error codes | `libs/shared/contracts/src/lib/errors.ts` |
| HTTP routes + role guards | `apps/api-gateway/src/admin/*.controller.ts` |
| Domain rules / side effects | the matching service in `apps/auth-service/src/` or `apps/core-service/src/` |
| Admin API doc | `wriven/doc/admin-panel/api-contract.md` |

> ⚠️ `AGENT.MD` references a local `backend.md` — **that file does not exist
> here**. Use `wriven/doc/admin-panel/api-contract.md` + the contracts source
> instead.

### Sync workflow (do this for every feature)

1. Read the gateway controller → get exact routes, methods, role guards.
2. Read the DTO classes → mirror every accepted field, **no more, no less**.
3. Read the view interfaces → mirror into `src/lib/types.ts`.
4. Read the service → extract domain rules the UI must enforce or surface
   (conflicts, prerequisites, Stripe side effects, "read-only after create").
5. Update the screen. Update `src/lib/types.ts` in the same change.

---

## 3. API layer rules

Client: `src/lib/api.ts` (`api.get/post/patch/delete`). Envelope
`{ success, data }` / `{ success, error }`; `credentials: 'include'`; CSRF
header on mutations; 401 → store clear + `/login` redirect (already handled
centrally — don't re-implement).

### 3.1 Payload types mirror DTOs exactly

Keep a local interface per DTO in the feature's `queries.ts` (see
`app/pages/plans/queries.ts`). Field-for-field with the contract. Optional in
DTO = optional in the interface. If the DTO lacks it, the panel never sends it.

### 3.2 The gateway rejects unknown properties

`api-gateway` runs `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })`.
Sending one extra property = **400** before the request reaches the service.
Historical example: the Plans create form sent `isPublic` / `active` /
`trialDays` that `CreatePlanDto` never declared — creating a plan from the
panel was broken until fixed. Never "helpfully" add fields.

### 3.3 Map API errors, don't just toast them

`ApiError { status, code, message }`. Convention (see PlanForm):

- `CONFLICT` (duplicate key/email/slug) → `setError` on the offending field.
- `VALIDATION_ERROR` / domain rule → form-level banner with the server message
  (the server's wording is user-ready — surface it verbatim).
- Everything else → `sonner` error toast.

### 3.4 Domain rules belong in the UI too

Mirror enforceable rules client-side (same regex/min/max as the DTO) for fast
feedback, but the server stays authoritative — always handle its rejection
paths. Special cases to look for in services: read-only-after-create fields
(e.g. plan prices — Stripe owns them), prerequisites (paid plan needs a
price), side effects that need warning copy (deactivating a plan **archives
the Stripe product**; reactivating does not restore it).

### 3.5 Role gating

Roles: `admin` (all), `moderator` (oversight/moderation, no
plans/admins/settings), `member` (read-only). Gate with
`useAdminStore((s) => s.me?.role)`. Hide write UI for lesser roles — but the
server enforces anyway; hiding is UX, not security.

---

## 4. UI stack — non-negotiables

| Concern | Rule |
|---|---|
| Components | **shadcn** — always install via CLI, never hand-write primitives |
| Styling | **Tailwind CSS v4**, tokens already in `src/styles/globals.css` (Wriven palette — do not invent colors) |
| Charts | **Recharts** (`src/components/charts/`) |
| Icons | `lucide-react` |
| Forms | `react-hook-form` + `zod` (`zod/v4`) + `@hookform/resolvers` |
| Tables | TanStack Table through `components/data-table/DataTable.tsx` (built on shadcn table) |
| Toasts | `sonner` |
| Font | Manrope (already loaded). No italics. |

### 4.1 Installing shadcn components

```bash
cd wriven-admin-panel
pnpm dlx shadcn@latest add <component>
```

**Known CLI bug in this repo**: the CLI may write files into a literal `@/`
directory at the repo root instead of resolving the alias. After every add:

1. If `@/` appeared: `mv '@/components/ui/<x>.tsx' src/components/ui/` then
   `rm -rf '@'`.
2. Check imports: generated files import `@/components/ui/button` (lowercase),
   but this repo's file is `Button.tsx` (capital). Fix the import casing in the
   generated file or the Linux build breaks.
3. Reuse existing capital-named components (`Button`, `Badge`,
   `ConfirmDialog`) — don't create lowercase duplicates.

Already installed: `table`, `sheet`, `dialog`, `card`, `progress` (+ hand-rolled
`Button`, `Badge`, `ConfirmDialog`).

### 4.2 Brand tokens (already wired)

Use semantic classes only — `bg-background`, `text-muted-foreground`,
`border`, `bg-card`, `text-status-success` / `warning` / `error`,
`bg-sidebar-accent`, etc. Accent = Sovereign Emerald (`primary`). Never raw
hex; never invent grays. Dark mode comes free via the tokens — verify both.

### 4.3 Density & polish

Ops console density: base 13–14px, compact rows (`h-9`/`h-10`), `text-2xs` for
table meta/badges. Shadows: `--shadow-sm` cards, `--shadow-lg` overlays.
Radii `rounded-lg`. Visible focus rings (keyboard-heavy tool). No hover lift
on table rows. Texture classes (`.editorial-grid` etc.) only on login/empty
states — never on data screens.

---

## 5. Screen pattern (follow the Plans page)

```
PageHeader (title, description, primary action — admin-gated)
└─ FilterBar (URL-synced params: q, status, …)
└─ DataTable — sortable columns, skeleton loading, empty state
│    row click → detail Sheet (right side, keeps table context)
└─ create/edit → Dialog with RHF+zod form
└─ destructive → ConfirmDialog (state blast radius; reason if audited)
```

- **Sheet = inspect** (read-only detail + Stripe ids/etc. with copy buttons);
  **Dialog = mutate**. Don't swap them.
- Status badges: `Badge variant="success|warning|error|secondary|outline"` per
  AGENT.MD §6 mapping (active=success, suspended/failed=error,
  past-due/near-cap=warning).
- Every mutation: success toast + `invalidateQueries` on the feature key.
- Lists are server-paginated where the API paginates (pass page/limit/q as
  params, keep in URL). Plans is the exception — its endpoint returns the full
  array, so sort client-side.
- `DataTable` props: `table`, `columns`, `isLoading`, `emptyMessage`,
  `getRowClassName`, `onRowClick`.

### Data layer per feature

```
src/app/pages/<feature>/
  <Feature>Page.tsx          # screen: table + sheet + dialogs
  queries.ts                 # useQuery/useMutation hooks + local DTO interfaces
  components/<Feature>Form.tsx       # dialog form (RHF+zod, error mapping)
  components/<Feature>DetailSheet.tsx # read-only inspect sheet
```

Query keys in `src/lib/query-keys.ts`.

---

## 6. Definition of done (any screen)

- Payloads mirror current DTOs field-for-field (§3.2 checked against the
  contract file, not memory).
- `src/lib/types.ts` mirrors current views; no stale/phantom fields.
- Create/edit/detail/deactivate flows all work against the real API shape;
  server error codes mapped per §3.3.
- Reads use the §5 pattern; role-gated actions; light + dark look right.
- `pnpm lint` (no new errors) and `pnpm build` (tsc + vite) pass.
- One-line Conventional Commit; **never** an AI/Claude co-author trailer.

---

## 7. Current state (2026-08-15)

| Screen | State |
|---|---|
| Plans | ✅ Reference implementation — table + detail sheet + dialog form, discount breakdown, Stripe linkage. Rebuilt + synced (backend got `yearlyDiscountPercent`/`yearlyDiscountAmount`). |
| Others (users, workspaces, projects, content, media, api-keys, webhooks, audit, admins, settings, support) | Built earlier; **not yet audited against current contracts**. When touching one, run the §2 sync workflow first and rebuild to the Plans-page pattern. |
| Overview | Uses Recharts; verify metrics endpoint fields when touching. |

Known deferred items: plan assignment to workspaces lives on the workspace
detail screen (`AssignPlanDto`); no plan delete exists (deactivation is the
retire path).
