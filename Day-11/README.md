# Day 11 — React SPA Frontend Integration & Admin Dashboard

<p align="left">
  <img src="https://img.shields.io/badge/REACT-19+-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/VITE-FAST_HMR-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/REACT_ROUTER-v6-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white" />
  <img src="https://img.shields.io/badge/CONTEXT_API-AUTH_STATE-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/AXIOS-JWT_INTERCEPTORS-5A29E4?style=for-the-badge&logo=axios&logoColor=white" />
</p>

---

## 🎯 Overview & Objectives

Day 11 bridges backend REST services with an interactive client interface, establishing the **React SPA Frontend** powered by Vite. It introduces client-side routing, global authentication context, protected admin routes, an interactive cart drawer, and admin catalog management.

### 🌟 Key Deliverables:
1. **Application Architecture (`src/`)**:
   - Fast Hot Module Replacement (HMR) setup with Vite and React 19.
   - Declarative routing using **React Router DOM v6** (`/`, `/catalog`, `/cart`, `/orders`, `/login`, `/register`, `/admin`).

2. **Global Auth State & Security (`context/AuthContext.jsx`, `components/ProtectedRoute.jsx`)**:
   - JWT storage in `localStorage` with synchronized cross-tab authentication state.
   - Role-based route guard (`ProtectedRoute`) redirecting non-authenticated or unauthorized customers attempting to access `/admin`.

3. **HTTP Client & Interceptors (`api/axiosClient.js`)**:
   - Axios instance with base URL configuration targeting the FastAPI backend (`http://127.0.0.1:8000/api/v1`).
   - Request interceptors automatically injecting `Authorization: Bearer <token>`.
   - Response interceptors gracefully intercepting `401 Unauthorized` errors.

4. **E-Commerce Customer & Admin Views (`pages/`)**:
   - `ProductsPage.jsx` & `ProductDetailPage.jsx`: Responsive grid of products with price tags and stock indicators.
   - `CartPage.jsx`: Interactive shopping cart with item quantity modifiers, subtotal computation, and order placement.
   - `OrdersPage.jsx`: Historical order records with fulfillment status.
   - `AdminDashboard.jsx` & `CreateProductPage.jsx`: Admin inventory management for publishing new products.

---

## 📂 Directory Structure

```text
Day-11/
├── README.md               # Module documentation & setup guide
├── index.html              # Single page entry HTML
├── package.json            # Frontend dependency manifest
├── vite.config.js          # Vite build & proxy configuration
├── backend/                # Linked Day-10 FastAPI backend instance
└── src/
    ├── App.jsx             # Route definitions & layout wrappers
    ├── main.jsx            # React root DOM rendering
    ├── api/                # Axios client & service calls (authService, productService)
    ├── components/         # Navbar, ProductCard, ProtectedRoute
    ├── context/            # AuthContext provider
    └── pages/              # Cart, Orders, AdminDashboard, Products, Auth pages
```

---

## 🚀 How to Run & Verify

### 1. Start Linked Backend
```bash
cd backend
uvicorn main:app --reload --port 8000
```

### 2. Install Frontend Dependencies & Start Dev Server
```bash
npm install
npm run dev
```

### 3. Access in Browser
Navigate to `http://localhost:5173` to explore:
- Customer browsing, cart manipulation, and checkout.
- Admin login (`admin@rmart.com` / `ADMIN-2026`) and product creation.
