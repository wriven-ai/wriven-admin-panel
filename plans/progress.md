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
| Users | `admin/users` | ⬜ | |
| Projects | `admin/projects` | ✅ | Rebuilt as tabbed hub page (`/projects/:id`): Details & Usage (aggregated per-project usage), Content Types, Entries, Media, API Keys, Webhooks. Usage endpoint added to backend (2026-08-15): `GET /admin/projects/:id/usage` (`AdminProjectUsage` — counts, storage, AI tokens/cost). Shared scope tabs moved to `src/components/admin-tabs/` (accept `workspaceId` or `projectId`). |
| Content | `admin/content` | ⬜ | |
| Media | `admin/media` | ⬜ | |
| API Keys | `admin/api-keys` | ⬜ | |
| Webhooks | `admin/webhooks` | ⬜ | |
| Audit | `admin/audit` | ⬜ | |
| Admins | `admin/admins` | ⬜ | |
| Settings | — | ⬜ | No dedicated settings controller on gateway — verify endpoint during audit. |
| Support | `admin/support` | ⬜ | Backend also has `admin-support-metrics.controller.ts` — check it during audit. |
| Overview | `admin/metrics` | ⬜ | Uses Recharts; verify metrics endpoint fields when touching. |
| Login | `admin/auth` | — | Auth screen, out of audit scope. |

## Deferred / known gaps

- ~~Admin API has no content-type listing endpoint~~ — added 2026-08-15
  (`GET /admin/content-types`, `AdminContentTypeRow`).
- ~~`GET /admin/projects` lacks a workspaceId filter~~ — added 2026-08-15
  (`AdminProjectsQueryDto`).
- Pre-existing lint error in `src/components/ui/Button.tsx:56`
  (`react-refresh/only-export-components`) — not introduced by the workspace
  rebuild; fix when touching Button next.
