# Code Location & Workflow Guide

This document answers two practical questions:
1. **Where is each feature implemented?**
2. **How does each major workflow execute end-to-end?**

## 1) Code location map

## Repository root
- `package.json` - workspace scripts and orchestration
- `.env` / `.env.example` - shared environment variables
- `prisma.config.ts` - Prisma CLI configuration (root-level schema)
- `prisma/schema.prisma` - canonical DB schema
- `prisma/seed.ts` - seed logic
- `docs/` - architecture, runbook, and this guide

### `apps/api` (Backend)
- `apps/api/src/app/api/**` - route entrypoints (Next route handlers)
- `apps/api/src/presentation/controllers/**` - controller layer
- `apps/api/src/application/services/**` - business logic / use cases
- `apps/api/src/infrastructure/repositories/**` - DB access via Prisma
- `apps/api/src/presentation/middlewares/**` - auth, RBAC, CSRF, rate limit
- `apps/api/src/infrastructure/db/prisma.ts` - Prisma client initialization
- `apps/api/src/infrastructure/config/env.ts` - env loading and validation

### `apps/web` (Frontend)
- `apps/web/src/app/login/page.tsx` - Login page
- `apps/web/src/app/register/page.tsx` - Register page
- `apps/web/src/app/page.tsx` - Dashboard/Kanban page
- `apps/web/src/store/auth.store.ts` - auth actions and token persistence
- `apps/web/src/store/task.store.ts` - task state and API interactions
- `apps/web/src/lib/api-client.ts` - axios client and auth/CSRF headers
- `apps/web/next.config.mjs` - `/api` rewrite proxy to backend
- `apps/web/src/components/**` - reusable UI and workflow components

### Shared packages
- `packages/types/src/index.ts` - shared DTOs/types
- `packages/ui/src/index.tsx` - shared UI primitives

## 2) Runtime workflows

### A) Register workflow
1. User submits form in `apps/web/src/app/register/page.tsx`
2. `useAuthStore.register(...)` in `apps/web/src/store/auth.store.ts` sends `POST /auth/register` via axios base `/api`
3. Web rewrite (`apps/web/next.config.mjs`) proxies to `http://localhost:3001/api/auth/register`
4. Backend route `apps/api/src/app/api/auth/register/route.ts` calls controller
5. Controller validates payload (Zod) + rate-limit + service call
6. `auth.service.ts` hashes password and creates user via repository
7. JWT + CSRF token returned
8. Frontend stores tokens in `localStorage` and navigates to `/`

### B) Login workflow
1. User submits `apps/web/src/app/login/page.tsx`
2. `useAuthStore.login(...)` posts to `/auth/login`
3. Request is proxied to backend route `/api/auth/login`
4. Controller validates payload + rate-limit
5. Service verifies password and returns JWT + CSRF
6. Frontend stores tokens, user state is set, then router navigates to dashboard

### C) Task CRUD workflow
1. Dashboard uses `task.store.ts` actions (`fetchTasks`, `createTask`, `updateTask`, `deleteTask`)
2. Calls go through `apps/web/src/lib/api-client.ts`
3. Axios interceptor injects `Authorization` and `x-csrf-token`
4. Backend middlewares validate JWT/RBAC/CSRF as required
5. Services invoke repositories (Prisma) and return normalized responses

### D) Kanban drag/drop workflow
1. Drag event starts in `apps/web/src/components/kanban-board.tsx`
2. `moveTask(id, status)` in `task.store.ts` performs optimistic UI update
3. API `PUT /api/tasks/:id` persists new status
4. On error, store rolls back local state

### E) AI task creation workflow
1. User enters natural language task in `apps/web/src/components/ai-task-form.tsx`
2. Frontend calls `POST /api/tasks/ai-create`
3. Backend `ai-task.service.ts` prompts Gemini (free model) and parses strict JSON
4. Parsed fields are persisted as a normal task and returned

## 3) Request paths and rewrites

Frontend uses relative base URL:
- `apps/web/src/lib/api-client.ts`: `baseURL = '/api'`

Rewrite rule:
- `apps/web/next.config.mjs`: `/api/:path*` -> `${API_PROXY_TARGET}/api/:path*`

Effective result:
- Frontend call `/auth/login` becomes `/api/auth/login` (same-origin)
- Web app proxies to backend API on port `3001`

## 4) Common troubleshooting map

### Symptom: `POST /api/api/auth/register 404`
- Cause: endpoint duplicated `/api` in both axios baseURL and method path
- Fix location: `apps/web/src/store/auth.store.ts`

### Symptom: `button click does nothing`
- Cause: custom inputs not forwarding refs to React Hook Form
- Fix location: `apps/web/src/components/ui/input.tsx`, `apps/web/src/components/ui/select.tsx`

### Symptom: auth route `500`
- Causes:
  - invalid secret lengths (`JWT_*`, `CSRF_SECRET`)
  - runtime `.env` not loaded in API package
- Fix locations:
  - `.env`, `.env.example`
  - `apps/api/src/infrastructure/config/env.ts`

### Symptom: `EADDRINUSE 3000/3001`
- Cause: stale dev servers still running
- Fix: stop old processes or restart cleanly before `npm run dev`

## 5) Recommended dev execution order
1. `npm install`
2. `npm run prisma:generate`
3. `npm run prisma:migrate` (or `npx prisma db push --config prisma.config.ts`)
4. `npm run prisma:seed`
5. `npm run dev`

