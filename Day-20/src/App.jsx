import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

import Navbar from "./components/Navbar";
import CartDrawer from "./components/CartDrawer";
import RightMenuDrawer from "./components/RightMenuDrawer";
import OrderTrackerModal from "./components/OrderTrackerModal";
import NotificationsPanel from "./components/NotificationsPanel";
import SneakPeekAiAssistant from "./components/SneakPeekAiAssistant";
import CinematicIntro from "./components/CinematicIntro";
import StateArchitectureModal from "./components/StateArchitectureModal";
import { useAuthStore, useUIStore } from "./store/useStore";

// Code Splitting with React.lazy
const ProductsPage = lazy(() => import("./pages/ProductsPage"));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const OrdersPage = lazy(() => import("./pages/OrdersPage"));

function PageLoader() {
  return (
    <div
      style={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        color: "#38BDF8",
        fontWeight: "900",
        fontSize: "14px",
      }}
    >
      <div style={{ fontSize: "28px" }}>?</div>
      <div>Loading R-Mart...</div>
    </div>
  );
}

function AppContent() {
  const location = useLocation();

  const user = useAuthStore((s) => s.user);
  const theme = useUIStore((s) => s.theme);
  const isIntroActive = useUIStore((s) => s.isIntroActive);
  const dismissIntro = useUIStore((s) => s.dismissIntro);
  const trackingOrder = useUIStore((s) => s.trackingOrder);
  const closeTracker = useUIStore((s) => s.closeTracker);

  // Day 17 Real-Time Modals
  const isNotificationsOpen = useUIStore((s) => s.isNotificationsOpen);
  const closeNotifications = useUIStore((s) => s.closeNotifications);
  const isLiveChatOpen = useUIStore((s) => s.isLiveChatOpen);
  const closeLiveChat = useUIStore((s) => s.closeLiveChat);
  const activeChatRoom = useUIStore((s) => s.activeChatRoom);

  const isAuth =
    location.pathname === "/auth" ||
    location.pathname === "/login" ||
    location.pathname === "/register";

  return (
    <div
      style={{
        minHeight: "100vh",
        position: "relative",
        backgroundColor: theme === "dark" ? "#000000" : "#F8FAFC",
        color: theme === "dark" ? "#FFFFFF" : "#0F172A",
        transition: "background-color 0.25s ease, color 0.25s ease",
      }}
    >
      {/* 1. Full-Screen Cinematic Animated Intro */}
      {isIntroActive && <CinematicIntro onFinish={dismissIntro} />}

      {/* 2. Global Modals & Drawers */}
      <StateArchitectureModal />
      <CartDrawer />
      <RightMenuDrawer />
      <NotificationsPanel
        isOpen={isNotificationsOpen}
        onClose={closeNotifications}
      />
      <SneakPeekAiAssistant />
      <OrderTrackerModal
        isOpen={!!trackingOrder}
        order={trackingOrder}
        onClose={closeTracker}
        theme={theme}
      />

      {/* 3. Header Navbar */}
      {!isAuth && <Navbar />}

      {/* 4. Routes */}
      <main>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route
              path="/"
              element={
                !user ? (
                  <Navigate to="/auth" replace />
                ) : (
                  <Navigate to="/catalog" replace />
                )
              }
            />

            <Route path="/auth" element={<AuthPage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage />} />

            <Route path="/catalog" element={<ProductsPage />} />
            <Route path="/products" element={<Navigate to="/catalog" replace />} />

            <Route path="/catalog/:id" element={<ProductDetailPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />

            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/orders" element={<OrdersPage />} />

            <Route path="/admin" element={<AdminDashboard />} />

            <Route path="*" element={<Navigate to="/catalog" replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

