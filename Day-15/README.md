# Day 14 — State Management, React Query & 3D Motion Performance

<p align="left">
  <img src="https://img.shields.io/badge/REACT-19.2+-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/VITE-8.3+-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/ZUSTAND-5.0+-443E38?style=for-the-badge&logo=zustand&logoColor=white" />
  <img src="https://img.shields.io/badge/TANSTACK_QUERY-v5-FF4154?style=for-the-badge&logo=reactquery&logoColor=white" />
  <img src="https://img.shields.io/badge/TAILWIND_CSS-4.3+-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/FASTAPI_LINKED-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
</p>

---

## 🎯 Overview & Objectives

Day 14 scales the e-commerce architecture developed across **Days 10–13** into a production-grade, hardware-accelerated **3D Motion Graphical Application** optimized for maximum performance, atomic state subscriptions, and resilient cached queries.

### 🌟 Key Enhancements in Day 14:
1. **🎬 3D Motion Graphics & Cinematic Intro**:
   - **Canvas 3D Starfield Warp**: High-framerate space warp animation projecting particles with dynamic Z-depth acceleration.
   - **3D Isometric Holographic Cargo Unit**: 6-sided 3D cube rendered with CSS 3D transforms (`preserve-3d`, `translateZ(90px)`), glowing neon borders, and dynamic laser scanline.
   - **Web Audio API Sound Engine**: 100% offline, zero-dependency procedural audio synthesizing whooshes, sub-bass drop thumps, and harmonic launch chimes with a one-click sound toggle.
   - **Interactive 3D Mouse-Tilt Hero Banner & Product Cards**: Real-time cursor parallax tracking calculating 3D perspective pitch, yaw, and dynamic radial holographic sheen highlights.

2. **💾 Zustand Micro-State Stores (`useStore.js`)**:
   - Atomic selector subscriptions eliminating wasteful re-renders across the component tree.
   - Client-side optimistic cart additions, removals, and quantity modifications.
   - Native persistence via `persist` middleware storing cart and auth credentials safely in `localStorage`.

3. **⚡ TanStack React Query v5 (`useProducts.js`)**:
   - Server-state caching with 5-minute `staleTime` and background garbage collection.
   - `useInfiniteQuery` pagination with intersection observer infinite scrolling.
   - Optimistic stock mutations (`useOptimisticStockUpdate`) with cache snapshotting and automatic rollback on error.
   - React Query DevTools toggle for real-time inspection.

4. **🔗 Connected Full-Stack Pipeline (Day 10 → Day 14)**:
   - Direct integration with Day 10's **FastAPI backend** (`http://127.0.0.1:8000/api/v1`).
   - Live telemetry status banner (`BackendHealthBanner.jsx`) monitoring API health and latency.
   - Automatic zero-downtime fallback to local cached catalog if backend server is offline.

5. **📊 State Architecture Benchmark (`StateArchitectureModal.jsx`)**:
   - In-app interactive benchmark matrix comparing **Context API vs Zustand vs Redux Toolkit**.
   - Interactive live re-render simulator demonstrating why atomic selectors isolate component render cycles.

6. **🚀 React Performance Patterns**:
   - Component memoization with `React.memo` for product cards.
   - Data transformations and sorting stabilized with `useMemo`.
   - Event callbacks wrapped in `useCallback` to maintain reference stability.
   - Route-level code splitting using `React.lazy` and `Suspense` for sub-100ms chunk delivery.

---

## 🛠️ State Management Comparison Matrix

| Feature / Metric | React Context API | Zustand (Adopted in Day 14) 🏆 | Redux Toolkit (RTK) |
| :--- | :--- | :--- | :--- |
| **Bundle Size** | 0 kB (Built-in) | **~1.15 kB** | ~11.8 kB + dependencies |
| **Re-render Isolation** | ⚠️ Re-renders all consumers | **✔ Precise selector subscriptions** | ✔ Selector-based with `reselect` |
| **Boilerplate & Setup** | Low; requires Provider wrappers | **✔ Zero-boilerplate hook creation** | Moderate/High; actions & reducers |
| **Local Persistence** | Manual wrappers | **✔ Native `persist` middleware** | Requires `redux-persist` |
| **Async Side Effects** | Manual `useEffect` states | **✔ Native async/await in actions** | `createAsyncThunk` / RTK Query |
| **Best Scenario** | Low-frequency data (Theme, Locale) | **High-frequency client state (Cart, Auth, 3D UI)** | Complex enterprise apps with large teams |

---

## 📁 Project Structure

```
Day-14/
├── src/
│   ├── api/
│   │   ├── apiClient.js          # Axios client with JWT interceptors (Day 10 FastAPI link)
│   │   └── productService.js     # API service methods with offline fallbacks
│   ├── components/
│   │   ├── BackendHealthBanner.jsx # Live connection telemetry to Day 10 FastAPI
│   │   ├── CartDrawer.jsx        # Zustand-powered cart with instant optimistic adjustments
│   │   ├── CinematicIntro.jsx    # 3D motion cinematic intro with Web Audio API synthesizer
│   │   ├── HeroBanner.jsx        # 3D holographic hero banner with cursor parallax tracking
│   │   ├── Navbar.jsx            # Header with 3D intro replay and architecture modal triggers
│   │   ├── ProductCard.jsx       # 3D tilt product card with holographic sheen & React.memo
│   │   └── StateArchitectureModal.jsx # Context vs Zustand vs Redux interactive benchmark
│   ├── hooks/
│   │   └── useProducts.js        # TanStack Query v5 infinite query & optimistic mutations
│   ├── lib/
│   │   └── queryClient.js        # Global TanStack QueryClient with 5m staleTime
│   ├── pages/
│   │   ├── AdminDashboard.jsx    # Inventory manager with optimistic stock updates
│   │   ├── AuthPage.jsx          # Dual-mode authentication (Customer & Admin)
│   │   ├── ProductDetailPage.jsx # Dedicated 3D product view with specs
│   │   └── ProductsPage.jsx      # Infinite-scroll 3D catalog with search and filters
│   ├── store/
│   │   └── useStore.js           # Zustand stores for Auth, Cart, and UI state
│   ├── App.jsx                   # Lazy-routed app shell with DevTools & intro orchestration
│   ├── index.css                 # 3D perspective transforms & keyframe animations
│   └── main.jsx                  # Application entry point
├── package.json
└── vite.config.js
```

---

## 🚀 Running Day 14

### 1. (Optional) Start Day 10 FastAPI Backend:
```bash
cd Day-10
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### 2. Start Day 14 Frontend:
```bash
cd Day-14
npm install
npm run dev
```

The application will run at **`http://localhost:5173`** (or next available port). 
- If the backend is running, the green telemetry indicator displays **`FastAPI Backend (Day 10): ONLINE`**.
- If running standalone, the frontend seamlessly operates in **`Offline Fallback Mode`** using high-speed cached fixtures.
