# Docker Hub Publish Guide (Advanced Reference)

This guide focuses on building, tagging, and publishing images to Docker Hub.

> For non-technical runtime steps, use `docs/HOW_TO_DEPLOY_ON_DOCKER_HUB_CLOUD.md`.
> This document is intentionally kept as the detailed publish reference.

## Scope of this document

After completing these steps, you will have Docker Hub images published for:

- `<your-user>/task-platform-api:<tag>`
- `<your-user>/task-platform-web:<tag>`

Then users can run those images using `docker-compose.cloud.yml` and `.env.cloud` (see the non-technical guide above).

---

## 1) Prerequisites

1. Install Docker Desktop.
2. Create a Docker Hub account.
3. Create two repositories in Docker Hub:
   - `<your-user>/task-platform-api`
   - `<your-user>/task-platform-web`
4. Open PowerShell in project root (`task-platform`).

---

## 2) Login to Docker Hub

Run:

- `docker login`

Enter your Docker Hub username and password (or access token).

---

## 3) Build images locally

Run these from project root:

- `docker build -f docker/api.Dockerfile -t <your-user>/task-platform-api:1.0.0 .`
- `docker build -f docker/web.Dockerfile -t <your-user>/task-platform-web:1.0.0 .`

Optional latest tags:

- `docker tag <your-user>/task-platform-api:1.0.0 <your-user>/task-platform-api:latest`
- `docker tag <your-user>/task-platform-web:1.0.0 <your-user>/task-platform-web:latest`

---

## 4) Push images to Docker Hub

- `docker push <your-user>/task-platform-api:1.0.0`
- `docker push <your-user>/task-platform-web:1.0.0`

If you created `latest` tags, push those too:

- `docker push <your-user>/task-platform-api:latest`
- `docker push <your-user>/task-platform-web:latest`

---

## 5) Prepare cloud runtime env

1. Copy template:
   - `Copy-Item .env.cloud.example .env.cloud`
2. Edit `.env.cloud`:
   - set `TP_DOCKERHUB_USER=<your-user>`
   - set `TP_APP_VERSION=1.0.0` (or `latest`)
   - replace `TP_JWT_ACCESS_SECRET`, `TP_JWT_REFRESH_SECRET`, `TP_CSRF_SECRET` with strong values
   - set AI provider key if you want AI features enabled

---

## 6) Run from Docker Hub images

Recommended PowerShell flow:

- Verify tags exist:
   - `./scripts/docker-cloud-verify.ps1 -EnvFile .env.cloud`
- Pull images from Docker Hub:
   - `./scripts/docker-cloud.ps1 pull`
- Start stack in background:
   - `./scripts/docker-cloud.ps1 up -Detached`

What this does:

1. pulls `api` and `web` images from Docker Hub,
2. starts Postgres + Redis + API + Web,
3. runs DB migrations in API container,
4. serves app on local ports.

---

## 7) Verify it is running

- Web: `http://localhost:3000`
- API health: `http://localhost:3001/api/health`

Useful checks:

- logs: `./scripts/docker-cloud.ps1 logs`
- running containers: `./scripts/docker-cloud.ps1 ps`

---

## 8) Share with other users

Share these files:

- `docker-compose.cloud.yml`
- `.env.cloud.example`
- this guide (`docs/HOW_TO_DEPLOY_DOCKER_HUB.md`)

And tell users:

1. set their Docker Hub username/tag in `.env.cloud`,
2. follow `docs/HOW_TO_DEPLOY_ON_DOCKER_HUB_CLOUD.md` to run the stack.

---

## 9) Stop and cleanup

- Stop containers: `./scripts/docker-cloud.ps1 down`
- Stop + remove DB volume (deletes DB data):
   - `./scripts/docker-cloud.ps1 down -RemoveVolumes`

### Optional direct compose commands (without helper script)

- `docker compose --env-file .env.cloud -f docker-compose.cloud.yml up -d`
- `docker compose --env-file .env.cloud -f docker-compose.cloud.yml logs -f`
- `docker compose --env-file .env.cloud -f docker-compose.cloud.yml down`

---

## Common mistakes and fixes

1. **`no such file or directory: api.Dockerfile`**
   - Use `-f docker/api.Dockerfile` (Dockerfiles are inside `docker/` folder).

2. **App starts but AI features fail**
   - Set valid AI provider key in `.env.cloud`.

3. **Auth errors in deployed app**
   - Ensure JWT/CSRF secrets are replaced with strong non-placeholder values.

4. **`manifest unknown` when running cloud pull**
   - Cause: the requested tag was not pushed to Docker Hub.
   - Fix:
     - push the image with that exact tag,
     - set `.env.cloud` values to match (`TP_DOCKERHUB_USER`, `TP_APP_VERSION`),
     - run `./scripts/docker-cloud.ps1 pull` again.
