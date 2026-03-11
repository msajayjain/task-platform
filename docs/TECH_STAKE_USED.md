# Tech Stack Used — What We Use and Why

This document summarizes the technologies used in Task Platform and the reasoning behind each choice.

> Note: “Tech Stake” here refers to the project’s technology stack and supporting tooling decisions.

---

## 1) Frontend

## Next.js (App Router) + React + TypeScript

- **Why chosen**:
  - Unified modern React framework with strong routing/data patterns.
  - Works well in monorepos and aligns with server/client rendering needs.
  - TypeScript improves maintainability and refactor safety at scale.
- **Where used**: `apps/web`

## Tailwind CSS

- **Why chosen**:
  - Fast UI delivery with consistent utility-based styling.
  - Easy responsive design and design-system alignment.
- **Where used**: `apps/web/src/app/globals.css`, Tailwind config and UI components.

## SWR + React Hook Form + Zustand

- **Why chosen**:
  - **SWR** for cache-first data fetching and revalidation.
  - **React Hook Form** for performant forms with good validation ergonomics.
  - **Zustand** for lightweight client state without Redux overhead.
- **Where used**: `apps/web/src/lib`, `apps/web/src/hooks`, `apps/web/src/store`.

---

## 2) Backend

## Next.js API Routes + TypeScript

- **Why chosen**:
  - Consistent runtime model with frontend ecosystem.
  - Rapid endpoint development with shared TS contracts.
  - Good fit for controller/service layering inside the app.
- **Where used**: `apps/api/src/app/api/**/route.ts`

## Layered architecture (presentation → application → infrastructure)

- **Why chosen**:
  - Clear separation of concerns.
  - Easier testing, debugging, and feature evolution.
  - Limits coupling between HTTP, business logic, and persistence.
- **Where used**: `apps/api/src/presentation`, `application`, `infrastructure`.

## Zod validation

- **Why chosen**:
  - Runtime schema validation for request safety.
  - Better error messaging and predictable contracts.
- **Where used**: validators + controller boundary checks.

---

## 3) Data and persistence

## PostgreSQL

- **Why chosen**:
  - Strong relational consistency for task/workflow/comment domain.
  - Mature operational tooling and reliability.
- **Where used**: primary transactional database.

## Prisma ORM

- **Why chosen**:
  - Type-safe DB access and migration workflow.
  - Good developer experience for schema evolution.
- **Where used**: `prisma/schema.prisma`, `apps/api/src/infrastructure/db/prisma.ts`, repositories.

## Redis

- **Why chosen**:
  - Fast in-memory store for rate limiting, caching, and queue-backed workflows.
  - Improves API responsiveness for high-read/auxiliary operations.
- **Where used**: cache/rate-limiter/queue integration in API infra.

---

## 4) Async processing

## BullMQ

- **Why chosen**:
  - Reliable Redis-backed job processing.
  - Suitable for non-blocking background tasks (e.g., AI categorization/reminders).
- **Where used**: `apps/api/src/infrastructure/queues`.

---

## 5) AI stack

## Local-first LLM mode (Ollama-compatible) + hosted fallback providers

- **Why chosen**:
  - Better resilience during provider outages/rate limits.
  - Lower dev friction and faster local iteration.
  - Optional hosted fallback when external quality/coverage is required.
- **Where used**: `apps/api/src/services/aiService.ts`, AI endpoints under `apps/api/src/app/api/ai/**`.

## AI use cases implemented

- task summarization
- natural language task parsing
- priority suggestion
- duplicate detection support
- root cause analysis
- permanent resolution suggestions

- **Why these were chosen**:
  - They reduce manual repetitive work and improve triage quality.
  - They keep humans in control for final decisions.

---

## 6) Security and governance choices

## JWT + RBAC + CSRF + rate limiting

- **Why chosen**:
  - JWT supports stateless auth for web/API integration.
  - RBAC enforces role-specific controls (e.g., admin workflows/config).
  - CSRF protection secures browser-driven state-changing requests.
  - Rate limiting protects endpoints, especially AI routes.
- **Where used**: API middlewares under `apps/api/src/presentation/middlewares`.

---

## 7) Monorepo and shared packages

## npm workspaces + shared packages (`packages/types`, `packages/ui`)

- **Why chosen**:
  - Single source of truth for DTOs/types used by web and API.
  - Reusable components and better consistency across apps.
  - Easier coordinated versioning and refactoring.

---

## 8) Operations and developer experience

## Docker + Docker Compose

- **Why chosen**:
  - Consistent local/CI environment setup.
  - Fast onboarding with one orchestration entrypoint.
- **Where used**: `docker-compose.yml`, `docker/*.Dockerfile`.

## TypeScript checks + Jest tests

- **Why chosen**:
  - Early detection of interface regressions and runtime risk.
  - Confidence in critical flows (auth/tasks/admin/AI interactions).
- **Where used**: app-level tsconfigs and tests under `apps/api/tests`.

---

## 9) Trade-offs and intentional decisions

- Next.js for both web and API optimizes team velocity, though very high-scale API-only workloads may eventually benefit from a dedicated service runtime split.
- Local LLM mode improves availability and cost control, while hosted models may still be preferable for certain quality-sensitive tasks.
- Layered architecture adds some boilerplate, but significantly improves long-term maintainability.

---

## 10) Conclusion

The selected stack balances **delivery speed**, **operational reliability**, **security**, and **maintainability** for an enterprise-style task platform. The choices are intentional for a product that combines standard workflow management with AI-assisted capabilities under production guardrails.
