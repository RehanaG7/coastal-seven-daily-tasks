import React, { useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { StoreProvider } from "./context/StoreContext";
import Navbar from "./components/Navbar";
import CartDrawer from "./components/CartDrawer";
import RightMenuDrawer from "./components/RightMenuDrawer";
import ProductsPage from "./pages/ProductsPage";
import AdminDashboard from "./pages/AdminDashboard";
import AuthPage from "./pages/AuthPage";

function AppRoutes() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [initialMenuTab, setInitialMenuTab] = useState("profile");
  const isAuth = location.pathname === "/auth";

  const handleOpenOrders = () => {
    setInitialMenuTab("orders");
    setMenuOpen(true);
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      {!isAuth && (
        <Navbar
          onOpenMenu={() => {
            setInitialMenuTab("profile");
            setMenuOpen(true);
          }}
        />
      )}

      {/* Cart Drawer */}
      <CartDrawer onOpenOrders={handleOpenOrders} />

      {/* Master Collapsible Right Drawer with Live Tracking */}
      <RightMenuDrawer
        isOpen={menuOpen}
        initialTab={initialMenuTab}
        onClose={() => setMenuOpen(false)}
      />

      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/catalog" replace />} />
          <Route path="/catalog" element={<ProductsPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="*" element={<Navigate to="/catalog" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppRoutes />
    </StoreProvider>
  );
}
