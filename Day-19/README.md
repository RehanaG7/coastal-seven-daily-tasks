# Day 19 — Production Security Hardening, Response Compression, Performance & Load Testing

<p align="left">
  <img src="https://img.shields.io/badge/FASTAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/SLOWAPI-RATE_LIMITING-FF4B4B?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/OWASP-TOP_10_HARDENED-00599C?style=for-the-badge&logo=owasp&logoColor=white" />
  <img src="https://img.shields.io/badge/GZIP-RESPONSE_COMPRESSION-4B8BBE?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/LOCUST-50_CONCURRENT_USERS-37814A?style=for-the-badge&logo=locust&logoColor=white" />
  <img src="https://img.shields.io/badge/LIGHTHOUSE-90%2B_OPTIMIZED-F44B27?style=for-the-badge&logo=googlechrome&logoColor=white" />
  <img src="https://img.shields.io/badge/PYTEST-38_PASSED-brightgreen?style=for-the-badge&logo=pytest&logoColor=white" />
  <img src="https://img.shields.io/badge/VITEST-50_PASSED-brightgreen?style=for-the-badge&logo=vitest&logoColor=white" />
</p>

---

## 🎯 Overview & Objectives

Day 19 elevates the entire full-stack platform into an enterprise, production-hardened, high-performance web application. It combines API rate limiting, OWASP API Top 10 defensive hardening, GZip response compression, Rollup code splitting, Lighthouse 90+ optimizations, and Locust load testing simulating 50 concurrent shoppers with zero failures.

---

## 🛡️ 1. API Security & Rate Limiting (`slowapi` + OWASP Top 10)

### 🚦 Sliding-Window Rate Limiting (`core/rate_limiter.py`)
* Powered by `slowapi` with in-memory / Redis key storage (`key_func=get_remote_address`).
* Protects authentication endpoints (`/api/v1/auth/login`, `/api/v1/auth/register`) against brute-force credential stuffing and password spraying attacks.
* Custom HTTP 429 response handler returning RFC-compliant payloads with structured error messaging and standard `Retry-After: 60` headers:
  ```json
  {
    "detail": "Too many requests. Rate limit exceeded. Please wait 60 seconds before retrying.",
    "error": "RateLimitExceeded",
    "retry_after": 60
  }
  ```
* Verified via automated test `test_01_slowapi_rate_limiting_enforcement` triggering 429 on excessive requests.

### 🔒 OWASP API Top 10 Security Hardening (`core/security_headers.py`)
Custom Starlette/FastAPI middleware attaching strict defensive HTTP headers across all API responses:
* `X-Frame-Options: DENY` (Mitigates clickjacking attacks)
* `X-Content-Type-Options: nosniff` (Prevents MIME-sniffing exploits)
* `X-XSS-Protection: 1; mode=block` (Reflected XSS filter)
* `Strict-Transport-Security: max-age=31536000; includeSubDomains` (Enforces HTTPS transport)
* `Referrer-Policy: strict-origin-when-cross-origin` (Prevents referrer leakage)
* `Permissions-Policy: geolocation=(), camera=(), microphone=()` (Restricts browser sensor access)

### ⛔ Broken Function Level Authorization (BFLA) Guard
* Strict role-based access control (`require_admin` dependency) protecting administrative endpoints (`POST /api/v1/products`, `DELETE /api/v1/products/{id}`).
* Unauthenticated customers or regular users receive immediate `HTTP 403 Forbidden`.
* Verified via automated test `test_03_owasp_bfla_customer_forbidden_from_admin_ops`.

---

## 🗜️ 2. High-Throughput Response Compression (`GZipMiddleware`)

* Integrated Starlette's `GZipMiddleware(minimum_size=1000)` in `backend/main.py`.
* Automatically compresses payloads exceeding 1 KB whenever clients send `Accept-Encoding: gzip`.
* Dramatically reduces bandwidth consumption for large product catalog arrays and database dumps.
* Verified via automated test `test_04_gzip_compression_enabled` and live `curl` streaming.

---

## ⚡ 3. Frontend Performance & Bundle Optimization

### 📦 Rollup Code Splitting (`vite.config.js`)
Configured functional `manualChunks` in Vite / Rolldown to eliminate the monolithic JavaScript bundle:
* **`vendor-react`** (`react`, `react-dom`, `react-router-dom`)
* **`vendor-query`** (`@tanstack/react-query`, `zustand`, `axios`)
* **`vendor-ui`** (`lucide-react`, `clsx`, `tailwind-merge`)
* **`vendor-form`** (`react-hook-form`, `@hookform/resolvers`, `zod`)
* **Result**: Reduced initial JavaScript chunk from **401 kB down to 160 kB** (gzip: 39 kB) and production build finishes in **under 900ms**!

### 🖼️ Native Image Lazy Loading & Async Decoding
* Attached `loading="lazy"` and `decoding="async"` across `ProductCard.jsx`, `ProductCard.tsx`, and media components.
* Defers off-screen image decoding until the user scrolls into view, avoiding network congestion during initial page load.

---

## 🌟 4. Lighthouse 90+ Optimization

Enhanced `index.html` and core presentation layers for Google Lighthouse standards:
1. **Performance**: Modern semantic structure, preconnect hints (`fonts.googleapis.com`, `picsum.photos`), and lightweight bundle execution.
2. **Accessibility**: `dir="ltr"`, `lang="en"`, descriptive `alt` tags on all product media, and explicit `aria-label` attributes on interactive icon buttons.
3. **Best Practices**: Strict security headers, secure HTTPS links, zero runtime warnings, and `<noscript>` fallback.
4. **SEO**: Complete metadata tags including `<meta name="description">`, keywords, author tags, and OpenGraph social preview tags (`og:title`, `og:description`, `og:image`).

---

## 🤖 5. Load Testing with Locust (50 Concurrent Users)

### 🧪 Load Test Specification (`load_tests/locustfile.py`)
Simulates 50 concurrent realistic shopper journeys against the live FastAPI + PostgreSQL backend:
1. `GET /api/v1/products` (Catalog browsing with Redis Cache-Aside hit)
2. `GET /api/v1/products?q={term}` (Keyword search)
3. `GET /api/v1/products?category={cat}` (Category filtering)
4. `GET /api/v1/products/{id}` (Single product detail inspection)
5. `GET /api/v1/test-compression` (GZip compressed stream retrieval)
6. `GET /` (Health check ping)

### 📈 Verification Results (`load_tests/locust_report.html`)
```text
Simulated Users:       50 Concurrent Users
Ramp-up Rate:          25 Users / Second
Run Duration:          15 Seconds
Total Requests:        31 Requests
Failures:              0 (0.00% Failure Rate)
Health & Compression:  ~5-6 ms Latency
```
* Interactive visual performance report saved at `Day-19/load_tests/locust_report.html`.

---

## 📂 Directory Structure

```text
Day-19/
├── README.md               # Day 19 comprehensive documentation (This file)
├── index.html              # Lighthouse 90+ optimized HTML template
├── package.json            # Frontend dependencies & scripts
├── vite.config.js          # Vite configuration with Rollup manualChunks
├── load_tests/             # Locust load testing suite
│   ├── locustfile.py       # 50-user concurrent simulation suite
│   └── locust_report.html  # Interactive visual HTML report (0% fails)
├── backend/                # Full-Stack FastAPI backend
│   ├── main.py             # Server entry point with GZip & Security Middlewares
│   ├── core/
│   │   ├── rate_limiter.py # slowapi Limiter & custom 429 handler
│   │   └── security_headers.py # OWASP Top 10 defensive headers middleware
│   ├── models/             # User, Product, Order models
│   ├── routers/            # auth.py, products.py, cart.py, orders.py, tasks.py
│   └── tests/
│       ├── test_day19_security_suite.py # 4 rate-limiting & OWASP tests
│       ├── test_day18_suite.py          # 9 async task & search tests
│       └── test_ecommerce_suite.py      # 25 core e-commerce tests
└── src/                    # Optimized React frontend
    ├── components/         # ProductCard, CartDrawer, RightMenuDrawer
    └── pages/              # ProductsPage, AdminDashboard, CheckoutPage
```

---

## 🚀 How to Run & Verify

### 1. Launch FastAPI Backend
```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

### 2. Run Headless Locust Load Test (50 Users)
```bash
python -m locust -f load_tests/locustfile.py --headless -u 50 -r 25 --run-time 15s --host http://127.0.0.1:8000 --html load_tests/locust_report.html
```

### 3. Run Backend Pytest Suite (38 Tests)
```bash
cd backend
pytest -v tests
```
*(All 38 tests pass green)*

### 4. Run Frontend Vitest Suite (50 Tests)
```bash
npm run test
```
*(All 10 test files and 50 tests pass green)*

### 5. Build Frontend with Code Splitting
```bash
npm run build
```
*(Splits into lightweight vendor chunks in under 900ms)*
