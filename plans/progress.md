# Admin Panel — Module Audit & Rebuild Progress

Living tracker. Per `Guideline.md` §7: every module below gets the §2 sync
workflow (gateway controller → DTOs → views → service) then a rebuild to the
Plans-page pattern (`src/app/pages/plans/` is the reference).

Mark a module ✅ only when it meets the §6 definition of done. Update this file
when a module completes.

## Status legend

- ⬜ Not started — not audited against current contracts
- 🔄 In progress
- ✅ Done — synced, rebuilt, lint + build pass

## Modules

| Module | Route base | Status | Notes |
|---|---|---|---|
| Plans | `admin/plans` | ✅ | Reference implementation. Rebuilt + synced (backend got `yearlyDiscountPercent`/`yearlyDiscountAmount`). No plan delete — deactivation is the retire path. |
| Workspaces | `admin/workspaces` | ✅ | Rebuilt as tabbed hub page (`/workspaces/:id`, shadcn Tabs, URL-synced `?tab=`): Projects (search + per-project inspect sheet), Members, Content Types (fields inspect sheet), Content (entry inspect sheet w/ data payload + takedown), Media, API Keys, Webhooks, Plan. Row click navigates; old hand-rolled sheet removed. Needed two backend additions (2026-08-15): `GET /admin/content-types` (new endpoint) + `workspaceId` filter on `GET /admin/projects`. Plan assignment lives on the Plan tab. See `plans/03-workspace-hub.md`. |
| Users | `admin/users` | ✅ | Rebuilt as hub page (`/users/:id`): Details (profile + suspend/verify/delete actions with session-kill warning + CONFLICT banner), Workspaces, Projects tabs with cross-links to workspace/project hubs. Backend fix (2026-08-15): added `suspended` filter to `GET /admin/users` — the panel's Status filter was sending a param the old DTO didn't declare → guaranteed 400 (Guideline §3.2 class). Old hand-rolled sheet removed. |
| Projects | `admin/projects` | ✅ | Rebuilt as tabbed hub page (`/projects/:id`): Details & Usage (aggregated per-project usage), Content Types, Entries, Media, API Keys, Webhooks. Usage endpoint added to backend (2026-08-15): `GET /admin/projects/:id/usage` (`AdminProjectUsage` — counts, storage, AI tokens/cost). Shared scope tabs moved to `src/components/admin-tabs/` (accept `workspaceId` or `projectId`). |
| Content | `admin/content` | ✅ | Audited 2026-08-15: params match `AdminContentQueryDto` (page/limit/status/scope). Entry sheet renders real fields via content-type FieldDefs; richtext through read-only TipTap. Dead search input removed (endpoint has no `q`). |
| Media | `admin/media` | ✅ | Audited 2026-08-15: params match `AdminScopedQueryDto`. Storage summary resolves workspace ids → names; dead filter bar removed. |
| API Keys | `admin/api-keys` | ✅ | Audited 2026-08-15: list + delete match controller; dead filter bar removed. |
| Webhooks | `admin/webhooks` | ✅ | Audited 2026-08-15: list + `PATCH :id/disable` match; dead filter bar removed. |
| Audit | `admin/audit` | ✅ | Audited 2026-08-15. Backend fix: gateway/service previously took `AdminListQueryDto` but the page sends `action`/`targetType` → guaranteed 422. Added `AdminAuditQueryDto` (+ action/targetType/q filters in `AdminAuditService.list`). |
| Admins | `admin/admins` | ✅ | Audited 2026-08-15: create/update/delete payloads match `CreateAdminDto`/`UpdateAdminDto` field-for-field. |
| Settings | — | ✅ | Audited 2026-08-15: no gateway settings controller exists; page is a placeholder and sends nothing — correct as-is. |
| Support | `admin/support` | ✅ | Audited 2026-08-15. Bug found: "Unassigned" preset sent `assignee=unassigned` → failed `@IsUUID` on `assignedAdminId` (400 on click). Backend: added `unassigned` boolean filter to `AdminTicketListQueryDto` + core-service. Panel: `useTickets` now maps `me` → `assignedAdminId`, `unassigned` → `unassigned=true`. Ticket page header aligned to the detail-page pattern. |
| Overview | `admin/metrics` | ✅ | Audited 2026-08-15: metrics fields match views. Chart palette moved to brand tokens (indigo removed, amber secondary in); open-tickets stat uses amber accent. |
| Login | `admin/auth` | — | Auth screen, out of audit scope. |

## Deferred / known gaps

- ~~Admin API has no content-type listing endpoint~~ — added 2026-08-15
  (`GET /admin/content-types`, `AdminContentTypeRow`).
- ~~`GET /admin/projects` lacks a workspaceId filter~~ — added 2026-08-15
  (`AdminProjectsQueryDto`).
- ~~Audit list rejects `action`/`targetType` params~~ — added 2026-08-15
  (`AdminAuditQueryDto`).
- ~~Support "Unassigned" filter sent a non-UUID `assignee`~~ — added
  `unassigned` flag to `AdminTicketListQueryDto` (2026-08-15).
- 2026-08-15 IA restructure: workspace detail keeps only workspace-owned
  tabs (Projects · Members · Plan); project-owned resources (content types,
  content, media, api keys, webhooks, usage) live in the project detail page.
  All detail pages share the header pattern: breadcrumb → title + badges +
  inline stats right → top-level line tabs.
- Pre-existing lint error in `src/components/ui/Button.tsx:56`
  (`react-refresh/only-export-components`) — not introduced by the workspace
  rebuild; fix when touching Button next.
