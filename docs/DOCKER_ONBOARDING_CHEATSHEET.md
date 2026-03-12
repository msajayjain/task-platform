# Docker Onboarding Cheatsheet (Windows / PowerShell)

Use this page for **fast copy-paste onboarding**.

- **Local Docker setup** = build from source code in this repo.
- **Cloud Docker setup** = pull prebuilt API/Web images from Docker Hub.

---

## Local Docker setup (standard sequence)

Run from repo root:

- `docker compose down`
- `docker compose up --build -d`
- `docker compose exec api npm run prisma:seed -w apps/api`
- `docker compose logs web --tail 100`
- `docker compose logs api --tail 100`

Open:

- Web: `http://localhost:3000`
- API health: `http://localhost:3001/api/health`

---

## Cloud Docker setup (standard sequence)

Run from repo root:

- `Copy-Item .env.cloud.example .env.cloud`
- `./scripts/docker-cloud-verify.ps1 -EnvFile .env.cloud`
- `./scripts/docker-cloud.ps1 pull -EnvFile .env.cloud`
- `./scripts/docker-cloud.ps1 up -Detached -EnvFile .env.cloud`
- `./scripts/docker-cloud.ps1 ps -EnvFile .env.cloud`

Optional logs:

- `./scripts/docker-cloud.ps1 logs -EnvFile .env.cloud`

Open:

- Web: `http://localhost:3000`
- API health: `http://localhost:3001/api/health`

---

## First login (after seed)

- Admin: `admin@task.local` / `Admin@123456`
- User: `user@task.local` / `User@123456`

---

## Which guide to read next?

- Local Docker full guide: `docs/HOW_TO_RUN_WITH_DOCKER.md`
- Cloud Docker full guide: `docs/HOW_TO_DEPLOY_ON_DOCKER_HUB_CLOUD.md`
- Operations runbook: `docs/RUNBOOK.md`
