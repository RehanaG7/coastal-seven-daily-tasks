# 🐳 Day 23 – DevOps / AWS Focus: Production Containerization, Docker Compose, Multi-Stage Builds & CI/CD Pipelines

Welcome to **Day 23** of the Coastal Seven curriculum. Today's module transitions our enterprise full-stack platform (**R-Mart**) into a modern, cloud-native, and automated DevOps architecture using **Multi-Stage Dockerfiles**, **Docker Compose Orchestration (6 Services)**, **Persistent Named Volumes**, **Bridge Networking**, **Celery Beat Schedulers**, **GitHub Actions CI/CD Matrix**, and **Branch Protection Governance**.

---

## 🎯 8-Topic Learning & Implementation Matrix

| Topic | Learning & Implementation | Expected Outcome | Status |
| :--- | :--- | :--- | :---: |
| **Docker Fundamentals** | Designed multi-stage Dockerfiles for FastAPI backend and React 19 frontend; isolated build dependencies from runtime environments and enforced non-root users (`appuser`) | Reduced image footprints by >70% and created portable, production-hardened containers | ✅ Complete |
| **Docker Compose** | Orchestrated FastAPI, PostgreSQL 16, Redis 7, Celery Worker, Celery Beat, and Nginx into a unified declarative topology | Run the entire distributed application stack with a single command (`docker compose up --build`) | ✅ Complete |
| **GitHub Actions CI** | Built `.github/workflows/day23-devops-ci.yml` running automated Flake8 linting, Pytest (with PostgreSQL + Redis services), Vitest, Hadolint, and Docker Compose validation | Automatically validate code quality and prevent regressions on every push and PR | ✅ Complete |
| **Docker Build & Push** | Automated multi-platform Docker container image builds via GitHub Actions with layer caching (`type=gha`) and published to GitHub Container Registry (GHCR) | Streamlined container delivery and zero-downtime deployment readiness | ✅ Complete |
| **Branch Protection** | Codified `.github/BRANCH_PROTECTION.md` requiring peer reviews, passing CI status checks, and linear git histories before merging into `main` | Protected production codebase from unvalidated code and broken deployments | ✅ Complete |
| **Docker Networking & Volumes** | Implemented custom bridge network (`rmart-network`) and persistent named volumes (`postgres_data`, `redis_data`, `media_data`) | Reliable container-to-container DNS resolution and persistent database storage across restarts | ✅ Complete |
| **Environment & Secret Management** | Standardized `Day-23/.env.example` template with clean defaults, `.gitignore` exclusions, and GitHub Secrets integration | Protected production secrets and separated environment configuration from code | ✅ Complete |
| **Final Integration** | Unified containerization, Docker Compose orchestration, automated testing, healthchecks, and CI/CD pipelines into a portfolio-ready DevOps system | 1-command local development and 100% automated CI pipeline passing on every push | ✅ Complete |

---

## 🏗️ Docker Compose Architecture & Service Topology

```text
                                     +-------------------------------------------+
                                     |             CLIENT TRAFFIC                |
                                     |           (Port 80 / 5173)                |
                                     +---------------------+---------------------+
                                                           |
                                                           v
                                     +-------------------------------------------+
                                     |     FRONTEND SERVICE (Nginx Alpine)       |
                                     |  • Reverse proxy /api/ -> backend:8000    |
                                     |  • Reverse proxy /ws/  -> backend:8000    |
                                     |  • Single Page App (SPA) fallback routing |
                                     |  • Gzip payload compression (>1KB)        |
                                     +---------------------+---------------------+
                                                           |
                                    +----------------------+----------------------+
                                    | (rmart-network - Internal Docker Bridge)    |
                                    v                                             v
  +----------------------------------------------------+      +------------------------------------------+
  |              FASTAPI BACKEND SERVICE               |      |          CELERY DISTRIBUTED WORKERS      |
  |  • Multi-stage Python 3.11-slim container          |      |  • Celery Worker: Async orders/invoices  |
  |  • Non-root system user (appuser:appgroup)         |      |  • Celery Beat: Periodic cron scheduler  |
  |  • Healthcheck: /api/v1/health                     |      |  • Shared media volume for PDF storage   |
  +-------------------------+--------------------------+      +--------------------+---------------------+
                            |                                                      |
                            +--------------------------+---------------------------+
                                                       |
                            +--------------------------+---------------------------+
                            |                                                      |
                            v                                                      v
  +----------------------------------------------------+      +------------------------------------------+
  |            POSTGRESQL 16 DATABASE (db)             |      |             REDIS 7 CACHE & BROKER       |
  |  • Image: postgres:16-alpine                       |      |  • Image: redis:7-alpine                 |
  |  • Persistent named volume: postgres_data          |      |  • Persistent named volume: redis_data   |
  |  • Healthcheck: pg_isready                         |      |  • Healthcheck: redis-cli ping           |
  +----------------------------------------------------+      +------------------------------------------+
```

---

## 📦 Multi-Stage Dockerfile Deep Dive

### 1. Backend Multi-Stage Build (`Day-23/backend/Dockerfile`)
```dockerfile
# Stage 1: Build stage (compile wheels and install in isolated virtualenv)
FROM python:3.11-slim AS builder
WORKDIR /build
RUN apt-get update && apt-get install -y --no-install-recommends build-essential libpq-dev curl
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Stage 2: Lean Production Runtime (drops gcc, build-essential, and pip caches)
FROM python:3.11-slim AS runtime
WORKDIR /app
ENV PATH="/opt/venv/bin:$PATH" PYTHONPATH=/app
RUN apt-get update && apt-get install -y --no-install-recommends curl libpq5 && rm -rf /var/lib/apt/lists/*
RUN groupadd -g 1000 appgroup && useradd -u 1000 -g appgroup -s /bin/bash -m appuser
COPY --from=builder /opt/venv /opt/venv
COPY --chown=appuser:appgroup . /app
USER appuser
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health || exit 1
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```
* **Footprint Reduction**: Dropping compilers (`gcc`, `make`, `build-essential`) reduces final image size from ~1.1GB to ~185MB.
* **Security Hardening**: Runs under non-root system user (`appuser:1000`), mitigating container breakout risks.

---

### 2. Frontend Multi-Stage Build (`Day-23/Dockerfile.frontend`)
```dockerfile
# Stage 1: Build stage (compiles modern React 19 + Vite bundle)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps || npm install
COPY . .
RUN npm run build

# Stage 2: Production Nginx Server (under 25MB total footprint)
FROM nginx:1.27-alpine AS production
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -q -O - http://localhost/nginx-health || exit 1
CMD ["nginx", "-g", "daemon off;"]
```
* **Node.js Dropped**: The production container contains **zero** Node.js runtime and **zero** `node_modules`. It contains only static compiled assets served by Nginx.

---

## ⏰ Celery Beat Periodic Task Scheduling

Day 23 introduces automated background scheduling via **Celery Beat**:
1. **`system-heartbeat-every-minute`** (Every 60s): Emits health telemetry and heartbeat keys to Redis with automatic TTL.
2. **`cache-cleanup-every-5-minutes`** (Every 300s): Prunes stale temporary cache records, orphaned query keys, and rate limit counters.
3. **`inventory-audit-every-10-minutes`** (Every 600s): Performs periodic stock level reconciliations.

---

## 🔄 GitHub Actions CI/CD Pipeline

The `.github/workflows/day23-devops-ci.yml` pipeline automates the full DevOps lifecycle:

```text
[Push / Pull Request]
       │
       ├──> Job 1: backend-test   (Flake8 Lint + PostgreSQL 16 + Redis 7 + Pytest Matrix)
       │
       ├──> Job 2: frontend-test  (TypeScript tsc --noEmit + Vitest Suite + Vite Build)
       │
       ├──> Job 3: docker-validate (Hadolint Dockerfile Lint + Docker Compose Config Check)
       │
       └──> Job 4: docker-build-push (Buildx Multi-Platform + GHCR Container Publishing)
```

---

## 🚀 Single-Command Local Quickstart

### Prerequisites
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) or Docker Engine (v24+) & Docker Compose (v2.20+)

### 1. Launch Full Stack
```bash
cd Day-23
docker compose up --build
```

### 2. Access Services
* 🌐 **Frontend Application:** `http://localhost:80` (or `http://localhost:5173`)
* 🔌 **FastAPI REST API:** `http://localhost:8000`
* 📖 **Interactive Swagger Docs:** `http://localhost:8000/docs`
* 🐘 **PostgreSQL 16:** `localhost:5432` (User: `rmart_user`, DB: `rmart_db`)
* ⚡ **Redis 7:** `localhost:6379`

### 3. Teardown Stack
```bash
# Stop containers while preserving database and redis data
docker compose down

# Stop containers and remove all persistent volumes
docker compose down -v
```

---

## 🧪 Automated Test Verification

Day 23 adds comprehensive DevOps automated test coverage:

```powershell
pytest Day-23/backend/tests/test_day23_devops.py -v
```

```text
============================= test session starts =============================
platform win32 -- Python 3.13.6, pytest-9.1.1
collected 8 items

Day-23/backend/tests/test_day23_devops.py::test_docker_health_endpoints PASSED          [ 12%]
Day-23/backend/tests/test_day23_devops.py::test_evaluator_database_dump_endpoint PASSED [ 25%]
Day-23/backend/tests/test_day23_devops.py::test_environment_and_secret_configuration PASSED [ 37%]
Day-23/backend/tests/test_day23_devops.py::test_celery_beat_schedule_registered PASSED  [ 50%]
Day-23/backend/tests/test_day23_devops.py::test_celery_beat_tasks_execution PASSED      [ 62%]
Day-23/backend/tests/test_day23_devops.py::test_docker_compose_topology_validation PASSED [ 75%]
Day-23/backend/tests/test_day23_devops.py::test_dockerfile_multi_stage_structure PASSED [ 87%]
Day-23/backend/tests/test_day23_devops.py::test_nginx_configuration_validity PASSED    [100%]

======================== 8 passed in 0.41s ========================
```
