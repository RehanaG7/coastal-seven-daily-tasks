# Day 10 — Full-Stack E-Commerce Backend & Celery Background Workers

<p align="left">
  <img src="https://img.shields.io/badge/FASTAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/SQLALCHEMY_2.0-D71F00?style=for-the-badge&logo=sqlalchemy&logoColor=white" />
  <img src="https://img.shields.io/badge/REDIS-CACHE_&_PUBSUB-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/CELERY-BACKGROUND_TASKS-37814A?style=for-the-badge&logo=celery&logoColor=white" />
  <img src="https://img.shields.io/badge/WEBSOCKETS-LIVE_TRACKING-010101?style=for-the-badge&logo=socketdotio&logoColor=white" />
  <img src="https://img.shields.io/badge/PYTEST-21_PASSED-brightgreen?style=for-the-badge&logo=pytest&logoColor=white" />
</p>

---

## 🎯 Overview & Objectives

Day 10 synthesizes the full backend engineering architecture into a high-concurrency **E-Commerce Backend Platform**. It introduces relational e-commerce data structures, Amazon-style quantity-stacking shopping carts, Redis cache-aside catalog retrieval, Celery order fulfillment pipelines, and real-time WebSocket order tracking.

### 🌟 Key Deliverables:
1. **Relational E-Commerce Schema (`models/`)**:
   - `User`: Roles (`admin`, `customer`) and password hashes.
   - `Product`: Title, description, price, stock, category, and image URL.
   - `Order` & `OrderItem`: Order statuses (`PENDING`, `CONFIRMED`, `SHIPPED`, `DELIVERED`), quantity tracking, and relational item snapshots.

2. **Cart Management with Quantity Stacking (`routers/cart.py`)**:
   - Incremental stacking: Repeated additions of the same product increment its quantity rather than creating duplicate lines.
   - Inventory guard: Validates requested quantities against live inventory stock, rejecting overages with `400 Bad Request`.

3. **High-Performance Redis Caching & Invalidation (`routers/products.py`)**:
   - `GET /api/v1/products` returns cached JSON responses with sub-5ms read speeds.
   - Cache auto-invalidates immediately upon any product creation or stock alteration.

4. **Celery Asynchronous Fulfillment & WebSockets (`main.py`, `tasks/celery_app.py`)**:
   - Celery worker simulates real-world parcel fulfillment: `PROCESSING` → `PACKING` → `SHIPPED` → `DELIVERED`.
   - Redis Pub/Sub broadcasts stage events to `/ws/orders/{order_id}` for live UI stepper updates.
   - Admin catalog broadcast feed at `/ws/admin/products`.

5. **21-Test Pytest Verification Matrix (`tests/test_ecommerce_suite.py`)**:
   - 100% passing automated test suite verifying registration, RBAC, caching, cart operations, stock deductions, order status transitions, and WebSocket connectivity.

---

## 📂 Directory Structure

```text
Day-10/
├── README.md               # Module documentation & execution guide
├── main.py                 # FastAPI application, static mounts, and WebSockets
├── pyproject.toml          # Pytest configuration
├── requirements.txt        # Backend dependencies
├── seed_db.py              # Catalog and user seeder
├── core/                   # Config, database engine, security, and Redis client
│   ├── config.py
│   ├── database.py
│   ├── redis.py
│   └── security.py
├── models/                 # Database entities (user.py, product.py, order.py)
├── routers/                # REST endpoints (auth.py, cart.py, orders.py, products.py)
├── schemas/                # Pydantic schemas
├── static/uploads/         # 300x300 product images
├── tasks/                  # Celery worker application
│   └── celery_app.py
└── tests/                  # 21-test automated Pytest suite
```

---

## 🚀 How to Run & Verify

### 1. Launch FastAPI Server
```bash
uvicorn main:app --reload --port 8000
```

### 2. Start Celery Worker (Optional for background tasks)
```bash
celery -A tasks.celery_app.celery_app worker --loglevel=info
```

### 3. Run Automated 21-Test Pytest Suite
```bash
pytest -v tests
```
*(All 21 tests pass with 100% green status)*
