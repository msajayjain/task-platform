# Scripts Folder Guide (Windows + PowerShell)

This folder contains helper scripts for local operations.

Run all commands from the repository root: `task-platform`.

For sharing images through Docker Hub (so others can run without building locally), see:

- Primary guide (recommended): `docs/HOW_TO_DEPLOY_ON_DOCKER_HUB_CLOUD.md`
- Advanced/reference guide: `docs/HOW_TO_DEPLOY_DOCKER_HUB.md`
- Required files: `docker-compose.cloud.yml`, `.env.cloud.example`, `scripts/docker-cloud.ps1`
- Verify Docker Hub tags before pull: `scripts/docker-cloud-verify.ps1`

---

## 1) Run project without Docker (Windows / PowerShell)

Use this mode when PostgreSQL and Redis are available on your machine.

### First-time setup

- Install dependencies:
	- `npm install`
- Generate Prisma client:
	- `npm run prisma:generate`
- Apply migrations:
	- `npm run prisma:migrate`
- Seed sample data (optional but recommended):
	- `npm run prisma:seed`

### Start applications

- Start API + Web together:
	- `npm run dev`
- Or start separately:
	- `npm run dev:api`
	- `npm run dev:web`

Default URLs:

- Web: `http://localhost:3000`
- API: `http://localhost:3001`

---

## 2) Run project with Docker (Windows / PowerShell)

Use `scripts/docker.ps1` if you want simple PowerShell commands instead of long Docker Compose commands.

### Before you start (one-time checks)

1. Install Docker Desktop.
2. Open Docker Desktop and wait until it shows it is running.
3. Open PowerShell in the project root folder (`task-platform`).

### First-time setup (recommended)

Run this once to create Docker-specific env overrides (optional but cleaner):

- `Copy-Item .env.docker.example .env.docker`

Then start everything:

- `./scripts/docker.ps1 up -EnvFile .env.docker`

### What does “build included” mean?

When you run `./scripts/docker.ps1 up`, Docker will:

1. build the API and Web images from your source code,
2. start Postgres, Redis, API, and Web containers,
3. keep services running.

This is why first startup can take a few minutes.

### Daily use (after first setup)

- Start stack (foreground, shows logs in current window):
	- `./scripts/docker.ps1 up`
- Start stack in background (recommended for daily work):
	- `./scripts/docker.ps1 up -Detached`
- View logs when running in background:
	- `./scripts/docker.ps1 logs`

### Stop and cleanup

- Stop containers only (keeps DB data):
	- `./scripts/docker.ps1 down`
- Stop and remove volumes (deletes DB data):
	- `./scripts/docker.ps1 down -RemoveVolumes`

### Helpful commands

- Validate effective Docker Compose config:
	- `./scripts/docker.ps1 config`
- Seed database data:
	- `./scripts/docker.ps1 seed`

### Where to open the app

- Web UI: `http://localhost:3000`
- API health: `http://localhost:3001/api/health`

---

## 3) Windows command prompt equivalents (CMD)

If you prefer Command Prompt, use Docker Compose directly:

- `docker compose up --build`
- `docker compose up -d --build`
- `docker compose logs -f`
- `docker compose down`
- `docker compose down -v`

---

## 4) Run Docker Hub / Cloud mode (Windows / PowerShell)

Use `scripts/docker-cloud.ps1` when images are already published to Docker Hub.

### First-time setup

- `Copy-Item .env.cloud.example .env.cloud`
- Edit `.env.cloud` and set:
	- `TP_DOCKERHUB_USER`
	- `TP_APP_VERSION`
	- `TP_JWT_ACCESS_SECRET`, `TP_JWT_REFRESH_SECRET`, `TP_CSRF_SECRET`

### Run commands

- Verify image tags exist on Docker Hub (recommended before pull):
	- `./scripts/docker-cloud-verify.ps1 -EnvFile .env.cloud`

- Pull latest images from Docker Hub:
	- `./scripts/docker-cloud.ps1 pull`
	- If you get `manifest unknown`, publish/push images first and ensure `.env.cloud` values match pushed tag/user.
- Start stack in background (recommended):
	- `./scripts/docker-cloud.ps1 up -Detached`
- View logs:
	- `./scripts/docker-cloud.ps1 logs`
- Show running containers:
	- `./scripts/docker-cloud.ps1 ps`
- Stop:
	- `./scripts/docker-cloud.ps1 down`
- Stop and remove DB volume:
	- `./scripts/docker-cloud.ps1 down -RemoveVolumes`

### Optional: validate cloud compose config

- `./scripts/docker-cloud.ps1 config -EnvFile .env.cloud`

---

## 5) Common PowerShell issue

If script execution is blocked, run PowerShell as Administrator once:

- `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

Then run the script again.
