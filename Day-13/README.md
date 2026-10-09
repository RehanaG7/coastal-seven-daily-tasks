# Day 13 — E-Commerce Frontend Part 1: Unified Catalog & Admin Studio

<p align="left">
  <img src="https://img.shields.io/badge/REACT-19+-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/VITE-8.3+-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/SEARCH_&_FILTER-REALTIME-10B981?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/ADMIN_STUDIO-3--WAY_IMAGE_UPLOAD-F59E0B?style=for-the-badge&logo=cloudinary&logoColor=white" />
  <img src="https://img.shields.io/badge/SUPPORT_CHAT-LIVE_TICKETS-007ACC?style=for-the-badge&logo=visualstudiocode&logoColor=white" />
</p>

---

## 🎯 Overview & Objectives

Day 13 delivers Phase 1 of the flagship **E-Commerce Frontend**. It integrates complex consumer search, filtering, sorting, slide-out drawer navigation, multi-mode authentication hubs, and an executive administrative studio with 3-way product media ingestion.

### 🌟 Key Deliverables:
1. **Unified Catalog Discovery (`ProductsPage.jsx`)**:
   - Real-time client & server search by title and description.
   - Dynamic multi-category filter chips (Electronics, Fashion, Grocery, Home, etc.).
   - Multi-mode sorting (Price: Low to High, Price: High to Low, Stock Availability, Name).
   - Dedicated product preview modal & `/catalog/:id` routing.

2. **Dual-Mode Auth Hub (`AuthPage.jsx`)**:
   - Unified tabbed view toggling between Login and Registration without page reloads.
   - Quick-fill test profile buttons for rapid evaluator testing (`Admin Profile`, `Customer Profile`).

3. **Slide-Out Drawer Architecture**:
   - `CartDrawer.jsx`: Slide-over cart preview with animated quantity modifications and instantaneous total calculation.
   - `ProfileDrawer.jsx` & `RightMenuDrawer.jsx`: Customer account overview, saved address memory, and order history shortcuts.

4. **Admin Product Studio (`ProductFormStudio.jsx`)**:
   - 3-way product image attachment:
     1. Drag-and-drop local file upload.
     2. Native OS file picker browsing.
     3. External image web URL input.
   - Inline stock adjustment badges and one-click product deletion with real-time UI synchronization.

5. **Customer Support Hub (`SupportPage.jsx`)**:
   - Live ticket creation and mock customer support chat interface for order inquiries.

---

## 📂 Directory Structure

```text
Day-13/
├── README.md               # Module documentation & execution guide
├── index.html              # HTML root template
├── package.json            # Dependencies
├── tailwind.config.js      # Styling configuration
├── vite.config.js          # Vite config
├── backend/                # Linked FastAPI backend
└── src/
    ├── components/         # CartDrawer, HeroBanner, Navbar, ProductFormStudio, drawers
    └── pages/              # ProductsPage, AdminDashboard, AuthPage, SupportPage, etc.
```

---

## 🚀 How to Run & Verify

### 1. Launch Dev Server
```bash
npm install
npm run dev
```

### 2. Verify Key Journeys
- **Catalog Filtering**: Search for products and click category chips to observe real-time filtering.
- **Admin Studio**: Login as Admin (`admin@rmart.com` / `ADMIN-2026`) and create a product using all 3 image attachment modes.
- **Cart Drawer**: Add items and toggle the slide-over drawer to test quantity modifiers.
