# 🚀 Day 23: Production Container Deployment & AWS Cloud Guide

This guide details how to deploy the containerized **R-Mart** full-stack architecture to **AWS (Amazon Web Services)** and cloud container registries.

---

## 🏗️ 1. Architecture On AWS

```text
                       [ Internet Users ]
                               │
                               ▼
                   [ AWS Route 53 (DNS) ]
                               │
                               ▼
               [ Application Load Balancer (ALB) ]
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
   [ AWS App Runner / ECS ]              [ AWS ECS Fargate ]
   (Frontend React Nginx)               (FastAPI Backend Service)
            │                                     │
            │                  ┌──────────────────┴──────────────────┐
            │                  ▼                                     ▼
            │        [ Amazon RDS PostgreSQL ]             [ Amazon ElastiCache Redis ]
            │        (db.t4g.micro - Free Tier)            (cache.t4g.micro - Free)
            │                  ▲                                     ▲
            │                  │                                     │
            └──────────────────┴─────────────┬───────────────────────┘
                                             ▼
                                  [ AWS ECS Fargate ]
                              (Celery Worker & Beat Tasks)
```

---

## 🛠️ 2. Pushing Containers to Amazon ECR (Elastic Container Registry)

### Step 1: Authenticate Docker to AWS ECR
```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com
```

### Step 2: Create ECR Repositories
```bash
aws ecr create-repository --repository-name rmart-backend --region us-east-1
aws ecr create-repository --repository-name rmart-frontend --region us-east-1
```

### Step 3: Tag and Push Images
```bash
# Backend Image
docker build -t rmart-backend -f Day-23/backend/Dockerfile Day-23/backend
docker tag rmart-backend:latest <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/rmart-backend:latest
docker push <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/rmart-backend:latest

# Frontend Image
docker build -t rmart-frontend -f Day-23/Dockerfile.frontend Day-23
docker tag rmart-frontend:latest <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/rmart-frontend:latest
docker push <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/rmart-frontend:latest
```

---

## ☁️ 3. Deploying on AWS App Runner (Zero-Ops Managed Containers)

AWS App Runner provides managed container execution with automatic TLS, load balancing, and scaling:

1. Open **AWS App Runner Console** $\rightarrow$ **Create Service**.
2. **Source**: Choose **Container Registry** $\rightarrow$ **Amazon ECR**.
3. Select `rmart-backend:latest`.
4. Configure Port: `8000`.
5. Add Environment Variables:
   - `DATABASE_URL`: `postgresql+psycopg2://<user>:<password>@<rds-endpoint>:5432/rmart_db`
   - `REDIS_URL`: `redis://<elasticache-endpoint>:6379/0`
   - `CELERY_BROKER_URL`: `redis://<elasticache-endpoint>:6379/1`
   - `CELERY_RESULT_BACKEND`: `redis://<elasticache-endpoint>:6379/2`
   - `ENVIRONMENT`: `production`
6. Click **Deploy**. App Runner generates a live HTTPS URL (e.g. `https://xyz.us-east-1.awsapprunner.com`).

---

## 🐳 4. Docker CLI Command Cheatsheet

| Command | Purpose |
| :--- | :--- |
| `docker compose up --build` | Build images and start all 6 services with live terminal logs |
| `docker compose up -d` | Start all services in the background (detached mode) |
| `docker compose ps` | Check container health, status, and exposed ports |
| `docker compose logs -f backend` | Stream live logs from the FastAPI backend service |
| `docker compose logs -f celery_worker` | Stream live logs from Celery worker task execution |
| `docker compose exec backend bash` | Open an interactive terminal inside the backend container |
| `docker compose exec db psql -U rmart_user -d rmart_db` | Connect directly to the PostgreSQL database CLI |
| `docker compose down` | Stop and remove containers and network while preserving volume data |
| `docker compose down -v` | Stop containers and wipe all persistent database volumes |
