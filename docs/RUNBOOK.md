# Runbook

This runbook is split into **two fully separate paths**. Use **one path only**.

---

## Path 1 — Run **Without Docker** (Local PostgreSQL + Redis)

### 1) Install required software

- Node.js 20+ (includes npm): `https://nodejs.org/en/download`
- PostgreSQL: `https://www.postgresql.org/download/`
- Redis install docs: `https://redis.io/docs/latest/operate/oss_and_stack/install/install-redis/`
	- Windows note: local native Redis support is limited; Docker/WSL2 is commonly used.

### 2) Verify software is installed

Run:
- `node -v`
- `npm -v`
- `psql --version`

Optional Redis check command (if `redis-cli` exists):
- `redis-cli ping`

Expected:
- version outputs for node/npm/psql
- `PONG` for Redis ping

If Redis is not installed locally, run Redis via Docker:
- `docker compose up -d redis`

Then verify port `6379` is listening (PowerShell):
- `Get-NetTCPConnection -LocalPort 6379 -ErrorAction SilentlyContinue`

### 3) Start local services

- Start PostgreSQL server on `localhost:5432`
- Start Redis server on `localhost:6379`

### 4) Open repository and create env file

From repo root (`task-platform/`):

PowerShell:
- `Copy-Item .env.example .env`

Bash:
- `cp .env.example .env`

### 5) Set required `.env` values for local mode

At minimum verify these values in `.env`:
- `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/task-platform`
- `REDIS_URL=redis://localhost:6379`
- `API_PROXY_TARGET=http://localhost:3001`
- `JWT_ACCESS_SECRET=...`
- `JWT_REFRESH_SECRET=...`
- `CSRF_SECRET=...`

### 6) Create database if missing

Option A (quick):
- `createdb task-platform`

Option B (inside psql):
- `psql -U postgres`
- `CREATE DATABASE "task-platform";`

### 7) Install dependencies and bootstrap database

Run in order:
- `npm install`
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:seed`

### 8) Run applications

- `npm run dev`

### 9) Verify application

- Web: `http://localhost:3000`
- API health: `http://localhost:3001/api/health`

---

## Path 2 — Run **With Docker** (All services in containers)

### 1) Install required software

- Docker Desktop: `https://www.docker.com/products/docker-desktop/`

### 2) Verify Docker installation

Run:
- `docker --version`
- `docker compose version`

### 3) Open repository and create env file

From repo root (`task-platform/`):

PowerShell:
- `Copy-Item .env.example .env`

Bash:
- `cp .env.example .env`

### 4) Start full stack

- `docker compose up --build`

This starts:
- PostgreSQL
- Redis
- API (`3001`)
- Web (`3000`)

### 5) Seed data (required for first run / new DB volume)

- `docker compose exec api npm run prisma:seed -w apps/api`

### 6) Verify application

- Web: `http://localhost:3000`
- API health: `http://localhost:3001/api/health`

> Docker-only users do **not** need local PostgreSQL/Redis installed on host.

---

## First Login (both paths)

After seeding, login using:
- Admin: `admin@task.local` / `Admin@123456`
- User: `user@task.local` / `User@123456`

Seed also creates default teams:
- General
- Development
- QA
- Support
- Infrastructure
- Operations

---

## Optional quality checks

- `npm run test`
- `npm run lint`
- `npm run build`

---

## Quick trouble checks

- If API cannot connect to DB in local mode, re-check `DATABASE_URL` and PostgreSQL service status.
- If Redis errors appear in local mode, re-check `REDIS_URL` and Redis service status.
- For detailed Redis runtime behavior and fixes, see: `docs/redis_doc.md`.
- If first login fails, run seed again:
	- Local: `npm run prisma:seed`
	- Docker: `docker compose exec api npm run prisma:seed -w apps/api`
