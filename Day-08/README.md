# Day 08 — High-Performance Asynchronous FastAPI, Redis & Celery

<p align="left">
  <img src="https://img.shields.io/badge/FASTAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/ASYNCIO-GATHER-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/REDIS-CACHE--ASIDE-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/REDIS-SLIDING_WINDOW_RATE_LIMITER-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/CELERY-DISTRIBUTED_WORKER-37814A?style=for-the-badge&logo=celery&logoColor=white" />
</p>

---

## 🎯 Overview & Objectives

Day 08 optimizes application throughput, latency, and resiliency. It introduces asynchronous event loop concurrency, Redis cache-aside caching patterns, sliding-window rate limiters, and offloads compute-heavy workloads to Celery distributed worker tasks.

### 🌟 Key Deliverables:
1. **Async Concurrency & Parallel Execution (`routers/analytics.py`)**:
   - `asyncio.gather` running multiple database and telemetry fetch operations in parallel, dropping multi-endpoint aggregation latency by ~70%.

2. **Redis Cache-Aside Pattern (`services/cache_service.py`, `routers/products.py`)**:
   - Reads check the Redis key first; on cache miss, reads from the database, stores the serialized result with TTL, and returns immediately.
   - Cache invalidation triggers whenever products are updated, inserted, or deleted.

3. **Sliding-Window Rate Limiter (`core/rate_limiter.py`)**:
   - Redis `ZSET` (sorted sets) implementing a precise sliding-window rate limiter per client IP / API key.
   - Rejects abusive traffic bursts with `429 Too Many Requests` and headers (`Retry-After`, `X-RateLimit-Limit`).

4. **Celery Asynchronous Workers (`tasks/celery_app.py`, `routers/jobs.py`)**:
   - Background job execution offloading heavy export and report generation.
   - Async task submission returning `task_id` for client polling and state querying (`PENDING`, `SUCCESS`, `FAILURE`).

---

## 📂 Directory Structure

```text
Day-08/
├── README.md               # Module documentation & execution guide
├── main.py                 # FastAPI application instance
├── requirements.txt        # Python dependency manifest
├── core/                   # Configuration, rate limiters, and DB sessions
│   ├── config.py
│   ├── database.py
│   └── rate_limiter.py
├── routers/                # Endpoints (analytics.py, products.py, jobs.py)
├── services/               # Redis cache-aside caching service
└── tasks/                  # Celery worker application & job definitions
    └── celery_app.py
```

---

## 🚀 How to Run & Verify

### 1. Start Celery Worker
```bash
celery -A tasks.celery_app.celery worker --loglevel=info
```

### 2. Launch FastAPI Server
```bash
uvicorn main:app --reload --port 8000
```

### 3. Verify Endpoints
Visit `http://127.0.0.1:8000/docs`:
- Test cache latency: Call `GET /products` once (cache miss) and second time (sub-5ms cache hit).
- Trigger asynchronous worker job: `POST /jobs/generate-report`.
