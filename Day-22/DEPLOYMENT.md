# 🚀 Day 22 Capstone: Production Deployment & Zero-Cost Hosting Guide

This guide documents the live deployment architecture and setup process for the full-stack **R-Mart AI-Enhanced E-Commerce Application** hosted on **Render** with **100% Free-Tier Services** achieving **$0.00 infrastructure and API spend**.

---

## 🌐 Live Production Links

The live application is fully active and accessible at:

* 🌐 **Frontend Application:** [https://coastal-seven-daily-tasks.onrender.com](https://coastal-seven-daily-tasks.onrender.com)
* 🔌 **Backend REST API:** [https://e-commerce-backend-texz.onrender.com](https://e-commerce-backend-texz.onrender.com)
* 📖 **Interactive Swagger Docs:** [https://e-commerce-backend-texz.onrender.com/docs](https://e-commerce-backend-texz.onrender.com/docs)

---

## 🏗️ Production Architecture Overview

* **Frontend:** React 19 (Vite) + Tailwind CSS + Lucide Icons + TanStack Query
* **Backend:** FastAPI (Python 3.11/3.13) + Uvicorn ASGI Server
* **Database:** Serverless PostgreSQL (Neon / Supabase Free Tier)
* **Vector Store:** ChromaDB / In-Memory Dense Vector Store (`all-MiniLM-L6-v2`)
* **AI Providers:** Google Gemini (Free Tier: 15 RPM) + Groq Cloud (Free Tier: 30 RPM) + Offline Fallback
* **Cache & Rate Limiting:** Redis Cache-Aside & slowapi sliding window
* **Real-Time Layer:** Native Bidirectional WebSockets (`/ws/orders/{id}`)

---

## 🛠️ Step-by-Step Render Deployment Process

### 1. Backend Web Service (Render)
1. Sign in to [Render](https://render.com) and create a **New Web Service**.
2. Connect the `coastal-seven-daily-tasks` GitHub repository.
3. Configure settings:
   - **Name:** `e-commerce-backend-texz`
   - **Root Directory:** `Day-22/backend`
   - **Environment:** `Python`
   - **Region:** Ohio (US East) or Frankfurt (EU Central)
   - **Branch:** `main` (or active feature branch)
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Configure Server-Side Environment Variables:
   - `GEMINI_API_KEY`: *(Your Google Gemini free-tier API key)*
   - `GROQ_API_KEY`: *(Your Groq Cloud free-tier API key)*
   - `ENVIRONMENT`: `production`
   - `DATABASE_URL`: *(Neon serverless PostgreSQL connection string)*
   - `REDIS_URL`: *(Upstash Redis connection string)*
5. Click **Create Web Service**.

### 2. Frontend Static Site (Render)
1. In Render Dashboard, click **New +** $\rightarrow$ **Static Site**.
2. Connect the repository.
3. Configure settings:
   - **Name:** `coastal-seven-daily-tasks`
   - **Root Directory:** `Day-22`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
4. **Crucial SPA Routing Configuration**:
   - Go to **Redirects / Rewrites** in the service settings.
   - Add rule:
     - **Type:** `Rewrite`
     - **Source:** `/*`
     - **Destination:** `/index.html`
   *(This ensures that client-side React Router paths such as `/catalog/:id`, `/admin`, and `/cart` resolve properly on page reload without HTTP 404 errors).*

### 3. Environment Variables & URL Harmonization
1. Set the following build environment variables on the frontend Static Site:
   ```env
   VITE_API_URL=https://e-commerce-backend-texz.onrender.com/api/v1
   VITE_WS_URL=wss://e-commerce-backend-texz.onrender.com/ws
   ```
2. Replaced all hardcoded local development addresses (`http://127.0.0.1:8000`, `localhost:8000`) across all React components and hooks with dynamic endpoints (`env.API_URL`, `env.WS_URL`).
3. Rebuilt and redeployed the frontend to embed the production API targets.

---

## ⚡ Local Development (Docker Compose Alternative)

To run the entire distributed architecture locally:

```bash
docker compose up --build
```

Services will be active at:
* 🌐 **Frontend Web App:** `http://localhost:5173`
* 🔌 **Backend REST API:** `http://localhost:8000`
* 📖 **Swagger OpenAPI Docs:** `http://localhost:8000/docs`

---

## 🛡️ Cost Governance Audit Verification

To verify that the deployment is operating with **$0.00 API Spend**:
1. Log in to the Admin Portal at `/admin` (Passcode: `ADMIN-2026`).
2. Navigate to the **"Responsible AI & Cost Governance"** tab.
3. Verify live metrics:
   - **Total API Spend: $0.00**
   - **Cache Hit Efficiency: >75%**
   - **Per-User Rate Limits Active:**
     - Anonymous: **5 req/min**
     - Customer: **20 req/min**
     - Admin: **60 req/min**
