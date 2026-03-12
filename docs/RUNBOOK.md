# Runbook

## 1) Run on local (without Docker)

Section prerequisites:
- Node.js and npm are installed.
- PostgreSQL is running on `localhost:5432`.
- Redis is running on `localhost:6379`.
- You are in repo root (`task-platform`).

1. `Copy-Item .env.example .env`  
   Create local environment file.

2. `npm install`  
   Install all workspace dependencies.

3. `npm run prisma:generate`  
   Generate Prisma client artifacts.

4. `npm run prisma:migrate`  
   Apply database migrations to local PostgreSQL.

5. `npm run prisma:seed`  
   Seed default users/teams/workflow data.

6. `npm run dev`  
   Start local API and Web in development mode.

7. `Invoke-WebRequest -UseBasicParsing http://localhost:3001/api/health`  
   Verify API health endpoint is responding.

---

## 2) Deploy on local (using `docker-compose.yml`)

Section prerequisites:
- Docker Desktop is running.
- You are in repo root (`task-platform`).
- Files exist: `docker-compose.yml` and `.env.example`.

1. `Copy-Item .env.example .env`  
   Create runtime environment file for local Docker stack.

2. `docker compose down`  
   Stop and clean any previous local stack state.

3. `docker compose up --build -d`  
   Build and start full local Docker stack in detached mode.

4. `docker compose exec api npm run prisma:seed -w apps/api`  
   Seed database inside the API container.

5. `docker compose ps`  
   Confirm service status and health.

6. `docker compose logs web --tail 100`  
   Check Web startup logs.

7. `docker compose logs api --tail 100`  
   Check API startup logs.

---

## 3) Deploy on cloud (assuming local Docker images are already running, now push to Docker Hub)

Section prerequisites:
- Docker Desktop is running.
- Local images `task-platform-api:latest` and `task-platform-web:latest` exist.
- Docker Hub account/credentials are available.

1. `docker login`  
   Authenticate Docker client to Docker Hub.

2. `docker tag task-platform-api:latest <your-user>/task-platform-api:<tag>`  
   Tag local API image for Docker Hub.

3. `docker tag task-platform-web:latest <your-user>/task-platform-web:<tag>`  
   Tag local Web image for Docker Hub.

4. `docker push <your-user>/task-platform-api:<tag>`  
   Push API image to Docker Hub.

5. `docker push <your-user>/task-platform-web:<tag>`  
   Push Web image to Docker Hub.

6. `docker pull <your-user>/task-platform-api:<tag>`  
   Verify API image is available from Docker Hub.

7. `docker pull <your-user>/task-platform-web:<tag>`  
   Verify Web image is available from Docker Hub.

Example commands:

- `docker tag task-platform-web:latest ajayjain/task-platform-web:1.0`
- `docker tag task-platform-api:latest ajayjain/task-platform-api:1.0`
- `docker push ajayjain/task-platform-web:1.0`
- `docker push ajayjain/task-platform-api:1.0`

---

## 4) Deploy on cloud from beginning using `docker-compose.cloud.yml` (direct compose commands)

Section prerequisites:
- Docker Desktop is running.
- You are in repo root (`task-platform`).
- Files exist: `docker-compose.cloud.yml` and `.env.cloud.example`.

1. `Copy-Item .env.cloud.example .env.cloud`  
   Create cloud environment file from template.

2. `docker compose --env-file .env.cloud -f docker-compose.cloud.yml pull`  
   Pull API/Web and required runtime images.

3. `docker compose --env-file .env.cloud -f docker-compose.cloud.yml up -d`  
   Start full cloud stack in detached mode.

4. `docker compose --env-file .env.cloud -f docker-compose.cloud.yml ps`  
   Verify cloud stack service status.

5. `docker compose --env-file .env.cloud -f docker-compose.cloud.yml logs -f`  
   Follow runtime logs for validation.

6. `docker compose --env-file .env.cloud -f docker-compose.cloud.yml down`  
   Stop cloud stack services.

7. `docker compose --env-file .env.cloud -f docker-compose.cloud.yml down -v`  
   Stop services and remove volumes (destructive).

---

## 5) Deploy on cloud from beginning using `docker-compose.cloud.yml` (PowerShell scripts)

Section prerequisites:
- PowerShell is opened in repo root (`task-platform`).
- Docker Desktop is running.
- Files exist: `scripts/docker-cloud.ps1`, `scripts/docker-cloud-verify.ps1`, and `.env.cloud.example`.

1. `Copy-Item .env.cloud.example .env.cloud`  
   Create cloud environment file from template.

2. `./scripts/docker-cloud-verify.ps1 -EnvFile .env.cloud`  
   Verify Docker Hub image/tag availability.

3. `./scripts/docker-cloud.ps1 pull -EnvFile .env.cloud`  
   Pull all required cloud images.

4. `./scripts/docker-cloud.ps1 up -Detached -EnvFile .env.cloud`  
   Start cloud stack in background mode.

5. `./scripts/docker-cloud.ps1 ps -EnvFile .env.cloud`  
   Check cloud stack health/status.

6. `./scripts/docker-cloud.ps1 logs -EnvFile .env.cloud`  
   View runtime logs for troubleshooting.

7. `./scripts/docker-cloud.ps1 down -EnvFile .env.cloud`  
   Stop cloud stack services.

8. `./scripts/docker-cloud.ps1 down -RemoveVolumes -EnvFile .env.cloud`  
   Stop services and remove volumes (destructive).
