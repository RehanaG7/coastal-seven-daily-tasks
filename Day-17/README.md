# Day 17 — Full-Stack Real-Time WebSockets, Live Tracking & Chat

<p align="left">
  <img src="https://img.shields.io/badge/FASTAPI-WEBSOCKETS-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/REDIS-PUBSUB_BROADCAST-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/REACT-USE_WEBSOCKET_HOOK-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/LIVE_ORDER-STEPPER_TRACKING-10B981?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/LIVE_SUPPORT-24%2F7_CHAT-007ACC?style=for-the-badge&logo=visualstudiocode&logoColor=white" />
</p>

---

## 🎯 Overview & Objectives

Day 17 implements bidirectional real-time capabilities across the entire full-stack architecture. It connects the React frontend to asynchronous FastAPI WebSocket endpoints powered by Redis Pub/Sub, delivering live parcel fulfillment tracking, instant customer support chat, and broadcast admin alerts.

### 🌟 Key Deliverables:
1. **Centralized WebSocket Connection Manager (`backend/core/websocket_manager.py`)**:
   - Manages active client sockets by channel, user ID, and role.
   - Graceful reconnect handling and connection teardown.

2. **Live Order Tracking Stepper (`OrderTrackerModal.jsx`, `/ws/orders/{order_id}`)**:
   - Real-time animated delivery stepper tracking stages: `PROCESSING` → `PACKING` → `SHIPPED` → `DELIVERED`.
   - Connected directly to background Celery task stages via Redis Pub/Sub events.

3. **Customer Support Live Chat (`LiveChatModal.jsx`, `routers/realtime.py`)**:
   - 24/7 bidirectional support messaging between customers and admin agents.
   - Message persistence in SQLite/PostgreSQL with instant WebSocket delivery.

4. **Administrative Broadcast Alerts (`NotificationsPanel.jsx`)**:
   - Notification drawer surfacing storewide announcements, flash sales, and order status updates.

5. **Custom React WebSocket Hook (`src/hooks/useWebSocket.js`)**:
   - Reusable hook managing socket lifecycle, reconnection backoff, JSON payload serialization, and connection state indicators.

---

## 📂 Directory Structure

```text
Day-17/
├── README.md               # Module documentation & setup guide
├── index.html              # HTML template
├── package.json            # Frontend dependencies
├── playwright.config.js    # Playwright configuration
├── tsconfig.json           # TypeScript configuration
├── vite.config.js          # Vite configuration
├── backend/                # Full-Stack FastAPI backend
│   ├── main.py             # WebSocket endpoints & routers
│   ├── core/               # Connection manager & Redis
│   ├── models/             # ChatMessage, Notification, Order models
│   ├── routers/            # realtime.py, orders.py, products.py
│   └── tasks/              # Celery order fulfillment task
├── e2e/                    # Playwright real-time integration tests
└── src/
    ├── components/         # LiveChatModal, NotificationsPanel, OrderTrackerModal
    ├── hooks/              # useWebSocket.js custom hook
    └── test/               # Real-time Vitest component tests
```

---

## 🚀 How to Run & Verify

### 1. Launch FastAPI Realtime Backend
```bash
cd backend
uvicorn main:app --reload --port 8000
```

### 2. Launch React Frontend
```bash
npm install
npm run dev
```

### 3. Verify Live Real-Time Features
- Open `http://localhost:5173`.
- Open the **Live Order Tracker** on any placed order to observe real-time stage progression.
- Open the **24/7 Support Chat** to send and receive real-time messages.
- Open the **Notifications Panel** to inspect broadcast notifications.
