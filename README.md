# Task Platform

## 1. Project Title

**Task Platform** — Enterprise-style AI-assisted task management and workflow system.

---

## 2. Project Overview

Task Platform helps teams create, assign, track, review, and close tasks in a controlled workflow.
It includes role-based access (user/admin), approval-based completion, and AI-assisted features such as
task summarization, root-cause analysis, and duplicate detection.

---

## 3. Purpose of the Project

This project exists to solve common execution issues in team task tracking:

- unclear task descriptions
- inconsistent team workflows
- weak quality checks before task closure
- limited visibility into AI feature adoption

It provides a structured and secure platform where teams can work faster while keeping governance in place.

---

## 4. Basic Key Features

- **Task CRUD**: create, read, update, and delete tasks
- **Task attributes**: title, description, status, priority, due date, and assignee
- **Status workflow**: defined lifecycle (for example: To Do → In Progress → Done / Pending Approval)
- **Filtering and sorting**: by status, priority, and due date
- **Basic/advance UI**: clean and usable interface for day-to-day task operations
- **Drag-and-drop task movement**: move tasks across workflow columns (Kanban-style)
- **Authentication and role-based access**: admin vs standard user permissions
- **Persistent database storage**: PostgreSQL-based data persistence
- **API backend**: REST-style API endpoints for frontend/backend communication
- **Cloud-ready deployment model**: containerized design suitable for AWS/Azure/GCP deployment
- **AI-powered baseline feature support**: summarization/priority suggestion/natural-language task creation
- **Test coverage**: unit and integration tests for core flows

---

## 5. Advanced Key Features

- **Team creation and management**: admins can create and maintain teams
- **Workflow by team**: each team (for example Dev, QA) can have its own workflow stages
- **Advanced approval workflow**: tasks move through a controlled lifecycle with a creator review checkpoint
- **Creator authority on owned tasks**: the task creator has final authority to approve or decline completion of tasks they created
- **No auto-close without creator approval**: tasks cannot be marked fully closed until creator approval is provided
- **Decline and rework loop**: if declined, the task is pushed back to the working stage with reason/history tracking
- **Screen-level field visibility control**: admin can configure which fields are visible and in what order
- **AI-assisted root cause analysis**: generate likely root causes from task context/comments
- **AI prevention and suggested actions**: generate prevention plans and recommended next actions
- **Approval-driven quality gate**: completion requires creator review and accept/decline decision
- **Lifecycle controls**: soft delete/archive handling for cleaner dashboards and retention
- **Operational scalability patterns**: Redis + BullMQ for async/background processing

---

## 6. Key AI Features

- AI task summarization
- Natural-language task parsing
- AI priority suggestion
- Duplicate issue detection (heuristic + optional semantic pass)
- Root-cause analysis suggestions
- Permanent resolution/prevention suggestions

More details: `docs/AI_ISSUE_INTELLIGENCE.md`, `docs/AI_DOCUMENT.md`, `docs/AI_FEATURES_DOCUMENT.md`, `docs/AI USAGE DOCUMENTATION.md`


---

## 7. System Architecture / High-Level Design

High-level flow:

`UI (apps/web) -> API Routes (apps/api/app/api) -> Controllers -> Services -> Repositories -> PostgreSQL/Redis/Queue/AI`

Architecture references:

- `docs/ARCHITECTURE.md`
- `docs/PROJECT_ARCHITECTURE_FLOW_CHART.md`
- `docs/FOLDER_STRUCTURE_AND_LINKING.md`

---

## 8. Technology Stack, Purpose, and Rationale

| Layer | Technology | Why Chosen |
|---|---|---|
| Frontend | Next.js + React + TypeScript | Modern UI, maintainability, type safety |
| Backend | Next.js API + TypeScript | Consistent ecosystem and fast API delivery |
| Database | PostgreSQL + Prisma | Relational reliability + type-safe data access |
| Cache/Queue | Redis + BullMQ | Fast cache/rate limiting + background jobs |
| Security | JWT, RBAC, CSRF, validation | Secure-by-default API access |
| AI | Local LLM + fallback providers | Better resilience and optional cloud support |
| Styling/UI | Tailwind + reusable components | Fast, consistent UI development |
| Drag & Drop UX | dnd-kit | Smooth Kanban/task movement interactions with modern React ergonomics |

Full rationale: `docs/TECH_STAKE_USED.md`

---

## 9. Tools Used for Code Suggestion, Commenting, and Documentation

- **GitHub Copilot (GPT-5.3-Codex)** for coding assistance and documentation drafting
- **TypeScript tooling** for type checks
- **Prisma tooling** for schema and migrations
- **Markdown documentation** under `docs/` for structured project knowledge

---

## 10. Project Folder Structure

```text
task-platform/
├─ apps/
│  ├─ api/          # Backend API app
│  └─ web/          # Frontend app
├─ packages/
│  ├─ types/        # Shared contracts
│  └─ ui/           # Shared UI components
├─ prisma/          # DB schema + migrations + seed
├─ docker/          # Dockerfiles
├─ docs/            # Project documentation
├─ config/          # Config artifacts (workflow/dropdowns)
└─ package.json     # Workspace scripts
```

Detailed structure: `docs/FOLDER_STRUCTURE_AND_LINKING.md`

---

## 11. Functional Workflow

### End-to-end workflow (two-user scenario)

Use this as the primary reviewer/UAT flow.

1. Create two users (for example `user1` and `user2`) and ensure both can log in.
2. Log in as **user1** (creator).
3. Open **Create Task** and use AI-assisted creation:
	- enter task details,
	- let AI interpret the text,
	- review AI suggestions for team and priority.
4. Before submit, duplicate detection runs and warns early if similar tasks already exist (with details).
5. Assign the task to the correct team (for testing, choose the team where `user2` belongs) and create the issue.
6. Go to **My Created Tasks**:
	- verify the new task appears,
	- test **View / Edit / Delete** actions,
	- create additional similar tasks to validate duplicate detection,
	- test filter and sort behavior.
7. Log out and log in as **user2** (assignee).
8. Open **My Dashboard** (Kanban board):
	- confirm assigned tasks are visible,
	- drag tasks through relevant workflow stages,
	- move work toward completion.
9. Open the task details and add implementation comments.
10. Use AI analysis on task details + latest findings:
	 - root-cause analysis,
	 - prevention/recommended actions,
	 - save the notes.
11. Submit/move the task to completion review (pending creator decision).
12. Log out and log back in as **user1**.
13. Open **My Created Tasks** and review the same task:
	 - choose **Accept** to close,
	 - or choose **Decline** (decline reason is required), which sends the task back for rework.

### Admin workflow

1. Admin creates/maintains team workflows
2. Admin can configure workflow stages by team
3. Admin can manage team additions/structure
4. Admin can change UI field behavior and review AI insights

References:

- `docs/FUNCTIONAL_FLOW.md`
- `docs/ADMIN_FEATURES.md`

---

## 12. Technical Workflow (Wiring)

1. Web UI calls `/api/*`
2. Rewrite/proxy routes request to API app
3. API route delegates to controller
4. Controller validates/authenticates/authorizes request
5. Service executes business logic
6. Repository reads/writes data (Prisma/Postgres)
7. Optional side paths: Redis cache, queue jobs, AI providers

Reference: `docs/LOCATION_WORKFLOW.md`

---

## 13. Installation Instructions (Step-by-step)

1. Install prerequisites:
	- Node.js 20+
	- npm 10+
	- PostgreSQL
	- Redis
2. Clone repository
3. Create `.env` from `.env.example`
4. Install dependencies
5. Run Prisma setup

Use these scripts from project root:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

---

## Quick Start for New Developers (5 Minutes)

If you just cloned the repo and want to run quickly, follow this checklist.

Use **one path only**:
- Path A: Without Docker
- Path B: With Docker

### Option A: Local run (without Docker)

Prerequisites:
- Node.js 20+
- PostgreSQL running on `localhost:5432`
- Redis running on `localhost:6379`

Install links (if missing):
- Node.js: `https://nodejs.org/en/download`
- PostgreSQL: `https://www.postgresql.org/download/`
- Redis docs: `https://redis.io/docs/latest/operate/oss_and_stack/install/install-redis/`

1. Copy `.env.example` to `.env`.
2. Ensure **PostgreSQL** and **Redis** are running locally.
3. If database `task-platform` does not exist yet, create it.
4. Run bootstrap commands:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

5. Open:
- Web: `http://localhost:3000`
- API health: `http://localhost:3001/api/health`

### Option B: Docker run (fast onboarding)

Prerequisite:
- Docker Desktop (`https://www.docker.com/products/docker-desktop/`)

You do **not** need local PostgreSQL/Redis/Ollama installs for Docker-only onboarding.

`docker compose up --build` now starts:
- web
- api
- postgres
- redis
- ollama (local LLM service)

On first run, model pull may take a few minutes (image + model download).

```bash
docker compose up --build
docker compose exec api npm run prisma:seed -w apps/api
```

PowerShell onboarding sequence (local Docker, standardized):

```powershell
docker compose down
docker compose up --build -d
docker compose exec api npm run prisma:seed -w apps/api
docker compose logs web --tail 100
docker compose logs api --tail 100
```

Then open:
- Web: `http://localhost:3000`
- API health: `http://localhost:3001/api/health`

If Docker path shows unexpected `500` after image/container changes, run:

```bash
docker compose down
docker compose up --build -d
docker compose exec api npm run prisma:seed -w apps/api
docker compose logs web --tail 100
docker compose logs api --tail 100
```

### First login credentials (seeded)

- Admin: `admin@task.local` / `Admin@123456`
- User: `user@task.local` / `User@123456`

### Why seed is mandatory for first run

`npm run prisma:seed` creates baseline teams, users, workflow stages, and starter data.
Without seed, first-time login and end-to-end testing are not fully ready.

### Detailed guides

- `docs/RUNBOOK.md` (single source onboarding + troubleshooting)
- `docs/HOW_TO_RUN_WITHOUT_DOCKER.md` (local machine run)
- `docs/HOW_TO_RUN_WITH_DOCKER.md` (docker run)

---

## 14. Environment Setup (`.env` Explanation)

Key variables:

- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`: auth secrets
- `CSRF_SECRET`: CSRF protection secret
- `API_PROXY_TARGET`: web-to-api target
- `AI_FALLBACK_PROVIDER`: AI provider selection
- `LOCAL_LLM_API_URL`, `LOCAL_LLM_MODEL`: local AI runtime settings

Source: `.env.example`

---

## 15. How to Run the Project (Step-by-step)

> Windows users: for a quick PowerShell/CMD run guide, see `scripts/README.md`. refer : Run project without Docker (Windows / PowerShell)

Run both apps:

```bash
npm run dev
```

Or run separately:

```bash
npm run dev:api
npm run dev:web
```

Default URLs:

- Web: `http://localhost:3000`
- API: `http://localhost:3001`

### Mode switching (Local npm vs Docker)

Use **one mode at a time**:

- **Local mode**: `npm run dev`
- **Docker mode**: `docker compose up --build` (or `./scripts/docker.ps1 up`)

Both modes use the same default ports (`3000` and `3001`).
If Docker containers are already running, local `npm run dev` can fail with `EADDRINUSE`.

Recommended flow:

1. If switching to local mode, stop Docker stack first.
2. Confirm ports `3000` and `3001` are free.
3. Start local with `npm run dev`.

If needed, check details in:

- `docs/HOW_TO_RUN_WITHOUT_DOCKER.md`
- `docs/HOW_TO_RUN_WITH_DOCKER.md`

Detailed local guide: `docs/HOW_TO_RUN_WITHOUT_DOCKER.md`

---

## 16. Docker Setup (Local Build + Local Run)

Use this section when you want Docker to build from your local source and run everything on your machine.

Start full stack:

```bash
docker compose up --build
```

This starts:
- `postgres`
- `redis`
- `ollama` (local LLM service inside Docker)
- `api`
- `web`

`ollama` auto-pulls `TP_LOCAL_LLM_MODEL` before API becomes healthy.

### PowerShell onboarding sequence (local Docker, standardized)

Use this exact sequence from repo root:

```powershell
docker compose down
docker compose up --build -d
docker compose exec api npm run prisma:seed -w apps/api
docker compose logs web --tail 100
docker compose logs api --tail 100
```

Optional custom Docker env:

```bash
cp .env.docker.example .env.docker
docker compose --env-file .env.docker up --build
```

`.env.docker` uses `TP_*` variables so Docker overrides do not conflict with normal local `.env` values.

PowerShell helper shortcuts:
- Start detached: `./scripts/docker.ps1 up -Detached`
- Tail logs: `./scripts/docker.ps1 logs`
- Stop: `./scripts/docker.ps1 down`
- Stop and remove volumes: `./scripts/docker.ps1 down -RemoveVolumes`
- Seed demo data: `./scripts/docker.ps1 seed`

Detailed guide: `docs/HOW_TO_RUN_WITH_DOCKER.md`

---

## 16A. Docker Setup with Cloud (Docker Hub Images)

Use this section when API/Web images are already published to Docker Hub and teammates should run without local image builds.

Required runtime files:
- `docker-compose.cloud.yml`
- `.env.cloud.example` (copy to `.env.cloud`)
- `scripts/docker-cloud.ps1`
- `scripts/docker-cloud-verify.ps1`

### PowerShell onboarding sequence (cloud Docker, standardized)

```powershell
Copy-Item .env.cloud.example .env.cloud
./scripts/docker-cloud-verify.ps1 -EnvFile .env.cloud
./scripts/docker-cloud.ps1 pull -EnvFile .env.cloud
./scripts/docker-cloud.ps1 up -Detached -EnvFile .env.cloud
./scripts/docker-cloud.ps1 ps -EnvFile .env.cloud
```

Cloud troubleshooting quick checks:
- `./scripts/docker-cloud.ps1 logs -EnvFile .env.cloud`
- `docker compose --env-file .env.cloud -f docker-compose.cloud.yml logs api --tail 100`
- `docker compose --env-file .env.cloud -f docker-compose.cloud.yml logs web --tail 100`

Detailed guides:
- Beginner-friendly runtime guide: `docs/HOW_TO_DEPLOY_ON_DOCKER_HUB_CLOUD.md`
- Advanced publish/reference guide: `docs/HOW_TO_DEPLOY_DOCKER_HUB.md`
- Quick copy-paste commands: `docs/DOCKER_ONBOARDING_CHEATSHEET.md`

---

## Test Suite Execution (How to Run Test Suite)

Current automated tests are focused in the API workspace (unit + integration flows).

Run from repository root:

```bash
npm run test
```

Or run API tests directly:

```bash
npm run test -w apps/api
```

Recommended test workflow:

1. Ensure PostgreSQL and Redis are running
2. Run migrations and seed if needed
3. Execute tests
4. Review failures by suite (`tests/unit` and `tests/integration`)

---

## Design Patterns Used

The project follows practical enterprise-oriented patterns:

- **Layered Architecture**: presentation -> application/service -> infrastructure/repository
- **Repository Pattern**: persistence logic isolated from business services
- **DTO/Contract Pattern**: shared typed request/response models via `packages/types`
- **Configuration-driven UI Pattern**: screen fields and visibility controlled by admin config
- **Provider/Fallback Pattern (AI)**: local model first/optional provider fallback
- **Workflow/State Pattern**: controlled transitions for task lifecycle and approval flow

### Architecture Pattern Clarification 

- **Current architecture type:** **Modular Monolith** 
- **Domain modeling style:** **DDD-inspired layered design** (domain-oriented modules and business rules, but not full strict DDD with formal bounded-context decomposition)
- **Request flow style:** **MVC-like separation** at API boundary
	- Routes/Controllers = request handling
	- Services = business logic
	- Repositories = data access

Why this classification:

- The platform is deployed as coordinated apps in one repository and one primary backend runtime (`apps/api`) rather than independently deployed business services.
- The code is strongly layered and domain-organized, which gives many microservice-like boundaries **inside** a monolith.
- This is usually the fastest/safest pattern for early and mid-scale product evolution before service decomposition is needed.

Why choose modular monolith first:

- Faster delivery with lower operational complexity
- Easier debugging/observability in a single runtime
- Strong consistency for transactional flows (tasks, comments, approvals)
- Clear path to evolve into microservices later when domain/traffic boundaries justify it

### Why we chose the current design pattern

We intentionally chose a **Modular Monolith + DDD-inspired layered architecture** because it gives the best balance of delivery speed, maintainability, and operational simplicity for the current product stage.

Key reasons:

- **Fits current team/product scale**: one deployable backend is easier to own, release, and support.
- **Clear separation of concerns**: controller/service/repository layering keeps code organized and testable.
- **Domain-focused evolution**: task, workflow, and approval rules stay close to business logic instead of being scattered in UI code.
- **Lower operational overhead**: avoids early microservice complexity (distributed tracing, cross-service transactions, service mesh concerns).
- **Strong data consistency**: transactional flows (create/update/approval/comment) are simpler and safer in one bounded runtime.
- **Future-proof by design**: module boundaries and shared contracts make later microservice extraction possible without full rewrite.

In short, this pattern was chosen to optimize **time-to-value now** while preserving a clean migration path for **service decomposition later**.

### Architecture Verdict

| Quality Attribute | Verdict | Why |
|---|---|---|
| Scalability | **Good (practical horizontal readiness)** | Stateless API routes, PostgreSQL indexing, Redis caching/rate limiting, BullMQ async jobs, Dockerized deployment model. |
| Robustness | **Good** | Validation boundaries, approval workflows, soft-delete/archive controls, retries/fallback behavior in AI paths, typed contracts. |
| Security | **Good** | JWT auth, RBAC, CSRF checks, payload validation, rate limiting, role-gated admin routes. |
| Modern/Latest Stack | **Strong** | Next.js + TypeScript + Prisma + Tailwind + dnd-kit + AI provider abstraction, with clean monorepo and shared contracts. |

Overall: this is a **modern, secure, and maintainable modular-monolith architecture** that is scalable for current needs and can be evolved toward microservices later if domain scale demands it.

---

## Design Principles

- **Separation of Concerns**: UI, business logic, and data access are split cleanly
- **Single Responsibility**: controllers/services/repositories each focus on one concern
- **Explicit Validation Boundaries**: request payload validation at API edges
- **Fail-safe Defaults**: secure defaults (auth/CSRF/rate limiting) and guarded state transitions
- **Composability**: reusable components/hooks/services for feature growth
- **Pragmatic Simplicity**: fast paths for common actions with optional advanced processing

---

## Security

Security controls implemented across the platform include:

- **JWT-based authentication** (access + refresh flow)
- **Role-based access control (RBAC)** for admin/user permissions
- **CSRF protection** for state-changing actions
- **Input validation and schema enforcement** (Zod)
- **Rate limiting** on sensitive and AI routes
- **Soft-delete and approval controls** to prevent accidental destructive actions
- **Environment-based secret management** via `.env`

Security-related references:

- `docs/RUNBOOK.md`
- `docs/ARCHITECTURE.md`

---

## Maintainability and Reusability

The codebase is structured to stay maintainable as features grow:

- **Monorepo with workspaces** keeps app boundaries explicit (`apps/*`, `packages/*`)
- **Shared types package** reduces contract drift between frontend/backend
- **Reusable UI components** reduce duplication in forms, tables, and modals
- **Focused hooks and service modules** improve testability and code clarity
- **Documentation-first approach** (`docs/`) improves onboarding and reviewability
- **Consistent linting/type checks** support safe refactoring

Practical maintainability tips for contributors:

1. Keep business rules in services, not in UI components
2. Reuse DTOs/types from `packages/types` instead of redefining shapes
3. Add/extend tests when changing workflows or status transitions
4. Update related docs whenever behavior or architecture changes

---

## API Endpoints and How to Test Endpoints

Base API URL (local):

- `http://localhost:3001/api`

### Endpoint Inventory

#### Health

- `GET /health`

#### Authentication

- `POST /auth/register`
- `POST /auth/login`

#### Tasks (General)

- `GET /tasks`
- `POST /tasks`
- `GET /tasks/filter`
- `POST /tasks/ai-create`
- `GET /tasks/:id`
- `PUT /tasks/:id`
- `DELETE /tasks/:id`
- `PUT /tasks/:id/status`
- `GET /tasks/:id/comments`
- `POST /tasks/:id/comments`

#### Tasks (Current Assignee / My Tasks)

- `GET /tasks/my`
- `GET /tasks/my-dashboard`
- `PUT /tasks/my/:id`
- `DELETE /tasks/my/:id`

#### Tasks (Created By Me)

- `GET /tasks/my-created`
- `PUT /tasks/my-created/:id`
- `DELETE /tasks/my-created/:id`
- `PUT /tasks/my-created/:id/approval`

#### AI Endpoints

- `POST /ai/summarize`
- `POST /ai/suggest-priority`
- `POST /ai/parse-task`
- `POST /ai/detect-duplicates`
- `POST /ai/categorize-issue`
- `POST /ai/root-cause`
- `POST /ai/resolution`

#### Users and Teams

- `GET /users`
- `POST /users`
- `POST /users/create` (compat alias)
- `GET /teams`
- `POST /teams`

#### Workflow + Configuration

- `GET /workflows/team/:teamId`
- `GET /config/workflow`
- `GET /config/ui`
- `GET /config/dropdowns`
- `GET /config/teams`

#### Admin

- `GET /admin/workflows`
- `POST /admin/workflows`
- `GET /admin/ui-config`
- `PUT /admin/ui-config`
- `GET /admin/ai-insights`

### How to Test Endpoints (Practical Flow)

Use Postman, Insomnia, or VS Code REST client.

1. Start API server and dependencies (PostgreSQL + Redis)
2. Verify service health first:
	- call `GET /health`
3. Authenticate:
	- call `POST /auth/login`
	- capture `accessToken` and `csrfToken` from response
4. For protected endpoints:
	- set `Authorization: Bearer <accessToken>`
5. For state-changing protected endpoints (`POST`, `PUT`, `DELETE`):
	- also set `x-csrf-token: <csrfToken>`
6. Test by domain in this order:
	- config/team endpoints
	- task create/list/update
	- comments/status transitions
	- creator approval flow
	- AI helper endpoints
	- admin endpoints (admin account only)

### Endpoint Testing Tips

- If you get `401/403`, verify both JWT and CSRF headers
- If validation fails (`400/422`), check payload shape against DTO/types in `packages/types`
- Use task IDs returned from create/list endpoints when testing `/:id` routes
- Test approval flow using a creator account and an assignee account to validate role behavior

---

## Customization Guide

This section explains where to make changes when customizing screens, fields, and views.

### A) How to add a new field to a UI screen

Example: add a new field like `impactLevel` on create-task and task-details.

1. **Shared contract/types**
	- Update shared DTO/type definitions in:
	- `packages/types/src/index.ts`

2. **Frontend form/view rendering**
	- Add field in relevant UI components/pages, for example:
	- `apps/web/src/components/create-task-form.tsx`
	- `apps/web/src/components/task-detail-modal.tsx`
	- `apps/web/src/app/tasks/[id]/page.tsx`

3. **UI configuration visibility/order**
	- Add field key in fallback config (for default visibility/order):
	- `apps/web/src/hooks/use-ui-config.ts`
	- Include the new `fieldName` in the appropriate screen block (`create-task`, `task-details`, etc.)

4. **Admin UI config support**
	- Ensure admin UI config can read/save the new field:
	- API route: `apps/api/src/app/api/admin/ui-config/route.ts`
	- Controller/service/repository under `apps/api/src/presentation/controllers` and `apps/api/src/application/services`

5. **Backend validation + persistence**
	- Add field to request validators:
	- `apps/api/src/application/validators/task.validator.ts`
	- Add mapping/business logic in service layer:
	- `apps/api/src/application/services/task.service.ts`
	- Add DB mapping in repository and schema if persisted:
	- `apps/api/src/infrastructure/repositories/task.repository.ts`
	- `prisma/schema.prisma` + migrations

6. **Test updates**
	- Update/add unit and integration tests for the new field behavior:
	- `apps/api/tests/unit/*`
	- `apps/api/tests/integration/*`

### B) How to add a new screen/view

1. Create new page/component in `apps/web/src/app/...`
2. Add route navigation entry if needed in:
	- `apps/web/src/components/app-nav.tsx`
3. Add UI config support if the screen should be admin-configurable:
	- extend `UIScreenName` and related config DTO in `packages/types/src/index.ts`
	- add fallback config in `apps/web/src/hooks/use-ui-config.ts`
	- support in admin ui-config backend flow

### C) How to customize existing views (table columns, labels, actions)

- My-created grid/task rows:
  - `apps/web/src/components/dashboard-task-row.tsx`
- Task details page/modal:
  - `apps/web/src/app/tasks/[id]/page.tsx`
  - `apps/web/src/components/task-detail-modal.tsx`
- Create-task UX and AI helpers:
  - `apps/web/src/components/create-task-form.tsx`

### D) Quick customization checklist (recommended order)

1. Update shared type
2. Update frontend render + form handling
3. Update validator + service + repository
4. Update DB schema/migration (if needed)
5. Update UI config fallback + admin config support
6. Update tests
7. Update docs/README

### E) Common mistakes to avoid

- Adding field only in UI but not in backend validator/service
- Updating Prisma schema but forgetting migration/seed impact
- Forgetting UI config fallback entries (field may not render)
- Missing test updates for status/workflow-sensitive changes

---

## 17. Demo Instructions (How Reviewers Should Test)

### Reviewer script (recommended)

1. Create two test users (`user1` creator, `user2` assignee) and log in as `user1`.
2. Create tasks using AI-assisted input and confirm duplicate warnings (if similar issues exist) are shown before final submit.
3. Set team/priority from AI suggestions, assign to `user2` team, then create issue.
4. In **My Created Tasks** (`user1`):
	- verify listing,
	- run view/edit/delete,
	- create additional similar records,
	- validate duplicate, filter, and sort behavior.
5. Log in as `user2` and process tasks from **My Dashboard** (Kanban):
	- drag across stages,
	- add comments,
	- run AI root-cause and prevention analysis,
	- save findings.
6. Move task to completion/**Pending Approval**.
7. Log back in as `user1` and finalize in **My Created Tasks**:
	- **Accept** closes task,
	- **Decline** requires reason and returns task to execution flow.
8. Open admin pages (optional governance checks):
 	- workflow management
 	- UI config
 	- AI insights

---

## 18. Example Use Case

**Scenario:** Login issue after deployment

1. Creator opens create-task page
2. Enters issue details and asks AI for summary/priority
3. Assigns task to platform support assignee
4. Assignee investigates and adds comments
5. Assignee uses root-cause and resolution AI suggestions
6. Creator reviews and closes task (or declines for rework)

---

## 19. Screenshots (Placeholders)

> Add screenshots here before final review submission.

- `docs/screenshots/login-page.png`
- `docs/screenshots/create-task-page.png`
- `docs/screenshots/task-detail-modal.png`
- `docs/screenshots/admin-workflow-page.png`
- `docs/screenshots/admin-ai-insights-page.png`

---

## 20. Future Improvements

- SSO / enterprise identity provider integration
- richer analytics dashboards and SLA tracking
- AI model quality benchmarking and feedback loop
- notification integrations (email/chat)
- stronger multi-tenant isolation patterns
- **Deep issue intelligence at scale**: analyze large task volumes (for example 1,000+ tasks per team over 1–2 months), detect duplicate patterns, identify root-cause clusters, group related issues, and generate consolidated prevention action plans to improve engineering efficiency and reduce repeated work

Detailed roadmap: `docs/FUTURE_IMPROVEMENTS_DOC.md`

---

## 21. Reference Documents

- `docs/PROJECT_DOCUMENTATION.md` (full project guide)
- `docs/ARCHITECTURE.md` (architecture overview)
- `docs/PROJECT_ARCHITECTURE_FLOW_CHART.md` (visual architecture)
- `docs/FOLDER_STRUCTURE_AND_LINKING.md` (folder/linking map)
- `docs/FUNCTIONAL_FLOW.md` (end-to-end functional flow)
- `docs/LOCATION_WORKFLOW.md` (technical wiring flow)
- `docs/ADMIN_FEATURES.md` (admin capabilities)
- `docs/ADVANCE_FEATURES.md` (advanced features)
- `docs/TECH_STAKE_USED.md` (stack + rationale)
- `docs/AI_ISSUE_INTELLIGENCE.md` (AI feature matrix)
- `docs/AI USAGE DOCUMENTATION.md` (AI usage overview: primary vs secondary, tools, models, outcomes)
- `docs/FUTURE_IMPROVEMENTS_DOC.md` (future roadmap and enhancements)
- `docs/HOW_TO_RUN_WITHOUT_DOCKER.md` (local run)
- `docs/HOW_TO_RUN_WITH_DOCKER.md` (docker run)
- `docs/RUNBOOK.md` (operations guide)

---

## 22. License

No explicit open-source license file is currently included.

If publishing externally, add a `LICENSE` file (for example: MIT, Apache-2.0, or organization-specific license).

---

## 23. Author

**Ajay / Project Team**

> Update this section with final author/contact details as needed.
