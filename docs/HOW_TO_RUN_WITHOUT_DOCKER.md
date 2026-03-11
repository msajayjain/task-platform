# How to Run Without Docker

This guide explains how to run Task Platform fully on your machine (no Docker).

---

## Prerequisites

- Node.js `20.11+`
- npm `10+`
- PostgreSQL running locally (port `5432`)
- Redis running locally (port `6379`)

Install links (if missing):
- Node.js: `https://nodejs.org/en/download`
- PostgreSQL: `https://www.postgresql.org/download/`
- Redis docs: `https://redis.io/docs/latest/operate/oss_and_stack/install/install-redis/`

Quick verify commands:
- `node -v`
- `npm -v`
- `psql --version`
- `redis-cli ping` (optional; expected `PONG`)

Optional for local AI:
- Ollama (or compatible local LLM endpoint)

---

## 1) Configure environment

1. Copy `.env.example` to `.env`.
2. Update secrets and URLs.

Minimum values to verify:

- `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/task-platform`
- `REDIS_URL=redis://localhost:6379`
- `API_PROXY_TARGET=http://localhost:3001`
- `API_BASE_URL=http://localhost:3001`
- `WEB_BASE_URL=http://localhost:3000`
- valid `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CSRF_SECRET`

For local AI mode (recommended dev):

- `AI_FALLBACK_PROVIDER=local`
- `LOCAL_LLM_MODEL=qwen2.5:0.5b` (or any available model)
- `LOCAL_LLM_API_URL=http://127.0.0.1:11434/api/generate`

---

## 2) Install dependencies

From repo root:

- `npm install`

---

## 3) Start local services

- Start PostgreSQL service on `localhost:5432`
- Start Redis service on `localhost:6379`

---

## 4) Prepare database

From repo root:

- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:seed`

Important first-time note:
- If your PostgreSQL server is running but the `task-platform` database does not exist yet, create it before running migrations.

What seed creates:
- Default teams (General, Development, QA, Support, Infrastructure, Operations)
- Default login users for first access (admin + user)

Seeded login credentials:
- Admin: `admin@task.local` / `Admin@123456`
- User: `user@task.local` / `User@123456`

---

## 5) Run apps

You can run both together:

- `npm run dev`

Or separately:

- `npm run dev:api` (API at `http://localhost:3001`)
- `npm run dev:web` (Web at `http://localhost:3000`)

---

## 6) Verify health

- Open Web: `http://localhost:3000`
- API health: `http://localhost:3001/api/health`

Optional local AI check:

- `http://127.0.0.1:11434/api/tags`

---

## 7) Common issues

### Port already in use

- Change local service ports or stop conflicting process.

### Database connection failure

- Ensure PostgreSQL is running and `DATABASE_URL` is correct.
- Ensure database name in URL exists (or migration user can create it).

### Redis connection failure

- Ensure Redis is running and `REDIS_URL` is valid.
- Redis is required for queue/rate-limit/cache paths and should be available during local development.

### AI endpoint unavailable

- Confirm local LLM server is reachable.
- Keep fallback mode set appropriately in `.env`.

---

## 8) Useful quality checks

- `npm run test`
- `npm run lint`
- `npm run build`

---

## Summary

Running without Docker is best for fast local debugging and direct control over PostgreSQL/Redis/LLM services installed on your machine.
