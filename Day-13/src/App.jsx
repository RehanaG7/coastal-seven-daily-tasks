import React, { useState } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { StoreProvider } from "./context/StoreContext";
import Navbar from "./components/Navbar";
import CartDrawer from "./components/CartDrawer";
import RightMenuDrawer from "./components/RightMenuDrawer";
import CinematicIntro from "./components/CinematicIntro";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import AdminDashboard from "./pages/AdminDashboard";
import AuthPage from "./pages/AuthPage";

function AppRoutes() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [initialMenuTab, setInitialMenuTab] = useState("profile");

  // Play animation on app open
  const [showIntro, setShowIntro] = useState(true);

  const handleIntroComplete = () => {
    setShowIntro(false);
    // Route to authentication after launch animation
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/auth");
    }
  };

  const isAuth =
    location.pathname === "/auth" ||
    location.pathname === "/login" ||
    location.pathname === "/register";

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      {showIntro && <CinematicIntro onFinish={handleIntroComplete} />}

      {!isAuth && (
        <Navbar
          onOpenCart={() => setCartOpen(true)}
          onOpenMenu={() => {
            setInitialMenuTab("profile");
            setMenuOpen(true);
          }}
        />
      )}

      {/* Cart Modal for Shoppers */}
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Right Drawer (Account / Support / Admin Complaints) */}
      <RightMenuDrawer
        isOpen={menuOpen}
        initialTab={initialMenuTab}
        onClose={() => setMenuOpen(false)}
      />

      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/catalog" replace />} />
          <Route path="/catalog" element={<ProductsPage />} />
          <Route path="/products" element={<Navigate to="/catalog" replace />} />
          <Route path="/catalog/:id" element={<ProductDetailPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />
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
