import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore, useUIStore, useCartStore } from "../store/useStore";

export default function RightMenuDrawer({ isOpen, onClose }) {
  const user = useAuthStore((s) => s.user);
  const switchRole = useAuthStore((s) => s.switchRole);
  const logout = useAuthStore((s) => s.logout);

  const theme = useUIStore((s) => s.theme);
  const isRightMenuOpen = useUIStore((s) => s.isRightMenuOpen);
  const closeRightMenu = useUIStore((s) => s.closeRightMenu);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const openCart = useCartStore((s) => s.openCart);
  const cart = useCartStore((s) => s.cart || []);

  const navigate = useNavigate();
  const effectiveIsOpen = isOpen !== undefined ? isOpen : isRightMenuOpen;
  const handleClose = onClose || closeRightMenu;

  if (!effectiveIsOpen) return null;

  const isDark = theme === "dark";
  const isAdmin = user?.role === "admin";
  const cartCount = cart.reduce((acc, it) => acc + (it.quantity || 1), 0);

  const handleRoleToggle = () => {
    const nextRole = isAdmin ? "customer" : "admin";
    switchRole(nextRole);
    if (nextRole === "admin") {
      navigate("/admin");
    } else {
      navigate("/catalog");
    }
  };

  const handleNavigate = (path) => {
    handleClose();
    navigate(path);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Navigation Command Center"
      onClick={handleClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        backgroundColor: "rgba(0, 0, 0, 0.58)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        animation: "fadeInModal 0.25s ease-out",
      }}
    >
      {/* Full-Screen Floating Transparent Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "640px",
          backgroundColor: isDark ? "rgba(11, 15, 25, 0.78)" : "rgba(255, 255, 255, 0.82)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: `1px solid ${isDark ? "rgba(56, 189, 248, 0.25)" : "rgba(255, 255, 255, 0.6)"}`,
          borderRadius: "24px",
          padding: "32px",
          boxShadow: isDark
            ? "0 24px 60px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
            : "0 24px 60px rgba(15, 23, 42, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
          color: isDark ? "#FFFFFF" : "#0F172A",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          position: "relative",
        }}
      >
        {/* Header with Title and Close Button */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`, paddingBottom: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "28px" }}>{isAdmin ? "🛡️" : "⚡"}</span>
            <div>
              <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "900", letterSpacing: "-0.5px" }}>
                {isAdmin ? "Admin Command Console" : "R-Mart Quick Menu"}
              </h2>
              <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: isDark ? "#94A3B8" : "#64748B" }}>
                {isAdmin ? "Store Operations & Inventory Control" : "Personal shopping navigation"}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            aria-label="Close menu"
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "#CBD5E1"}`,
              backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
              color: isDark ? "#FFFFFF" : "#0F172A",
              fontSize: "18px",
              fontWeight: "900",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "transform 0.15s ease",
            }}
          >
            ✕
          </button>
        </div>

        {/* User Status / Mode Switch Card */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: isDark ? "rgba(30, 41, 59, 0.45)" : "rgba(241, 245, 249, 0.7)",
            padding: "16px 20px",
            borderRadius: "16px",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                backgroundColor: isAdmin ? "#F59E0B" : "#38BDF8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                boxShadow: isAdmin
                  ? "0 4px 12px rgba(245, 158, 11, 0.4)"
                  : "0 4px 12px rgba(56, 189, 248, 0.4)",
              }}
            >
              {isAdmin ? "🛡️" : "👤"}
            </div>
            <div>
              <div style={{ fontSize: "15px", fontWeight: "800" }}>
                {user?.name || (isAdmin ? "Boss Administrator" : "Guest Shopper")}
              </div>
              <div style={{ fontSize: "12px", color: isDark ? "#94A3B8" : "#64748B" }}>
                Active Mode: <strong style={{ color: isAdmin ? "#F59E0B" : "#38BDF8" }}>{isAdmin ? "Admin" : "Shopper"}</strong>
              </div>
            </div>
          </div>

          <button
            onClick={handleRoleToggle}
            style={{
              padding: "8px 16px",
              borderRadius: "12px",
              border: `1px solid ${isAdmin ? "#38BDF8" : "#F59E0B"}`,
              backgroundColor: isDark ? "rgba(0,0,0,0.3)" : "#FFFFFF",
              color: isAdmin ? "#38BDF8" : "#F59E0B",
              fontSize: "12px",
              fontWeight: "900",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {isAdmin ? "Switch to Shopper 👤" : "Switch to Admin 🛡️"}
          </button>
        </div>

        {/* Clean, Non-Duplicate Action Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          {/* Action 1: Browse Products */}
          <button
            onClick={() => handleNavigate("/catalog")}
            style={{
              padding: "16px",
              borderRadius: "16px",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
              backgroundColor: isDark ? "rgba(15, 23, 42, 0.6)" : "rgba(255, 255, 255, 0.8)",
              color: isDark ? "#FFFFFF" : "#0F172A",
              textAlign: "left",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div style={{ fontSize: "22px" }}>🛍️</div>
            <div style={{ fontSize: "14px", fontWeight: "800" }}>Product Catalog</div>
            <div style={{ fontSize: "11px", color: isDark ? "#94A3B8" : "#64748B" }}>
              Explore electronics, deals & search
            </div>
          </button>

          {/* Action 2: Orders & History */}
          <button
            onClick={() => handleNavigate("/orders")}
            style={{
              padding: "16px",
              borderRadius: "16px",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
              backgroundColor: isDark ? "rgba(15, 23, 42, 0.6)" : "rgba(255, 255, 255, 0.8)",
              color: isDark ? "#FFFFFF" : "#0F172A",
              textAlign: "left",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div style={{ fontSize: "22px" }}>📦</div>
            <div style={{ fontSize: "14px", fontWeight: "800" }}>My Orders & History</div>
            <div style={{ fontSize: "11px", color: isDark ? "#94A3B8" : "#64748B" }}>
              Track active shipments & past receipts
            </div>
          </button>

          {/* Action 3: Admin Console or Cart */}
          {isAdmin ? (
            <button
              onClick={() => handleNavigate("/admin")}
              style={{
                padding: "16px",
                borderRadius: "16px",
                border: `1px solid rgba(245, 158, 11, 0.4)`,
                backgroundColor: isDark ? "rgba(245, 158, 11, 0.1)" : "rgba(254, 243, 199, 0.7)",
                color: isDark ? "#F59E0B" : "#B45309",
                textAlign: "left",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <div style={{ fontSize: "22px" }}>⚙️</div>
              <div style={{ fontSize: "14px", fontWeight: "800" }}>Admin Dashboard</div>
              <div style={{ fontSize: "11px", opacity: 0.85 }}>
                Stock management & fast delete
              </div>
            </button>
          ) : (
            <button
              onClick={() => {
                handleClose();
                openCart();
              }}
              style={{
                padding: "16px",
                borderRadius: "16px",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
                backgroundColor: isDark ? "rgba(15, 23, 42, 0.6)" : "rgba(255, 255, 255, 0.8)",
                color: isDark ? "#FFFFFF" : "#0F172A",
                textAlign: "left",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <div style={{ fontSize: "22px" }}>🛒</div>
              <div style={{ fontSize: "14px", fontWeight: "800" }}>
                Shopping Cart ({cartCount})
              </div>
              <div style={{ fontSize: "11px", color: isDark ? "#94A3B8" : "#64748B" }}>
                Review bag items & checkout
              </div>
            </button>
          )}

          {/* Action 4: Theme Toggle */}
          <button
            onClick={toggleTheme}
            style={{
              padding: "16px",
              borderRadius: "16px",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
              backgroundColor: isDark ? "rgba(15, 23, 42, 0.6)" : "rgba(255, 255, 255, 0.8)",
              color: isDark ? "#FFFFFF" : "#0F172A",
              textAlign: "left",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div style={{ fontSize: "22px" }}>{isDark ? "☀️" : "🌙"}</div>
            <div style={{ fontSize: "14px", fontWeight: "800" }}>
              {isDark ? "Light Mode" : "Dark Mode"}
            </div>
            <div style={{ fontSize: "11px", color: isDark ? "#94A3B8" : "#64748B" }}>
              Switch interface appearance
            </div>
          </button>
        </div>

        {/* Footer with Logout / Close */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "12px", borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}` }}>
          <button
            onClick={() => {
              logout();
              handleClose();
              navigate("/catalog");
            }}
            style={{
              background: "none",
              border: "none",
              color: "#EF4444",
              fontSize: "13px",
              fontWeight: "800",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>🚪</span>
            <span>Sign Out</span>
          </button>

          <button
            onClick={handleClose}
            style={{
              backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)",
              color: isDark ? "#FFFFFF" : "#0F172A",
              border: "none",
              padding: "8px 20px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: "800",
              cursor: "pointer",
            }}
          >
            Back to Store
          </button>
        </div>
      </div>
    </div>
  );
}
