# How to Run With Docker

This guide explains how to run Task Platform using Docker Compose.

---

## Prerequisites

- Docker Desktop (or Docker Engine + Compose)

Install Docker Desktop (if missing):
- `https://www.docker.com/products/docker-desktop/`

Verify Docker:
- `docker --version`
- `docker compose version`

> No mandatory `.env` edits are required for local Docker startup anymore.
> Docker-only users do **not** need local PostgreSQL/Redis installed.

---

## 1) Quick start (run anywhere)

From repo root:

- `docker compose up --build`

PowerShell helper (Windows):

- `./scripts/docker.ps1 up`

This command builds and starts:

- `postgres` (`5432`)
- `redis` (`6379`)
- `api` (`3001`)
- `web` (`3000`)

The compose file now contains portable defaults for required runtime values.

---

## 2) Optional environment override

If you want custom secrets/URLs without editing your root `.env`:

1. Copy `.env.docker.example` to `.env.docker`
2. Edit values as needed
3. Start with:

- `docker compose --env-file .env.docker up --build`

Note:

- Compose uses `TP_*` variables for Docker overrides (for example, `TP_DATABASE_URL`, `TP_API_PROXY_TARGET`).
- This avoids collisions with your existing root `.env` values used for non-Docker local development.

---

## 3) Run in background (optional)

- `docker compose up -d --build`

PowerShell helper:

- `./scripts/docker.ps1 up -Detached`

View logs:

- `docker compose logs -f`

PowerShell helper:

- `./scripts/docker.ps1 logs`

Stop services:

- `docker compose down`

PowerShell helper:

- `./scripts/docker.ps1 down`

Stop and remove volumes (careful: removes DB data):

- `docker compose down -v`

PowerShell helper:

- `./scripts/docker.ps1 down -RemoveVolumes`

---

## 4) Initialize database (first-time setup)

Compose runs `prisma migrate deploy` automatically when API starts.

For a first-time developer setup, run seed once so users/teams exist:

- `docker compose exec api npm run prisma:seed -w apps/api`

PowerShell helper:

- `./scripts/docker.ps1 seed`

After seed, first login credentials are:
- Admin: `admin@task.local` / `Admin@123456`
- User: `user@task.local` / `User@123456`

---

## 5) Verify application

- Web: `http://localhost:3000`
- API health: `http://localhost:3001/api/health`

---

## 6) Common issues

### API cannot reach database

- Ensure the API container uses `postgres` as DB host and `redis` as Redis host.
- If using custom env file, confirm values match Docker service names.

### Web cannot reach API

- Verify `API_PROXY_TARGET=http://api:3001` for container networking.

### AI local model cannot be reached from containers

- Default in compose uses `LOCAL_LLM_API_URL=http://host.docker.internal:11434/api/generate`.
- Ensure local model runtime is accessible on host machine.
- For Linux Docker engines, set a reachable host/IP in your env override file.

### Rebuild needed after env/dependency changes

- Run with rebuild: `docker compose up --build`

PowerShell helper:

- `./scripts/docker.ps1 up`

---

## 7) Recommended dev workflow

- For fastest code iteration: run without Docker.
- For environment parity and onboarding: run with Docker.

---

## Summary

Docker mode provides a reproducible full-stack environment with one command and is ideal for team onboarding and consistency.
