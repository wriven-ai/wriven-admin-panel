# Workspace Module Rebuild — Tabbed Workspace Hub + Backend Scope Additions

Status: approved, implementing (2026-08-15). Tracked in `plans/progress.md`.

## Context

Admin panel Workspaces screen is a flat table + hand-rolled mini sheet. Goal:
full-fledged workspace detail hub — click a workspace row → dedicated page with
shadcn **Tabs** exposing everything in that workspace: projects, members,
content types, content entries, media, API keys, webhooks, plan.

Backend audit found two gaps (approved to fix in `wriven/`):

1. **No admin content-type endpoint** — only user-facing
   `core.contentType.list` (projectId-scoped). Blocks the Content Types tab.
2. **`GET /admin/projects` has no `workspaceId` filter** —
   `AdminListQueryDto` is page/limit/q only. Blocks a full Projects tab
   (detail embed only has id/name/slug).

Everything else already supports `workspaceId`:
`/admin/content`, `/admin/media`, `/admin/api-keys`, `/admin/webhooks`
(`AdminScopedQueryDto` / `AdminContentQueryDto`), and
`GET /admin/workspaces/:id` returns `AdminWorkspaceDetail` with embedded
`members[]` + `projects[]`.

---

## Part 1 — Backend (`wriven/`, separate commits from panel)

### 1a. Contracts (`libs/shared/contracts/src/lib/`)

**`dto/admin.dto.ts`** — new DTO (do NOT widen `AdminListQueryDto`; it's shared
by users/workspaces lists and the gateway whitelist-rejects unknown props):

```ts
/** Admin projects list (AdminListQueryDto + tenancy scope). */
export class AdminProjectsQueryDto extends AdminListQueryDto {
  @IsOptional()
  @IsString()
  workspaceId?: string;
}
```

**`messages.ts`** — add to the core-service moderation block of
`ADMIN_PATTERNS` (~line 215):

```ts
CONTENT_TYPES_LIST: 'admin.contentTypes.list',
```

**`types/admin.types.ts`** — add under the moderation-views block:

```ts
/** A content type row in the admin workspace Content Types tab (core-service). */
export interface AdminContentTypeRow {
  id: string;
  workspaceId: string;
  projectId: string;
  name: string;
  apiId: string;
  fields: FieldDef[]; // from cms.types.ts (same package)
  createdAt: string;
  updatedAt: string;
}
```

No barrel change needed — files already `export *`'d from `src/index.ts`.

### 1b. Gateway (`apps/api-gateway/src/admin/`)

New `admin-content-types.controller.ts`, read-only exemplar =
`admin-webhooks.controller.ts`:

```ts
@UseGuards(AdminJwtGuard, AdminRolesGuard)
@UseInterceptors(AuditInterceptor)
@Controller('admin/content-types')
export class AdminContentTypesController {
  constructor(@Inject(SERVICE_TOKENS.CORE_SERVICE) private readonly core: ClientProxy) {}

  @Get()
  list(@Query() query: AdminScopedQueryDto) {
    return firstValueFrom(this.core.send(ADMIN_PATTERNS.CONTENT_TYPES_LIST, query));
  }
}
```

Register in `app/app.module.ts` controllers array.

`admin-projects.controller.ts` — change `list(@Query() query: AdminListQueryDto)`
→ `AdminProjectsQueryDto`.

### 1c. Core-service (`apps/core-service/src/admin/`)

New `admin-content-types.service.ts` mirroring `admin-webhooks.service.ts`:

- `list(query: AdminScopedQueryDto): Promise<Paginated<AdminContentTypeRow>>`
- `conds`: `eq(contentTypes.workspaceId, …)` if set, `eq(contentTypes.projectId, …)`
  if set, always `isNull(contentTypes.deletedAt)` (schema:
  `core_svc.content_types`, `apps/core-service/src/db/schema/index.ts:34`)
- `page ?? 1`, `limit ?? 20`, `orderBy desc(contentTypes.createdAt)`,
  `Promise.all([findMany, $count])`, ISO-stringify dates in `toRow()`
- Inject `@Inject(DRIZZLE) db: DrizzleDB<typeof schema>`

Register: handler in `admin.controller.ts`
(`@MessagePattern(ADMIN_PATTERNS.CONTENT_TYPES_LIST)`), provider in
`admin.module.ts`.

### 1d. Auth-service (`apps/auth-service/src/admin/`)

`admin-tenancy.service.ts` `listProjects()` (~line 249): compose `where` as
array of conds — existing `q` ilike OR-group kept; add
`eq(projects.workspaceId, query.workspaceId)` when set, combine with `and(...)`.
Update signature to `AdminProjectsQueryDto`. Controller handler signature too
(`admin.controller.ts` PROJECTS_LIST).

### 1e. Doc

`wriven/doc/admin-panel/api-contract.md`: add `GET /admin/content-types` section
+ `AdminContentTypeRow` shape; document `workspaceId` on `GET /admin/projects`.

### Commits (backend, one-line conventional, no AI trailers)

1. `feat: add admin content-types list endpoint` (contracts + gateway + core + doc)
2. `feat: add workspaceId filter to admin projects list` (contracts + gateway + auth + doc)

Verify: `pnpm nx run-many -t build lint typecheck` (affected), then smoke via
dev gateway: `curl 'localhost:5000/v1/admin/projects?workspaceId=<id>'` and
`/v1/admin/content-types?workspaceId=<id>` with admin session.

---

## Part 2 — Admin panel (`wriven-admin-panel/`)

### 2a. shadcn Tabs

```bash
cd wriven-admin-panel && pnpm dlx shadcn@latest add tabs
```

Per Guideline §4.1: check for literal `@/` dir at repo root → move
`components/ui/tabs` file into `src/components/ui/`, fix import casing vs
capital-named locals. Generated file will be lowercase `tabs.tsx` — consistent
with `dialog.tsx`/`sheet.tsx`, keep lowercase.

### 2b. Types + query keys

`src/lib/types.ts`: mirror `AdminContentTypeRow` (Guideline §2/§6 — no stale
fields). `src/lib/query-keys.ts`: add `contentTypes.list(params)`.

### 2c. Routing — new detail route

`src/router.tsx`: add `workspaces/:id` → `WorkspaceDetailPage` (precedent:
`support/:id`). WorkspacesPage row click + View button →
`navigate(\`/workspaces/${id}\`)`. The old `WorkspaceDetailSheet` hand-rolled
sheet is deleted (replaced by the page; keeps the codebase free of a divergent
pattern).

### 2d. Feature structure (`src/app/pages/workspaces/`)

```
WorkspacesPage.tsx           # table (as-is) + navigate on row click
WorkspaceDetailPage.tsx      # hub: PageHeader w/ back link + Tabs
queries.ts                   # existing hooks + useWorkspaceContentTypes({ workspaceId })
components/
  WorkspaceDetailSheet.tsx   # DELETED
  tabs/ProjectsTab.tsx       # useProjects({ workspaceId }) → DataTable, row → project sheet (fetch :id)
  tabs/MembersTab.tsx        # from detail.members — DataTable
  tabs/ContentTypesTab.tsx   # new hook → DataTable, row click → inspect Sheet (fields list)
  tabs/ContentTab.tsx        # useContent({ workspaceId }) → DataTable
  tabs/MediaTab.tsx          # useMediaAssets({ workspaceId }) + storage usage row
  tabs/ApiKeysTab.tsx        # useApiKeys({ workspaceId })
  tabs/WebhooksTab.tsx       # useWebhooks({ workspaceId })
  tabs/PlanTab.tsx           # plan card + AssignPlan select (admin-gated) — ported from old sheet
```

Tab pattern rules (Guideline §5):

- Reuse the existing scoped hooks in sibling feature `queries.ts` files —
  import `useProjects` from `../projects/queries` etc. Do not duplicate.
  Each tab holds its own `page` state + `Pagination`; DataTable + skeleton +
  empty message.
- Tabs = read/inspect. Mutations that already exist (revoke key, disable
  webhook, takedown entry, purge media) surface as row actions where the
  source module had them — reuse the sibling modules' mutation hooks.
- Plan tab: keep the admin-gated assign flow (`useAssignPlan`), invalidate
  `qk.workspaces.detail(id)`.
- URL-sync the active tab (`?tab=projects`) so refresh/back keeps context —
  consistent with the app's FilterBar URL habit; keep it light
  (`useSearchParams` on the Tabs value).
- Status badges per §5 mapping; badges for role (owner/admin/member),
  entry status, webhook active/lastStatus, media kind.
- Light + dark via tokens only. Ops density per §4.3.
- Header stat strip: memberCount, projectCount, planName, subscriptionStatus,
  storage usage (from `/admin/media/usage` filtered by workspaceId).

### 2e. Definition of done (Guideline §6)

`pnpm lint` + `pnpm build` pass; payloads mirror DTOs; `types.ts` current;
light+dark verified; role-gated actions. Update
`wriven-admin-panel/plans/progress.md`: Workspaces → ✅ with note.

Commit: `feat: rebuild workspaces module as tabbed workspace hub` (panel repo,
own git).

---

## Verification

1. Backend: `pnpm nx run-many -t build lint typecheck` in `wriven/`.
2. Panel: `pnpm lint && pnpm build` in `wriven-admin-panel/`.
3. Runtime (`pnpm dev:gateway`, `dev:auth`, `dev:core` + panel `pnpm dev`):
   login as admin → Workspaces → open a workspace → verify each tab loads real
   data; Projects tab shows only that workspace's projects incl. deleted flag;
   Content Types tab lists types with fields; Plan assign still works;
   moderator sees no write UI.
