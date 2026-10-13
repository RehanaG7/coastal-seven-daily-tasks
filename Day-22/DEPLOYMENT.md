# 🚀 Day 22 Capstone: Deployment & Zero-Cost Hosting Guide

This guide details how to deploy the full-stack **R-Mart AI-Enhanced E-Commerce Application** online using **100% Free-Tier Services** targeting **$0.00 infrastructure and API spend**.

---

## 🏗️ 1. Architecture Stack
* **Frontend:** React (Vite) + Tailwind CSS + Lucide Icons
* **Backend:** FastAPI (Python 3.11) + Uvicorn
* **Database:** PostgreSQL (Neon / Supabase Free Tier) or SQLite (embedded)
* **Cache & Broker:** Redis (Upstash Free Tier or Redis Cloud)
* **Background Worker:** Celery Worker
* **Vector Store:** ChromaDB (Cosine similarity vector index)
* **AI Providers:** Google Gemini (Free Tier: 15 RPM) + Groq (Free Tier: 30 RPM) + Local RAG Engine

---

## ⚡ 2. One-Command Local Deployment (Docker Compose)

Run the full distributed architecture locally with Docker:

```bash
docker compose up --build
```

Services will be active at:
* 🌐 **Frontend Web App:** `http://localhost:5173`
* 🔌 **Backend REST API:** `http://localhost:8000`
* 📖 **Swagger OpenAPI Docs:** `http://localhost:8000/docs`
* 📦 **Redis Cache:** `localhost:6379`

---

## ☁️ 3. Free-Tier Cloud Deployment Guide

### Option A: Frontend on Vercel (100% Free)
1. Push this repository to GitHub.
2. Sign in to [Vercel](https://vercel.com).
3. Import the repository and set the **Root Directory** to `Day-22`.
4. Configure Build Settings:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Environment Variables:
   - `VITE_API_BASE_URL`: Your deployed backend URL (e.g., `https://rmart-api.onrender.com`)
   - `VITE_WS_URL`: Your WebSocket URL (e.g., `wss://rmart-api.onrender.com/ws`)
6. Click **Deploy**.

---

### Option B: Backend & Workers on Render (Free Tier)
1. Create a free account on [Render](https://render.com).
2. Create a **New Web Service**:
   - Connect your GitHub repository.
   - **Root Directory:** `Day-22`
   - **Environment:** Python
   - **Build Command:** `pip install -r backend/requirements.txt`
   - **Start Command:** `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
3. Add Environment Variables:
   - `GROQ_API_KEY`: *(Optional free-tier key)*
   - `GEMINI_API_KEY`: *(Optional free-tier key)*
   - `DATABASE_URL`: *(Neon / Supabase PostgreSQL URL or leave default SQLite)*
   - `REDIS_URL`: *(Upstash Redis free tier URL)*
4. Click **Create Web Service**.

---

## 🛡️ 4. Cost Governance Audit
To verify that your deployment is running with **$0.00 API Spend**:
1. Log in to the Admin Portal at `/admin` (Passcode: `ADMIN-2026`).
2. Navigate to the **"Responsible AI & Cost Governance"** tab.
3. Review:
   - **Total API Spend: $0.00**
   - **Redis Cache Hit Efficiency: >75%**
   - **Rate Limits Enforced: 5 (Anon) / 20 (Shopper) / 60 (Admin) req/min**
