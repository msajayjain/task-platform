# How to Deploy on Docker Hub Cloud

## 1) Deploy on cloud (assuming local Docker images are already running, now push to Docker Hub)

Section prerequisites:
- Docker Desktop is running.
- Local images `task-platform-api:latest` and `task-platform-web:latest` exist.
- You have Docker Hub credentials.

1. `docker login`  
   Authenticate your local Docker client to Docker Hub.

2. `docker tag task-platform-api:latest <your-user>/task-platform-api:<tag>`  
   Tag your local API image for Docker Hub.

3. `docker tag task-platform-web:latest <your-user>/task-platform-web:<tag>`  
   Tag your local Web image for Docker Hub.

4. `docker push <your-user>/task-platform-api:<tag>`  
   Push API image to Docker Hub.

5. `docker push <your-user>/task-platform-web:<tag>`  
   Push Web image to Docker Hub.

6. `docker pull <your-user>/task-platform-api:<tag>`  
   Verify API image can be pulled from Docker Hub.

7. `docker pull <your-user>/task-platform-web:<tag>`  
   Verify Web image can be pulled from Docker Hub.

Example commands:

- `docker tag task-platform-web:latest ajayjain/task-platform-web:1.0`
- `docker tag task-platform-api:latest ajayjain/task-platform-api:1.0`
- `docker push ajayjain/task-platform-web:1.0`
- `docker push ajayjain/task-platform-api:1.0`

---

## 2) Deploy on cloud from beginning using `docker-compose.cloud.yml` (direct compose commands)

Section prerequisites:
- Docker Desktop is running.
- You are in repo root (`task-platform`).
- Files exist: `docker-compose.cloud.yml` and `.env.cloud.example`.

1. `Copy-Item .env.cloud.example .env.cloud`  
   Create cloud environment file from template.

2. `docker compose --env-file .env.cloud -f docker-compose.cloud.yml pull`  
   Pull API/Web images and required runtime images.

3. `docker compose --env-file .env.cloud -f docker-compose.cloud.yml up -d`  
   Start full cloud stack in background.

4. `docker compose --env-file .env.cloud -f docker-compose.cloud.yml ps`  
   Confirm service health and running status.

5. `docker compose --env-file .env.cloud -f docker-compose.cloud.yml logs -f`  
   Follow logs for startup verification and troubleshooting.

6. `docker compose --env-file .env.cloud -f docker-compose.cloud.yml down`  
   Stop all running cloud stack services.

7. `docker compose --env-file .env.cloud -f docker-compose.cloud.yml down -v`  
   Stop services and remove volumes (destructive for DB data).

---

## 3) Deploy on cloud from beginning using `docker-compose.cloud.yml` (PowerShell scripts)

Section prerequisites:
- PowerShell is opened at repo root (`task-platform`).
- Docker Desktop is running.
- Files exist: `scripts/docker-cloud.ps1`, `scripts/docker-cloud-verify.ps1`, and `.env.cloud.example`.

1. `Copy-Item .env.cloud.example .env.cloud`  
   Create cloud environment file from template.

2. `./scripts/docker-cloud-verify.ps1 -EnvFile .env.cloud`  
   Validate Docker Hub image/tag availability before pull.

3. `./scripts/docker-cloud.ps1 pull -EnvFile .env.cloud`  
   Pull all required images for cloud stack.

4. `./scripts/docker-cloud.ps1 up -Detached -EnvFile .env.cloud`  
   Start full cloud stack in background mode.

5. `./scripts/docker-cloud.ps1 ps -EnvFile .env.cloud`  
   Check running container and health status.

6. `./scripts/docker-cloud.ps1 logs -EnvFile .env.cloud`  
   View runtime logs for validation or troubleshooting.

7. `./scripts/docker-cloud.ps1 down -EnvFile .env.cloud`  
   Stop all running cloud stack services.

8. `./scripts/docker-cloud.ps1 down -RemoveVolumes -EnvFile .env.cloud`  
   Stop services and remove volumes (destructive for DB data).
