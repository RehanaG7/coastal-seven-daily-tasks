import React from "react";
import { Link } from "react-router-dom";
import { useCartStore, useAuthStore, useUIStore, useNotificationStore } from "../store/useStore";

export default function Navbar() {
  const cart = useCartStore((state) => state.cart);
  const openCart = useCartStore((state) => state.openCart);

  const user = useAuthStore((state) => state.user);
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
        {/* Admin Badge */}
        {isAdmin && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: "rgba(245, 158, 11, 0.12)",
              border: "1px solid rgba(245, 158, 11, 0.4)",
              color: "#F59E0B",
              padding: "6px 12px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: "800",
            }}
          >
            <span>🛡️</span>
            <span>Welcome Admin</span>
          </div>
        )}

        {/* User Orders History Link */}
        {!isAdmin && (
          <Link
            to="/orders"
            style={{
              backgroundColor: isDark ? "#0F172A" : "#F1F5F9",
              border: `1px solid ${isDark ? "#1E293B" : "#CBD5E1"}`,
              color: isDark ? "#E2E8F0" : "#0F172A",
              padding: "8px 12px",
              borderRadius: "10px",
              fontSize: "12px",
              fontWeight: "800",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
            title="View Your Orders History"
          >
            <span>📦</span>
            <span>Orders</span>
          </Link>
        )}

        {/* Notifications */}
        <button
          onClick={handleOpenNotifications}
          style={{
            backgroundColor: isDark ? "#0B0F19" : "#FFFFFF",
            border: isDark
              ? "1px solid rgba(239, 68, 68, 0.5)"
              : "1px solid rgba(239, 68, 68, 0.4)",
            borderRadius: "10px",
            padding: "8px 12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            color: isDark ? "#FFFFFF" : "#0F172A",
            fontSize: "13px",
            fontWeight: "800",
          }}
          title={isAdmin ? "Open Customer Queries" : "Open Notifications"}
        >
          <span>🔔</span>
          <span
            data-testid="notification-badge-count"
            style={{
              backgroundColor: notifCount > 0 ? "#EF4444" : isDark ? "#334155" : "#94A3B8",
              color: "#FFFFFF",
              borderRadius: "999px",
              padding: "1px 6px",
              fontSize: "10px",
              fontWeight: "900",
              transition: "all 0.2s ease",
            }}
          >
            {notifCount}
          </span>
        </button>

        {/* Live Support Chat Button (Day 17) */}
        <button
          onClick={() => openLiveChat(isAdmin ? "admin_support" : "general")}
          data-testid="live-chat-toggle-btn"
          style={{
            backgroundColor: isDark ? "#0B0F19" : "#FFFFFF",
            border: isDark
              ? "1px solid rgba(56, 189, 248, 0.4)"
              : "1px solid rgba(14, 165, 233, 0.4)",
            borderRadius: "10px",
            padding: "8px 12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            color: isDark ? "#38BDF8" : "#0284C7",
            fontSize: "13px",
            fontWeight: "800",
          }}
          title="Open Real-Time Live Support Chat"
        >
          <span>💬</span>
          <span>Chat</span>
        </button>

        {/* Cart Button */}
        {!isAdmin && (
          <button
            onClick={openCart}
            style={{
              backgroundColor: "#F59E0B",
              color: "#030712",
              border: "none",
              borderRadius: "10px",
              padding: "8px 16px",
              fontWeight: "900",
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 14px rgba(245, 158, 11, 0.35)",
            }}
          >
            <span>🛒</span>
            <span>Cart</span>
            <span
              style={{
                backgroundColor: "#030712",
                color: "#FFFFFF",
                borderRadius: "999px",
                padding: "2px 7px",
                fontSize: "11px",
                fontWeight: "900",
              }}
            >
              {cartCount}
            </span>
          </button>
        )}

        {/* Menu Toggle */}
        <button
          onClick={openRightMenu}
          style={{
            backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
            color: isAdmin ? "#F59E0B" : isDark ? "#38BDF8" : "#0284C7",
            border: `1px solid ${
              isAdmin
                ? "rgba(245, 158, 11, 0.4)"
                : isDark
                ? "rgba(56, 189, 248, 0.4)"
                : "#CBD5E1"
            }`,
            borderRadius: "10px",
            padding: "8px 14px",
            fontWeight: "800",
            fontSize: "13px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
          title={isAdmin ? "Open Admin Console" : "Open Account"}
        >
          <span>☰</span>
          <span>{isAdmin ? "Admin" : user?.name ? user.name.split(" ")[0] : "Account"}</span>
        </button>
      </div>
    </header>
  );
}
