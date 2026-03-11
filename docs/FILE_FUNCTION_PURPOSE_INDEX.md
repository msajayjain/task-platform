# File + Function Purpose Index

This index documents the **purpose of key files** and the **main functions/classes** inside them.

> Note: The repository is broad; this index covers critical runtime files and feature hubs (API, web, shared, infra). It is intended as the canonical purpose map for onboarding and maintenance.

## A) API app (`apps/api/src`)

## Entry routes (`app/api/**/route.ts`)

- `app/api/tasks/route.ts` — task list/create endpoint entrypoints
- `app/api/tasks/[id]/route.ts` — task detail/update/delete entrypoints
- `app/api/tasks/[id]/comments/route.ts` — comments list/create endpoint entrypoints
- `app/api/tasks/[id]/status/route.ts` — assignee status/stage update endpoint entrypoint
- `app/api/tasks/ai-create/route.ts` — natural-language AI task creation entrypoint
- `app/api/ai/summarize/route.ts` — AI summary endpoint entrypoint
- `app/api/ai/parse-task/route.ts` — AI parse endpoint entrypoint
- `app/api/ai/suggest-priority/route.ts` — AI priority endpoint entrypoint
- `app/api/ai/detect-duplicates/route.ts` — AI duplicate endpoint entrypoint
- `app/api/ai/root-cause/route.ts` — AI root cause endpoint entrypoint
- `app/api/ai/resolution/route.ts` — AI prevention/resolution endpoint entrypoint
- `app/api/admin/*` routes — admin insights/workflow/ui-config endpoint entrypoints
- `app/api/health/route.ts` — health and AI readiness endpoint

## Controllers (`presentation/controllers`)

- `task.controller.ts`
  - Purpose: task CRUD, comments, approval workflow, AI task create orchestration.
  - Main functions: `createTaskController`, `updateTaskController`, `aiCreateTaskController`, approval/decline handlers.
- `ai.controller.ts`
  - Purpose: AI feature orchestration and response shaping.
  - Main functions: `aiSummarizeController`, `aiParseTaskController`, `aiRootCauseController`, `aiResolutionController`, `adminAIInsightsController`.
- `workflow.controller.ts`
  - Purpose: team/workflow admin APIs.
  - Main functions: team list/create, list/save admin workflows.
- `ui-config.controller.ts`
  - Purpose: dynamic UI field visibility/order APIs.
  - Main functions: public config fetch, admin config list/save.
- `auth.controller.ts`
  - Purpose: register/login/token and auth endpoint orchestration.

## Services (`application/services` + `services`)

- `application/services/task.service.ts`
  - Purpose: core task business logic, ownership checks, status transition policies, approval flow.
  - Main functions: `create`, `update`, `updateStatusForAssignedUser`, `approveTaskCompletion`, `declineTaskCompletion`, `getTaskDetailForUser`.
- `application/services/ai-task.service.ts`
  - Purpose: translate natural language text into task payload for persistence.
- `application/services/auth.service.ts`
  - Purpose: user auth domain logic, password verification, token issuance helpers.
- `application/services/workflow.service.ts`
  - Purpose: team workflow management and effective workflow resolution.
- `application/services/ui-config.service.ts`
  - Purpose: screen field config read/write and defaults handling.
- `services/aiService.ts`
  - Purpose: model abstraction, provider fallback chain, schema-safe AI parsing, heuristic fallbacks.
  - Main functions: `callJsonModel`, `fetchLocalLlmRaw`, `generateTaskSummary`, `parseNaturalLanguageTask`, `detectDuplicateIssues`, `analyzeRootCause`, `suggestPermanentResolution`.

## Repositories (`infrastructure/repositories`)

- `task.repository.ts` — Task DB CRUD and workflow-specific update helpers.
- `task-comment.repository.ts` — Task comment persistence/query.
- `ui-config.repository.ts` — UI config persistence.
- `workflow.repository.ts` — Workflow/team/stage persistence.
- `user.repository.ts` — User persistence/query.

## Infra / cross-cutting

- `infrastructure/config/env.ts` — env loading + schema validation.
- `infrastructure/db/prisma.ts` — Prisma client singleton.
- `infrastructure/cache/redis.ts` — Redis client singleton.
- `infrastructure/queues/task.queue.ts` — async queue orchestration.
- `infrastructure/logger/logger.ts` — structured logging.
- `presentation/middlewares/auth.middleware.ts` — JWT auth guard.
- `presentation/middlewares/rbac.middleware.ts` — role authorization guard.
- `presentation/middlewares/csrf.middleware.ts` — CSRF validation.
- `presentation/middlewares/rate-limit.middleware.ts` — endpoint rate limiting.
- `presentation/http/response.ts` — standardized success/error response shape.

---

## B) Web app (`apps/web/src`)

## Route pages (`app/**/page.tsx`)

- `app/page.tsx` — primary dashboard entry.
- `app/tasks/create/page.tsx` — create task screen orchestration.
- `app/tasks/[id]/page.tsx` — standalone task details page.
- `app/my-created-tasks/page.tsx` — creator task management screen.
- `app/my-dashboard/page.tsx` — assignee dashboard and workflow progression.
- `app/admin/workflows/page.tsx` — admin workflow management UI.
- `app/admin/ui-config/page.tsx` — admin UI configuration UI.
- `app/admin/ai-insights/page.tsx` — admin AI metrics dashboard.
- `app/login/page.tsx`, `app/register/page.tsx` — auth pages.

## Components (`components/**`)

- `create-task-form.tsx`
  - Purpose: create issue form, AI helpers, duplicate review UX.
  - Main functions: duplicate check orchestration, AI parse/summary/priority actions.
- `task-detail-modal.tsx`
  - Purpose: in-dashboard task details + AI diagnostics + save notes flow.
- `dashboard-task-row.tsx`
  - Purpose: row render/edit/review actions in creator dashboard table.
  - Includes Pending Approval Review modal.
- `kanban-board.tsx` (if present in project) — drag/drop visual workflow board.
- `app-nav.tsx` — app navigation and role-aware links.

## Client infra

- `lib/api-client.ts`
  - Purpose: axios client, auth/csrf headers, timeout policy, API error normalization.
- `lib/swr-fetcher.ts`
  - Purpose: shared SWR fetcher abstraction.
- `store/auth.store.ts`
  - Purpose: login/register/logout state and token persistence.
- `store/task.store.ts`
  - Purpose: task-centric state/actions and async API operations.
- `hooks/use-auth-guard.ts`
  - Purpose: route-level auth gating.
- `hooks/use-ui-config.ts`
  - Purpose: consumes server-configured field visibility/order.

---

## C) Shared packages

- `packages/types/src/index.ts`
  - Purpose: shared DTO and domain contracts across API/Web.
- `packages/ui/src/index.tsx`
  - Purpose: shared UI primitives/components for reuse.

---

## D) Top-level infra/config

- `prisma/schema.prisma` — canonical DB schema.
- `prisma/seed.ts` — baseline seed data.
- `prisma.config.ts` — Prisma CLI config.
- `docker-compose.yml` — local container orchestration (postgres, redis, api, web).
- `docker/api.Dockerfile` / `docker/web.Dockerfile` — container build specs.
- `.env.example` — environment variable template.

---

## E) Source file comment/header standard (recommended)

Use this header at top of core files:

```ts
/**
 * File: <path>
 * Purpose: <1-2 lines>
 * Layer: <presentation|application|infrastructure|ui>
 * Key Exports: <symbols>
 */
```

Use function-level comments for non-trivial logic only:

```ts
/**
 * <what it does>
 * Inputs: <important params>
 * Output: <shape/meaning>
 * Side effects: <db/network/cache/log>
 */
```

This keeps readability high without cluttering trivial helpers.
