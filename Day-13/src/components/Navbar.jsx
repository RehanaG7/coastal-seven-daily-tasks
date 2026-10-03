import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useStore } from "../context/StoreContext";

export default function Navbar({ onOpenMenu, onOpenCart }) {
  const { cart, theme, toggleTheme, user } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const isDark = theme === "dark";

  const isAdmin = user?.role === "admin" || localStorage.getItem("user_role") === "admin" || location.pathname.startsWith("/admin");
  const totalItemsCount = (cart || []).reduce((acc, item) => acc + (item.quantity || 1), 0);

  const c = {
    bg: isDark ? "#0A0E17" : "#FFFFFF",
    border: isDark ? "#1E2738" : "#E2E8F0",
    text: isDark ? "#FFFFFF" : "#0F172A",
  };

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 9999,
        backgroundColor: c.bg,
        borderBottom: `1px solid ${c.border}`,
        padding: "12px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        onClick={() => navigate(isAdmin ? "/admin" : "/catalog")}
        style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
      >
        <span style={{ fontSize: "20px" }}>⚡</span>
        <span style={{ fontSize: "18px", fontWeight: "900", color: c.text }}>
          R-MART <span style={{ color: "#3B82F6", fontSize: "11px", letterSpacing: "1px" }}>{isAdmin ? "ADMIN PORTAL" : "STORE"}</span>
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button
          type="button"
          onClick={toggleTheme}
          style={{
            backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
            border: `1px solid ${c.border}`,
            color: c.text,
            width: "38px",
            height: "38px",
            borderRadius: "10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "16px",
          }}
          title="Toggle Theme"
        >
          {isDark ? "☀️" : "🌙"}
        </button>

        {/* CART IS ONLY VISIBLE FOR SHOPPERS, NEVER FOR ADMIN */}
        {!isAdmin && (
          <button
            type="button"
            onClick={onOpenCart}
            style={{
              backgroundColor: "#F59E0B",
              color: "#000000",
              border: "none",
              padding: "9px 18px",
              borderRadius: "10px",
              fontWeight: "900",
              fontSize: "13px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>🛒</span>
            <span>Cart ({totalItemsCount})</span>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenMenu}
          style={{
            backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
            border: `1px solid ${c.border}`,
            color: c.text,
            padding: "8px 14px",
            borderRadius: "10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            fontWeight: "800",
          }}
        >
          <span>☰</span>
          <span>{user?.name || (isAdmin ? "Admin" : "Account")}</span>
        </button>
      </div>
    </header>
  );
}
