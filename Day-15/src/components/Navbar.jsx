import React from "react";
import { Link } from "react-router-dom";
import { useCartStore, useAuthStore, useUIStore } from "../store/useStore";

export default function Navbar() {
  const cart = useCartStore((state) => state.cart);
  const openCart = useCartStore((state) => state.openCart);

  const user = useAuthStore((state) => state.user);
  const newsBannerText = useUIStore((state) => state.newsBannerText);
  const openRightMenuView = useUIStore((state) => state.openRightMenuView);
  const openRightMenu = useUIStore((state) => state.openRightMenu);
  const theme = useUIStore((state) => state.theme);
  const toggleTheme = useUIStore((state) => state.toggleTheme);
  const isDark = theme === "dark";

  const isAdmin = user?.role === "admin";
  const cartCount = (cart || []).reduce((acc, item) => acc + (item.quantity || 1), 0);

  // Notification counts
  const userNotifCount = 3; // Celery workers, Redis cache, Order confirmation
  const adminTickets = JSON.parse(localStorage.getItem("rmart_support_tickets") || "[]");
  const adminNotifCount = adminTickets.filter((t) => t.status === "open").length || 1;
  const notifCount = isAdmin ? adminNotifCount : userNotifCount;

  const handleOpenNotifications = () => {
    if (isAdmin) {
      openRightMenuView("queries");
    } else {
      openRightMenuView("inbox");
    }
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
      {/* 1. Brand Logo: R-Mart + Theme Toggle beside it */}
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

        {/* Theme Toggle Button (Light/Dark) beside RMart Logo */}
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

      {/* 2. Admin-Controlled News Banner Scrolling in Human Readable Speed */}
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
          maxWidth: "760px",
          boxShadow: isDark ? "inset 0 1px 4px rgba(0,0,0,0.6)" : "0 1px 3px rgba(0,0,0,0.05)",
        }}
        title="Admin announcement banner (hover to pause reading)"
      >
        {/* News Badge */}
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

        {/* Scrolling Ticker Track */}
        <div
          style={{
            flex: 1,
            overflow: "hidden",
            whiteSpace: "nowrap",
            position: "relative",
            maskImage:
              "linear-gradient(to right, transparent, black 15px, black 95%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent, black 15px, black 95%, transparent)",
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
              cursor: "pointer",
            }}
          >
            {newsBannerText} • {newsBannerText}
          </div>
        </div>
      </div>

      {/* 3. Right Controls: Role Based Toggle, Notifications and Cart */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexShrink: 0,
        }}
      >
        {/* FOR ADMIN: Welcome Admin Badge (NO CART OPTION!) */}
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

        {/* NOTIFICATION BUTTON: Takes user or admin directly to new notifications/queries in toggle */}
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
            boxShadow: isDark
              ? "0 0 12px rgba(239, 68, 68, 0.2)"
              : "0 2px 8px rgba(0, 0, 0, 0.05)",
          }}
          title={
            isAdmin
              ? "Open Customer Query Tickets in Toggle"
              : "Open Live Notifications in Toggle"
          }
        >
          <span>🔔</span>
          <span
            style={{
              backgroundColor: "#EF4444",
              color: "#FFFFFF",
              borderRadius: "999px",
              padding: "1px 6px",
              fontSize: "10px",
              fontWeight: "900",
              animation: "pulse 1.5s infinite",
            }}
          >
            {notifCount}
          </span>
        </button>

        {/* FOR USERS ONLY: Cart Button with Dynamic Badge */}
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
              transition: "transform 0.15s ease",
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

        {/* Collapsible Toggle Menu Button (User Side / Admin Side) */}
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
            boxShadow: isDark
              ? "0 2px 8px rgba(0,0,0,0.5)"
              : "0 2px 6px rgba(0,0,0,0.06)",
          }}
          title={isAdmin ? "Open Admin Console Toggle" : "Open User Hub Toggle"}
        >
          <span>☰</span>
          <span>{isAdmin ? "Admin Toggle" : user?.name ? user.name.split(" ")[0] : "Account"}</span>
        </button>
      </div>
    </header>
  );
}
