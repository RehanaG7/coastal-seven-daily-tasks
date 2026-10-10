import React from "react";
import { Link } from "react-router-dom";
import { useCartStore, useAuthStore, useUIStore, useNotificationStore } from "../store/useStore";

export default function Navbar() {
  const cart = useCartStore((state) => state.cart);
  const openCart = useCartStore((state) => state.openCart);

  const user = useAuthStore((state) => state.user);
  const switchRole = useAuthStore((state) => state.switchRole);
  const newsBannerText = useUIStore((state) => state.newsBannerText);
  const openRightMenuView = useUIStore((state) => state.openRightMenuView);
  const openRightMenu = useUIStore((state) => state.openRightMenu);
  const openNotifications = useUIStore((state) => state.openNotifications);
  const openLiveChat = useUIStore((state) => state.openLiveChat);
  const theme = useUIStore((state) => state.theme);
  const toggleTheme = useUIStore((state) => state.toggleTheme);
  const isDark = theme === "dark";

  const isAdmin = user?.role === "admin";
  const cartCount = (cart || []).reduce((acc, item) => acc + (item.quantity || 1), 0);

  // Reactive real-time notification count from Zustand store
  const notifications = useNotificationStore((state) => state.notifications || []);
  const notifCount = notifications.filter((n) => n.is_read === 0).length;

  const handleOpenNotifications = () => {
    openNotifications();
  };

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 24px",
        backgroundColor: isDark ? "#000000" : "#FFFFFF",
        borderBottom: `1px solid ${isDark ? "#1E293B" : "#E2E8F0"}`,
        position: "sticky",
        top: 0,
        zIndex: 50,
        backdropFilter: "blur(14px)",
        boxShadow: isDark
          ? "0 4px 24px rgba(0, 0, 0, 0.8)"
          : "0 4px 20px rgba(0, 0, 0, 0.08)",
        gap: "18px",
      }}
    >
      {/* 1. Brand Logo: R-Mart + Theme Toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
        <Link
          to="/catalog"
          style={{
            textDecoration: "none",
            color: isDark ? "#FFFFFF" : "#0F172A",
            fontSize: "20px",
            fontWeight: "900",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            letterSpacing: "-0.5px",
          }}
        >
          <span
            style={{
              color: "#F59E0B",
              fontSize: "22px",
              filter: "drop-shadow(0 0 8px rgba(245, 158, 11, 0.6))",
            }}
          >
            ⚡
          </span>
          <span style={{ letterSpacing: "1px" }}>
            <strong style={{ color: "#F59E0B" }}>R</strong>-MART
          </span>
        </Link>

        {/* Theme Toggle Button (Light/Dark) */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
          style={{
            backgroundColor: isDark ? "rgba(30, 41, 59, 0.8)" : "rgba(241, 245, 249, 0.9)",
            border: `1px solid ${isDark ? "rgba(56, 189, 248, 0.3)" : "#CBD5E1"}`,
            color: isDark ? "#F59E0B" : "#0F172A",
            padding: "5px 11px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: "800",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.2s ease",
          }}
        >
          <span>{isDark ? "🌙" : "☀️"}</span>
          <span style={{ fontSize: "11px", fontWeight: "900" }}>{isDark ? "Dark" : "Light"}</span>
        </button>
      </div>

      {/* 2. Admin News Banner */}
      <div
        style={{
          flex: 1,
          overflow: "hidden",
          position: "relative",
          backgroundColor: isDark ? "#0B0F19" : "#F1F5F9",
          borderRadius: "999px",
          border: `1px solid ${isDark ? "#1E293B" : "#CBD5E1"}`,
          padding: "6px 14px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          maxWidth: "680px",
          boxShadow: isDark ? "inset 0 1px 4px rgba(0,0,0,0.6)" : "0 1px 3px rgba(0,0,0,0.05)",
        }}
        title="Admin announcement banner"
      >
        <div
          style={{
            backgroundColor: "#F59E0B",
            color: "#000000",
            fontSize: "10px",
            fontWeight: "900",
            padding: "3px 8px",
            borderRadius: "999px",
            letterSpacing: "0.8px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            flexShrink: 0,
            boxShadow: "0 0 8px rgba(245, 158, 11, 0.4)",
          }}
        >
          <span>📢</span>
          <span>NEWS</span>
        </div>

        <div
          style={{
            flex: 1,
            overflow: "hidden",
            whiteSpace: "nowrap",
            position: "relative",
          }}
        >
          <div
            className="scrolling-news-track"
            style={{
              display: "inline-block",
              color: isDark ? "#F1F5F9" : "#0F172A",
              fontSize: "13px",
              fontWeight: "600",
              letterSpacing: "0.3px",
            }}
          >
            {newsBannerText}
          </div>
        </div>
      </div>

      {/* 3. Right Controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flexShrink: 0,
        }}
      >
        {/* 1. Clear & Modern User <-> Admin Mode Segmented Switcher */}
        <div
          data-testid="role-switcher"
          style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: isDark ? "#0B0F19" : "#F1F5F9",
            border: `1px solid ${isDark ? "#1E293B" : "#CBD5E1"}`,
            borderRadius: "999px",
            padding: "3px",
            gap: "3px",
            boxShadow: isDark
              ? "inset 0 1px 3px rgba(0, 0, 0, 0.7)"
              : "inset 0 1px 2px rgba(0, 0, 0, 0.06)",
          }}
          title="Switch instantly between Shopper (User) and Store Admin Console"
        >
          <button
            onClick={() => switchRole("customer")}
            data-testid="role-toggle-customer"
            title="Switch to Shopper (Customer) Mode"
            style={{
              padding: "5px 12px",
              borderRadius: "999px",
              border: "none",
              fontSize: "12px",
              fontWeight: "800",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              backgroundColor: !isAdmin ? "#38BDF8" : "transparent",
              color: !isAdmin ? "#030712" : isDark ? "#94A3B8" : "#64748B",
              boxShadow: !isAdmin
                ? "0 2px 10px rgba(56, 189, 248, 0.45)"
                : "none",
            }}
          >
            <span>👤</span>
            <span>Customer</span>
          </button>

          <button
            onClick={() => switchRole("admin")}
            data-testid="role-toggle-admin"
            title="Switch to Admin Console Mode"
            style={{
              padding: "5px 12px",
              borderRadius: "999px",
              border: "none",
              fontSize: "12px",
              fontWeight: "800",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              backgroundColor: isAdmin ? "#F59E0B" : "transparent",
              color: isAdmin ? "#030712" : isDark ? "#94A3B8" : "#64748B",
              boxShadow: isAdmin
                ? "0 2px 10px rgba(245, 158, 11, 0.45)"
                : "none",
            }}
          >
            <span>🛡️</span>
            <span>Admin</span>
          </button>
        </div>

        {/* Notifications (Bell icon with top-right numbering badge) */}
        <button
          onClick={handleOpenNotifications}
          style={{
            position: "relative",
            width: "40px",
            height: "40px",
            backgroundColor: isDark ? "#0B0F19" : "#FFFFFF",
            border: isDark
              ? "1px solid rgba(239, 68, 68, 0.4)"
              : "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: isDark ? "#FFFFFF" : "#0F172A",
            fontSize: "18px",
            padding: 0,
            transition: "transform 0.15s ease",
          }}
          title={isAdmin ? "Customer Queries & Alerts" : "Notifications"}
        >
          <span>🔔</span>
          <span
            data-testid="notification-badge-count"
            style={{
              position: "absolute",
              top: "-5px",
              right: "-5px",
              backgroundColor: "#EF4444",
              color: "#FFFFFF",
              borderRadius: "999px",
              minWidth: "18px",
              height: "18px",
              padding: "0 4px",
              fontSize: "10px",
              fontWeight: "900",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 6px rgba(239, 68, 68, 0.5)",
              border: isDark ? "2px solid #000000" : "2px solid #FFFFFF",
              opacity: notifCount > 0 ? 1 : 0,
              pointerEvents: "none",
              transform: notifCount > 0 ? "scale(1)" : "scale(0)",
              transition: "opacity 0.2s ease, transform 0.2s ease",
            }}
          >
            {notifCount}
          </span>
        </button>

        {/* Cart Button (Icon only with top badge and hover title 'View Cart') */}
        {!isAdmin && (
          <button
            onClick={openCart}
            title="View Cart"
            style={{
              position: "relative",
              width: "40px",
              height: "40px",
              backgroundColor: "#F59E0B",
              color: "#030712",
              border: "none",
              borderRadius: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              padding: 0,
              boxShadow: "0 4px 14px rgba(245, 158, 11, 0.35)",
              transition: "transform 0.15s ease",
            }}
          >
            <span>🛒</span>
            <span style={{ position: "absolute", width: "1px", height: "1px", overflow: "hidden", clip: "rect(0,0,0,0)" }}>Cart</span>
            {cartCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-5px",
                  right: "-5px",
                  backgroundColor: "#030712",
                  color: "#FFFFFF",
                  borderRadius: "999px",
                  minWidth: "18px",
                  height: "18px",
                  padding: "0 4px",
                  fontSize: "10px",
                  fontWeight: "900",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid #F59E0B",
                }}
              >
                {cartCount}
              </span>
            )}
          </button>
        )}

        {/* Menu Toggle (Icon only) */}
        <button
          onClick={openRightMenu}
          style={{
            width: "40px",
            height: "40px",
            backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
            color: isAdmin ? "#F59E0B" : isDark ? "#38BDF8" : "#0284C7",
            border: `1px solid ${
              isAdmin
                ? "rgba(245, 158, 11, 0.4)"
                : isDark
                ? "rgba(56, 189, 248, 0.4)"
                : "#CBD5E1"
            }`,
            borderRadius: "12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
            padding: 0,
          }}
          title={isAdmin ? "Open Admin Console" : "Open Account Menu"}
        >
          <span>☰</span>
        </button>
      </div>
    </header>
  );
}
