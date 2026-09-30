import React from "react";
import { Link } from "react-router-dom";
import { useStore } from "../context/StoreContext";

export default function Navbar({ onOpenMenu }) {
  const { theme, user, cartCount, setIsCartOpen } = useStore();
  const isDark = theme === "dark";

  const c = {
    bg: isDark ? "#0A0D15" : "#FFFFFF",
    border: isDark ? "#1E2738" : "#E2E8F0",
    text: isDark ? "#F8FAFC" : "#0F172A",
    subtext: isDark ? "#94A3B8" : "#64748B",
    accent: "#F59E0B",
  };

  return (
    <header style={{
      backgroundColor: c.bg,
      borderBottom: `1px solid ${c.border}`,
      height: "64px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 24px",
      position: "sticky",
      top: 0,
      zIndex: 40,
      fontFamily: "system-ui, sans-serif",
    }}>
      {/* Brand Logo */}
      <Link to="/catalog" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
        <div style={{
          width: "36px",
          height: "36px",
          backgroundColor: c.accent,
          color: "#000",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "900",
          fontSize: "20px",
          boxShadow: "0 0 15px rgba(245, 158, 11, 0.4)",
        }}>
          R
        </div>
        <span style={{ fontSize: "20px", fontWeight: "900", color: c.text, letterSpacing: "0.5px" }}>
          R-MART
        </span>
      </Link>

      {/* Global Search */}
      <div style={{ flex: 1, maxWidth: "520px", margin: "0 24px" }}>
        <input
          type="text"
          placeholder="Search products, inventory, orders..."
          style={{
            width: "100%",
            padding: "9px 18px",
            borderRadius: "20px",
            border: `1px solid ${c.border}`,
            backgroundColor: isDark ? "#121826" : "#F1F5F9",
            color: c.text,
            fontSize: "13px",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Right Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* HIDE CART COMPLETELY IF USER IS ADMIN */}
        {!user?.is_admin && (
          <button
            onClick={() => setIsCartOpen(true)}
            style={{
              backgroundColor: c.accent,
              color: "#000",
              border: "none",
              borderRadius: "8px",
              padding: "8px 14px",
              fontWeight: "900",
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>Cart</span>
            <span style={{
              backgroundColor: "#000",
              color: "#FFF",
              borderRadius: "10px",
              padding: "1px 6px",
              fontSize: "11px",
            }}>
              {cartCount}
            </span>
          </button>
        )}

        {/* Dynamic Name Hamburger Toggle */}
        <button
          onClick={onOpenMenu}
          style={{
            backgroundColor: isDark ? "#161F30" : "#F1F5F9",
            color: c.text,
            border: `1px solid ${c.border}`,
            borderRadius: "8px",
            padding: "8px 14px",
            fontWeight: "800",
            fontSize: "13px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "16px", lineHeight: "1" }}>☰</span>
          <span>{user?.name ? user.name.split(" ")[0] : "Account"}</span>
        </button>
      </div>
    </header>
  );
}
