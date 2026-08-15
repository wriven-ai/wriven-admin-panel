# Users Module Rebuild — Tabbed User Hub + Suspended Filter Fix

## Context

Users module is the last flat table + hand-rolled mini sheet (`UserDetailSheet.tsx`).
Goal: same hub pattern as Workspaces/Projects — row click → `/users/:id` page with
tabs (Details, Workspaces, Projects) showing everything about the user, with
cross-links into the workspace and project hubs.

Backend audit (Guideline §2) found:

- **API surface is complete** — no new endpoints needed for the hub itself:
  - `GET /admin/users?page&limit&q` → `Paginated<AdminUserRow>`
  - `GET /admin/users/:id` → `AdminUserDetail` (embeds `workspaces[]` {id,name,slug,role}
    + `projects[]` {id,name,workspaceId,role})
  - `PATCH /admin/users/:id` `[admin, moderator]` `AdminUpdateUserDto { suspended?, emailVerified? }`
  - `DELETE /admin/users/:id` `[admin]` — hard delete; FK 23503 → `CONFLICT`
    "owns workspaces or projects" (surface verbatim)
- **Live bug**: [users/queries.ts](wriven-admin-panel/src/app/pages/users/queries.ts) sends
  `suspended` param but `AdminListQueryDto` (page/limit/q only) doesn't declare it →
  gateway `forbidNonWhitelisted` **400s** whenever the Status filter is used
  (Guideline §3.2 historical bug class, present today in UsersPage).
- Domain rules to mirror (auth-service `admin-tenancy.service.ts` `updateUser`):
  - suspending revokes all refresh tokens (warn: kills sessions immediately)
  - delete is hard, fails with CONFLICT if user owns workspaces/projects

Fix choice for the filter: add `suspended` to the backend (new
`AdminUsersQueryDto extends AdminListQueryDto`) — same precedent as the projects
workspaceId filter; the moderation filter is worth keeping in the UI.

---

## Part 1 — Backend (`wriven/`)

### Contracts

`libs/shared/contracts/src/lib/dto/admin.dto.ts`:

```ts
/** Admin users list — pagination/search plus optional suspension filter. */
export class AdminUsersQueryDto extends AdminListQueryDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  suspended?: boolean;
}
```

(Query params arrive as strings; existing DTOs use `Type(() => Number)` for ints —
booleans need the transform.)

### Gateway

`apps/api-gateway/src/admin/admin-users.controller.ts`: `list(@Query() query: AdminListQueryDto)`
→ `AdminUsersQueryDto`.

### Auth-service

`admin-tenancy.service.ts` `listUsers()` (~line 36): accept `AdminUsersQueryDto`;
compose conds — `q` ilike OR-group kept, plus when `suspended !== undefined`:
`suspended === true ? isNotNull(users.suspendedAt) : isNull(users.suspendedAt)`.
Controller handler signature (`admin.controller.ts` USERS_LIST) too.

### Doc

`wriven/doc/admin-panel/api-contract.md`: users section gets `&suspended?`.

Commit: `feat: add suspended filter to admin users list`.

Verify: `pnpm nx run-many -t build lint typecheck -p contracts api-gateway auth-service`.

---

## Part 2 — Admin panel (`wriven-admin-panel/`)

### Structure (`src/app/pages/users/`)

```
UsersPage.tsx                 # table + suspended filter (now valid) + row click → /users/:id
UserDetailPage.tsx            # NEW hub at /users/:id
queries.ts                    # fix suspended param (already correct once DTO exists)
components/UserDetailSheet.tsx  # DELETED
components/tabs/DetailsTab.tsx    # profile + admin actions
components/tabs/WorkspacesTab.tsx # from detail.workspaces, link rows → /workspaces/:id
components/tabs/ProjectsTab.tsx   # from detail.projects, link rows → /projects/:id
```

### UsersPage

- Keep FilterBar (q + status select — works after backend fix).
- Row click + View → `navigate(\`/users/${id}\`)`; remove sheet.
- Table stays read-only (no inline mutations).

### UserDetailPage

- Back link → `/users`, PageHeader (name + email), badges: suspended/error,
  verified/success-or-warning, provider/outline.
- Stat strip: workspaceCount, projects length, member since, user id (copy).
- Tabs, URL-synced `?tab=` (reuse WorkspaceDetailPage tab pattern):
  - **Details** — profile card (id copy, email, name, provider, verified,
    suspended, joined). Actions card, role-gated:
    - Suspend/Unsuspend (admin+mod): ConfirmDialog with warning copy
      "Suspending revokes all active sessions immediately" (§3.4 side-effect rule).
    - Mark verified/unverified toggle (admin+mod).
    - Delete (admin only): ConfirmDialog `requireTyping={detail.email}`,
      destructive; CONFLICT error surfaced verbatim in a banner (§3.3 — server
      wording about owned workspaces/projects is user-ready).
    - `PATCH` mirrors `AdminUpdateUserDto` field-for-field (suspended /
      emailVerified only — never anything else, §3.2).
  - **Workspaces** — DataTable from `detail.workspaces`: name + /slug, role
    badge; row click → `/workspaces/:id` (cross-hub link).
  - **Projects** — DataTable from `detail.projects`: name, workspaceId mono,
    role badge; row click → `/projects/:id`.
- Mutations invalidate `qk.users.list` + `qk.users.detail(id)`.

### Reuse

- Hub scaffolding pattern from
  [WorkspaceDetailPage.tsx](wriven-admin-panel/src/app/pages/workspaces/WorkspaceDetailPage.tsx)
  (TAB_VALUES/TAB_LABELS, `?tab=` searchParams, stat `<dl>`, TabsList variant="line").
- `ConfirmDialog` (`requireTyping`), `Badge`, `CopyId` pattern (inline local copy
  as in ProjectsTab/ContentTab), `useUpdateUser` / `useDeleteUser` (exist).

### Routing

`src/router.tsx`: add `users/:id` → `UserDetailPage` (after `users`).

### Definition of done (Guideline §6)

Payloads mirror `AdminUpdateUserDto`; `types.ts` AdminUserRow/Detail already
current (verified against contracts); lint + build pass; light+dark on tokens;
actions role-gated. Update `plans/progress.md` Users → ✅.

Commit: `feat: rebuild users module as tabbed user hub` (panel repo).

---

## Verification

1. Backend: `pnpm nx run-many -t build lint typecheck -p contracts api-gateway auth-service`.
2. Panel: `pnpm lint && pnpm build`.
3. Runtime smoke: users list → filter Status=Suspended (no 400 now) → open a
   user → Workspaces tab links to workspace hub, Projects tab to project hub →
   suspend (confirm dialog warns) → unsuspend → as moderator: delete hidden;
   as admin: delete a user who owns a workspace → CONFLICT banner shows server
   message verbatim.
