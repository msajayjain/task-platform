# Architecture Overview

## Design Style
Clean architecture with enterprise layering:
- **Presentation**: Next.js route handlers and React pages/components
- **Application**: Use cases / services
- **Domain**: Entities, enums, business rules
- **Infrastructure**: Prisma repositories, Redis, BullMQ, Gemini adapters

## Key Decisions
1. **Monorepo** for code reuse (`packages/types`, `packages/ui`)
2. **API isolated in `apps/api`** for operational scaling
3. **JWT + RBAC** via middleware and route guards
4. **Zod validation** to prevent malformed input
5. **Prisma + PostgreSQL** for persistence and SQL injection-safe data access
6. **Redis cache + BullMQ** for performance and async jobs
7. **Centralized error model + logger** for observability
8. **Kanban drag/drop** with optimistic UI updates, persisted by API

## Security Controls (OWASP)
- Input validation (A03) via Zod
- Password hashing (A07) with bcrypt
- Security headers + CSP/X-Frame/Referrer policies
- Rate limiting and brute-force mitigation
- JWT authentication + role checks (A01)
- Parameterized DB access through Prisma (A03)
- CSRF token double-submit strategy for state-changing routes
- Output encoding and strict sanitization in UI rendering

## Scalability
- Stateless API containers
- Redis-backed queues for reminders
- Horizontal API/Web scaling behind load balancer
- Postgres as managed service (recommended in production)
- Gemini service isolated behind rate control and strict schema parsing
