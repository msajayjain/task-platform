# How to Deploy on Docker Hub Cloud

This is a standalone, beginner-friendly guide to run Task Platform using Docker Hub images.

## Super-short quickstart (3 commands)

If images are already published to Docker Hub:

1. `Copy-Item .env.cloud.example .env.cloud`
2. `./scripts/docker-cloud.ps1 pull`
3. `./scripts/docker-cloud.ps1 up -Detached`

Open the app:

- Web: `http://localhost:3000`
- API health: `http://localhost:3001/api/health`

> Important: if you see `manifest unknown` during `pull`, it means images/tags are not published yet. Follow the publish checklist below first.

---

## Before quickstart: publish checklist (owner only)

If you are the project owner and users get pull errors, publish images first:

1. `docker login`
2. `docker build -f docker/api.Dockerfile -t <your-user>/task-platform-api:latest .`
3. `docker build -f docker/web.Dockerfile -t <your-user>/task-platform-web:latest .`
4. `docker push <your-user>/task-platform-api:latest`
5. `docker push <your-user>/task-platform-web:latest`

Then in `.env.cloud` make sure:

- `TP_DOCKERHUB_USER=<your-user>`
- `TP_APP_VERSION=latest` (or a version tag you actually pushed)

---

## Who should use this guide?

Use this when:

- you want to run from prebuilt Docker Hub images,
- you do **not** want to build images locally,
- you want non-technical users to run in a few steps.

---

## What users must have before running

1. Docker Desktop installed and running.
2. Project repo cloned (recommended), **or** at least these files present locally:
  - `docker-compose.cloud.yml`
  - `.env.cloud.example` (copy to `.env.cloud`)
  - `scripts/docker-cloud.ps1`
  - `scripts/docker-cloud-verify.ps1`

---

## First-time setup (one-time)

1. Ensure Docker Desktop is installed and running.
2. From project root, copy env template:
   - `Copy-Item .env.cloud.example .env.cloud`
3. Edit `.env.cloud` and set these required values:
   - `TP_DOCKERHUB_USER` (example: `ajayjain21`)
   - `TP_APP_VERSION` (example: `latest` or `1.0.0`)
   - `TP_JWT_ACCESS_SECRET`
   - `TP_JWT_REFRESH_SECRET`
   - `TP_CSRF_SECRET`

---

## Run commands (PowerShell)

- Verify image tags exist on Docker Hub (recommended first):
  - `./scripts/docker-cloud-verify.ps1 -EnvFile .env.cloud`
- Pull latest images:
  - `./scripts/docker-cloud.ps1 pull`
- Start containers in background:
  - `./scripts/docker-cloud.ps1 up -Detached`
- View logs:
  - `./scripts/docker-cloud.ps1 logs`
- Check running services:
  - `./scripts/docker-cloud.ps1 ps`
- Stop containers:
  - `./scripts/docker-cloud.ps1 down`
- Stop + remove DB data:
  - `./scripts/docker-cloud.ps1 down -RemoveVolumes`

---

## Optional direct Docker Compose commands

If you don’t want helper scripts:

- `docker compose --env-file .env.cloud -f docker-compose.cloud.yml pull`
- `docker compose --env-file .env.cloud -f docker-compose.cloud.yml up -d`
- `docker compose --env-file .env.cloud -f docker-compose.cloud.yml logs -f`

---

## Common issues

1. **Command not found for script**
   - Run from repo root: `task-platform`.
2. **PowerShell blocks script**
   - Run once as admin:
     - `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`
3. **Auth errors after startup**
   - Replace JWT/CSRF placeholders in `.env.cloud`.
4. **API starts but AI calls fail**
   - Add a valid AI key in `.env.cloud`.
  - Ensure `TP_AI_FALLBACK_PROVIDER` is one of: `auto`, `local`, `huggingface`, `none`.
5. **`manifest unknown` when running pull**
  - The image tag does not exist on Docker Hub.
  - Run `./scripts/docker-cloud-verify.ps1 -EnvFile .env.cloud` to confirm missing tags.
  - Push that tag first, then retry `./scripts/docker-cloud.ps1 pull`.
