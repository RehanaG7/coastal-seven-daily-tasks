# 🚀 Day 22 – AI Focus Project (Capstone): Full-Stack RAG, Semantic Discovery, Real-Time WebSockets & Zero-Cost Governance

Welcome to the **Day 22 Capstone Milestone** of the Coastal Seven Engineering Roadmap! This project represents the comprehensive capstone integration of our entire 22-day full-stack curriculum — uniting modern frontend engineering, distributed asynchronous microservices, real-time WebSockets, and production-grade generative AI into a portfolio-ready, enterprise-grade e-commerce application designed to run with **zero infrastructure and API cost** ($0.00 spend).

---

## 🌐 Live Production Deployments

The full-stack application is publicly deployed and accessible on Render:

| Service | Public Production URL | Purpose |
|---|---|---|
| 🌐 **Frontend Application** | [https://coastal-seven-daily-tasks.onrender.com](https://coastal-seven-daily-tasks.onrender.com) | Production React 19 SPA with 3D UI, RAG Chat, and live catalog |
| 🔌 **Backend API Service** | [https://e-commerce-backend-texz.onrender.com](https://e-commerce-backend-texz.onrender.com) | FastAPI asynchronous REST & WebSocket backend |
| 📖 **Interactive Swagger Docs**| [https://e-commerce-backend-texz.onrender.com/docs](https://e-commerce-backend-texz.onrender.com/docs) | OpenAPI 3.0 specification & live interactive API explorer |

---

## 🚀 Deployment Process (Render Free-Tier Architecture)

The full-stack system is deployed using free-tier cloud infrastructure with complete secret isolation:

### 1. Backend Web Service (Render)
* **Repository Connection**: Connected to `coastal-seven-daily-tasks` GitHub repository.
* **Root Directory**: `Day-22/backend`
* **Build Command**: `pip install -r requirements.txt`
* **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
* **Server-Side Environment Variables**:
  * `GEMINI_API_KEY`: Google Gemini API key (Free Tier: 15 RPM)
  * `GROQ_API_KEY`: Groq Cloud API key (Free Tier: 30 RPM)
  * `ENVIRONMENT`: `production`
  * `DATABASE_URL`: Serverless PostgreSQL connection string
  * `REDIS_URL`: Upstash Redis cache-aside connection string
  *(All sensitive API keys remain securely on the server and are never exposed to browser bundles)*

### 2. Frontend Static Site (Render)
* **Root Directory**: `Day-22`
* **Build Command**: `npm install && npm run build`
* **Publish Directory**: `dist`
* **SPA Rewrite Rule**: Added a redirect rewrite under *Redirects / Rewrites*:
  * **Source**: `/*`
  * **Destination**: `/index.html`
  * **Action**: `Rewrite`
  *(Prevents 404 Not Found errors on deep route refreshes like `/catalog/:id` or `/admin`)*

### 3. Environment Variables & URL Harmonization
* Configured production build environment variables in Vite:
  * `VITE_API_URL`: `https://e-commerce-backend-texz.onrender.com/api/v1`
  * `VITE_WS_URL`: `wss://e-commerce-backend-texz.onrender.com/ws`
* Harmonized endpoints dynamically via `config/env.js` and `useProducts.js`, eliminating hardcoded local development addresses (`localhost:8000`, `127.0.0.1:8000`).

---

## 📋 Day 22 Capstone Curriculum & Topic Implementation Matrix

| Topic | Learning & Implementation | Expected Outcome | Status |
|---|---|---|:---:|
| **RAG-Powered Product Assistant** | Integrated a retrieval-augmented generation (RAG) pipeline with SSE streaming responses (`/api/v1/ai/chat/stream`) to answer queries grounded in catalog data | Built an interactive AI product assistant (Sparkyyy Robo) providing source-grounded responses | ✅ Complete |
| **Semantic Search Integration** | Integrated embedding-based semantic vector search (`/api/v1/ai/semantic-search`) using ChromaDB dense embeddings with cosine similarity distance ranking | Intelligent product discovery based on user intent, conceptual similarity, and holographic match badges | ✅ Complete |
| **AI-Generated Product Descriptions** | Implemented automatic product description generation using LLM APIs (Gemini 3.5 Flash Lite + Groq Llama 3.3 cascade) with 4 distinct tones | Reduced manual copywriting time and improved product catalog quality with 1-click form auto-fill | ✅ Complete |
| **Real-Time Order Tracking** | Integrated WebSockets (`/ws/orders/{order_id}`) to deliver live status updates (`PLACED` → `PROCESSING` → `SHIPPED` → `DELIVERED`) | Real-time order tracking and customer status alerts without requiring page refreshes | ✅ Complete |
| **Celery Background Processing** | Celery workers for asynchronous AI tasks (catalog vector re-indexing, bulk description generation, CSV imports) with status polling | Offloaded CPU-heavy operations to background workers and avoided blocking HTTP requests | ✅ Complete |
| **Caching & Performance Optimization**| Implemented Redis caching (`rmart:ai:cache:*`) for AI responses with deterministic SHA-256 key hashing and TTL policies | Sub-3ms response latency (`X-AI-Cache: HIT`), eliminating redundant API calls | ✅ Complete |
| **Comprehensive Testing** | Tested AI workflows, semantic vector search, streaming responses, background workers, WebSocket lifecycle, and fallback degradation | Verified system reliability across 24 backend Pytest tests and 79 frontend Vitest tests | ✅ Complete |
| **Deployment** | Deployed full-stack app on Render with backend web service, frontend static site, PostgreSQL, Redis, and environment variable isolation | Accessible online for live demonstrations and portfolio evaluations | ✅ Complete |
| **Responsible AI & Cost Governance** | Implemented token tracking, usage monitoring, sliding-window rate limits, and multi-tier free-tier provider cascade | Controlled AI usage and guaranteed a verified **$0.00 API spend** within free quotas | ✅ Complete |
| **Final Integration** | Combined RAG streaming, semantic search, AI copywriter, WebSockets, Celery, Redis caching, and automated testing into one unified platform | Delivered a portfolio-ready full-stack AI e-commerce application | ✅ Complete |

---

## 🏛️ System Architecture

```
                                  +---------------------------------------+
                                  |         REACT 19 SPA (Render)         |
                                  |  https://coastal-seven-daily-tasks... |
                                  |   • 3D Tilt Cards & Holographic Sheen |
                                  |   • Sparkyyy AI RAG Chat (Streaming)  |
                                  |   • Semantic Intent Search Toggle     |
                                  |   • Live WebSocket Order Stepper      |
                                  |   • Cost Governance Dashboard ($0.00) |
                                  +-------------------+-------------------+
                                                      |
                                                      | HTTPS / WSS
                                                      v
                                  +---------------------------------------+
                                  |       FASTAPI BACKEND (Render)        |
                                  |  https://e-commerce-backend-texz...   |
                                  |                                       |
                                  |  [1. Rate Limiter (slowapi)]          |
                                  |      Anon: 5/m | User: 20/m | Admin:60 |
                                  |  [2. Content Moderation Guardrail]    |
                                  |      Filters injections & toxicity    |
                                  |  [3. Redis AI Cache (<3ms latency)]   |
                                  |      SHA-256 Cache-Aside Layer        |
                                  +---------+-------------------+---------+
                                            |                   |
                     +----------------------+                   +---------------------+
                     |                                                                |
                     v                                                                v
+------------------------------------------+                      +------------------------------------------+
|          AI & RAG RETRIEVAL              |                      |      DISTRIBUTED WORKERS & STORAGE       |
| • ChromaDB Dense Vectors (all-MiniLM-L6) |                      | • Neon / Supabase Serverless PostgreSQL  |
| • Google Gemini 3.5 Flash Lite           |                      | • Upstash Redis (Cache, Broker & Pub/Sub)|
| • Groq Cloud (Llama 3.3 70B Fast LLM)    |                      | • Celery Background Worker Pool          |
| • Local Deterministic Fallback Engine    |                      | • ReportLab PDF Invoice Engine           |
+------------------------------------------+                      +------------------------------------------+
```

---

## 🛡️ Responsible AI & $0 Cost Governance

R-Mart implements an enterprise-grade AI governance model targeting **$0.00 Total API Spend**:
* **Provider Cascade Strategy**: Requests route through **Groq (Free Tier: 30 RPM)** $\rightarrow$ **Google Gemini (Free Tier: 15 RPM)** $\rightarrow$ **Deterministic Offline Fallback**.
* **Sliding-Window Rate Limiting**: Built with Redis sliding-window counters:
  * Anonymous Visitors: **5 requests / min**
  * Registered Customers: **20 requests / min**
  * Store Administrators: **60 requests / min**
* **Cache Efficiency**: Every query is canonicalized and hashed (`SHA-256`). Repeated queries return in **<3ms** with an `X-AI-Cache: HIT` header, achieving >75% token reduction.
* **Live Admin Telemetry**: Real-time cost analytics and cache hit/miss statistics accessible at `/admin` under **"Responsible AI & Cost Governance"**.

---

## 🧪 Automated Test Verification

The application is protected by a 100% automated test suite across backend and frontend:

### Backend Test Suite (Pytest)
```bash
pytest -v tests/test_day22_ai_tasks.py tests/test_day22_capstone_integration.py tests/test_ai_governance.py tests/test_day21_ai_suite.py
```
> **Result**: `24 passed, 10 warnings in 22.85s` (100% passing)

### Frontend Test Suite (Vitest)
```bash
npm test -- --run
```
> **Result**: `Test Files: 13 passed (13) | Tests: 79 passed (79) | Duration: 6.87s`

---

## 💻 Local Development Setup

To run the full stack locally:

### 1. Backend Service
```powershell
cd Day-22/backend
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8000
```

### 2. Frontend Application
```powershell
cd Day-22
npm install
npm run dev
```

Visit `http://localhost:5173` to explore the app locally.
