# How to Run With Docker

This guide explains **local Docker setup** (build from source + run locally).

> For Docker Hub image-based cloud onboarding, use `docs/HOW_TO_DEPLOY_ON_DOCKER_HUB_CLOUD.md`.

---

## Prerequisites

- Docker Desktop (or Docker Engine + Compose)

Install Docker Desktop (if missing):
- `https://www.docker.com/products/docker-desktop/`

Verify Docker:
- `docker --version`
- `docker compose version`

> No mandatory `.env` edits are required for local Docker startup anymore.
> Docker-only users do **not** need local PostgreSQL/Redis/Ollama installed.

---

## 1) Quick start (run anywhere)

Section prerequisites:
- Docker Desktop is running.
- You are in repo root (`task-platform`).

From repo root:

- `docker compose up --build`

PowerShell helper (Windows):

- `./scripts/docker.ps1 up`

This command builds and starts:

- `postgres` (`5432`)
- `redis` (`6379`)
- `ollama` (`internal local LLM service`)
- `api` (`3001`)
- `web` (`3000`)

The compose file now contains portable defaults for required runtime values.

---

## 2) Optional environment override

Section prerequisites:
- Section 1 prerequisites are satisfied.
- `.env.docker.example` exists in repo root.

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

Section prerequisites:
- Section 1 prerequisites are satisfied.
- Images can be built (or already built) locally.

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

## 4) PowerShell onboarding sequence (standardized)

Section prerequisites:
- PowerShell opened in repo root (`task-platform`).
- Docker Desktop is running.

Use this exact sequence from repo root:

- `docker compose down`
- `docker compose up --build -d`
- `docker compose exec api npm run prisma:seed -w apps/api`
- `docker compose logs web --tail 100`
- `docker compose logs api --tail 100`

---

## 5) Initialize database (first-time setup)

Section prerequisites:
- `api` container is running.
- PostgreSQL service is healthy in Docker stack.

Compose runs `prisma migrate deploy` automatically when API starts.

For a first-time developer setup, run seed once so users/teams exist:

- `docker compose exec api npm run prisma:seed -w apps/api`

PowerShell helper:

- `./scripts/docker.ps1 seed`

After seed, first login credentials are:
- Admin: `admin@task.local` / `Admin@123456`
- User: `user@task.local` / `User@123456`

---

## 6) Verify application

Section prerequisites:
- Stack has started successfully (`web` + `api` up).

- Web: `http://localhost:3000`
- API health: `http://localhost:3001/api/health`

---

## 7) Common issues

Section prerequisites:
- You can run Docker Compose commands from repo root.
- You can access container logs (`docker compose logs`).

### API cannot reach database

- Ensure the API container uses `postgres` as DB host and `redis` as Redis host.
- If using custom env file, confirm values match Docker service names.

### Web cannot reach API

- Verify `API_PROXY_TARGET=http://api:3001` for container networking.

### AI local model cannot be reached from containers

- Default in compose uses `LOCAL_LLM_API_URL=http://ollama:11434/api/generate`.
- Ensure `ollama` service is healthy (`docker compose ps`).
- Model pull happens via `ollama-pull` init container on startup.

### Rebuild needed after env/dependency changes

- Run with rebuild: `docker compose up --build`

PowerShell helper:

- `./scripts/docker.ps1 up`

### Getting `500` after rebuild or container changes

Run this recovery sequence from repo root:

- `docker compose down`
- `docker compose up --build -d`
- `docker compose exec api npm run prisma:seed -w apps/api`
- `docker compose logs web --tail 100`
- `docker compose logs api --tail 100`

---

## 8) Recommended dev workflow

Section prerequisites:
- You understand local mode vs Docker mode and their port usage (`3000`, `3001`).

- For fastest code iteration: run without Docker.
- For environment parity and onboarding: run with Docker.

---

## Summary

Docker mode provides a reproducible full-stack environment with one command and is ideal for team onboarding and consistency.
