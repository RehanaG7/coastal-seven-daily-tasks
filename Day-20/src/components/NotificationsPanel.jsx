import React, { useState, useEffect } from "react";
import { useWebSocket } from "../hooks/useWebSocket";
import { env } from "../config/env";
import { useUIStore, useAuthStore, useNotificationStore } from "../store/useStore";

export default function NotificationsPanel({ isOpen, onClose }) {
  const theme = useUIStore((s) => s.theme);
  const user = useAuthStore((s) => s.user);
  const isDark = theme === "dark";
  const isAdmin = user?.role === "admin" || localStorage.getItem("user_role") === "admin";

  // Zustand persistent customer notification state
  const notifications = useNotificationStore((s) => s.notifications || []);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const markAllRead = useNotificationStore((s) => s.markAllAsRead);
  const markSingleRead = useNotificationStore((s) => s.markSingleRead);
  const clearAll = useNotificationStore((s) => s.clearAllNotifications);

  // Admin specific operations & alerts
  const DEFAULT_ADMIN_NOTIFS = [
    {
      id: "admin-notif-1",
      title: "🚨 Out of Stock: Apple iPhone 15 Pro Max",
      message: "Current inventory count is 0 units. Several shoppers have added this item to wishlist.",
      category: "stock",
      badge: "🚨 STOCK ALERT",
      is_read: 0,
      timestamp: "2 mins ago",
    },
    {
      id: "admin-notif-2",
      title: "📦 New Customer Order #ORD-942810",
      message: "Ananya Sharma placed an order for $1,549.98. Destination: Guntur. Current status: Processing.",
      category: "order",
      badge: "📦 NEW ORDER",
      is_read: 0,
      timestamp: "12 mins ago",
    },
    {
      id: "admin-notif-3",
      title: "💬 Customer Query Received",
      message: "Customer Ananya raised a query: 'When will order arrive at Guntur hub?' in Customer Queries.",
      category: "query",
      badge: "💬 CUSTOMER QUERY",
      is_read: 0,
      timestamp: "20 mins ago",
    },
    {
      id: "admin-notif-4",
      title: "⚠️ Low Stock: Samsung Odyssey Gaming Monitor",
      message: "Only 2 units remaining in inventory. Please replenish soon to prevent stockout.",
      category: "stock",
      badge: "⚠️ LOW STOCK",
      is_read: 1,
      timestamp: "1 hour ago",
    },
    {
      id: "admin-notif-5",
      title: "⚙️ Celery Background Worker Task",
      message: "Product catalog PostgreSQL tsvector search index generation finished successfully.",
      category: "system",
      badge: "⚙️ SYSTEM TASK",
      is_read: 1,
      timestamp: "2 hours ago",
    },
  ];

  const [adminNotifs, setAdminNotifs] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("rmart_admin_notifications") || "null");
      return saved || DEFAULT_ADMIN_NOTIFS;
    } catch {
      return DEFAULT_ADMIN_NOTIFS;
    }
  });

  const saveAdminNotifs = (list) => {
    setAdminNotifs(list);
    try {
      localStorage.setItem("rmart_admin_notifications", JSON.stringify(list));
    } catch {}
  };

  const handleAdminMarkAllRead = () => {
    const updated = adminNotifs.map((n) => ({ ...n, is_read: 1 }));
    saveAdminNotifs(updated);
  };

  const handleAdminMarkSingleRead = (id) => {
    const updated = adminNotifs.map((n) => (n.id === id ? { ...n, is_read: 1 } : n));
    saveAdminNotifs(updated);
  };

  const handleAdminClearAll = () => {
    saveAdminNotifs([]);
  };

  const [activeToast, setActiveToast] = useState(null);
  const [filter, setFilter] = useState("all");

  // WebSocket Subscription to Real-Time Notifications
  const wsUrl = `${env.WS_URL}/notifications`;
  const { status, lastMessage, isConnected, reconnectAttempts } = useWebSocket(
    wsUrl,
    {
      autoConnect: Boolean(user),
      reconnect: true,
      maxReconnectAttempts: 5,
      baseDelay: 1000,
      onMessage: (data) => {
        if (!data || data.type === "CONNECTED" || data.type === "PONG") return;

        if (isAdmin) {
          const newAdminNotif = {
            id: data.id || `admin-${Date.now()}`,
            title: data.title || "🛡️ Admin Operations Alert",
            message: data.message || "An operational inventory or customer event occurred.",
            category: data.category === "stock" ? "stock" : data.category === "query" ? "query" : "order",
            badge: data.category === "stock" ? "🚨 STOCK ALERT" : data.category === "query" ? "💬 CUSTOMER QUERY" : "📦 CUSTOMER ORDER",
            is_read: 0,
            timestamp: "Just now",
          };
          setAdminNotifs((prev) => [newAdminNotif, ...prev]);
          setActiveToast(newAdminNotif);
        } else {
          const newNotif = {
            id: data.id || Date.now(),
            title: data.title || "Real-Time System Alert",
            message: data.message || "An event occurred in the system.",
            category: data.category || "order",
            is_read: 0,
            timestamp: "Just now",
          };
          addNotification(newNotif);
          setActiveToast(newNotif);
        }

        setTimeout(() => {
          setActiveToast(null);
        }, 4500);
      },
    }
  );

  const currentList = isAdmin ? adminNotifs : notifications;
  const filteredNotifs = currentList.filter((n) => {
    if (filter === "unread") return n.is_read === 0;
    if (isAdmin) {
      if (filter === "stock") return n.category === "stock";
      if (filter === "order") return n.category === "order";
      if (filter === "query") return n.category === "query";
    } else {
      if (filter === "order") return n.category === "order";
      if (filter === "promo") return n.category === "promo" || n.category === "stock";
    }
    return true;
  });

  const unreadCount = currentList.filter((n) => n.is_read === 0).length;

  const c = {
    bg: isDark ? "#0B0F19" : "#FFFFFF",
    cardBg: isDark ? "#111827" : "#F8FAFC",
    cardBorder: isDark ? "#1F2937" : "#E2E8F0",
    text: isDark ? "#F9FAFB" : "#0F172A",
    subtext: isDark ? "#9CA3AF" : "#64748B",
    primary: "#F59E0B",
    accent: "#38BDF8",
    emerald: "#10B981",
  };

  return (
    <>
      {/* FLOATING REAL-TIME TOAST ALERT (Visible anywhere on screen) */}
      {activeToast && (
        <div
          data-testid="realtime-toast"
          style={{
            position: "fixed",
            top: "80px",
            right: "24px",
            zIndex: 999999,
            backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
            color: c.text,
            border: `1.5px solid ${c.accent}`,
            borderRadius: "14px",
            padding: "16px 20px",
            boxShadow: isDark
              ? "0 10px 30px rgba(0,0,0,0.8), 0 0 20px rgba(56, 189, 248, 0.3)"
              : "0 10px 30px rgba(0,0,0,0.15)",
            maxWidth: "360px",
            animation: "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
          }}
        >
          <div
            style={{
              fontSize: "20px",
              backgroundColor: "rgba(56, 189, 248, 0.15)",
              borderRadius: "8px",
              padding: "6px",
            }}
          >
            🔔
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "14px", fontWeight: "800", color: c.accent }}>
              {activeToast.title}
            </div>
            <div style={{ fontSize: "12px", color: c.subtext, marginTop: "4px" }}>
              {activeToast.message}
            </div>
            <div
              style={{
                fontSize: "10px",
                color: c.emerald,
                fontWeight: "700",
                marginTop: "6px",
              }}
            >
              ● Received via WebSocket Stream
            </div>
          </div>
          <button
            onClick={() => setActiveToast(null)}
            style={{
              background: "transparent",
              border: "none",
              color: c.subtext,
              cursor: "pointer",
              fontSize: "16px",
              padding: "0",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* NOTIFICATIONS DRAWER MODAL */}
      {isOpen && (
        <div
          data-testid="notifications-panel"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            justifyContent: "flex-end",
          }}
          onClick={onClose}
        >
          <div
            style={{
              width: "420px",
              maxWidth: "100%",
              height: "100vh",
              backgroundColor: c.bg,
              borderLeft: `1px solid ${c.cardBorder}`,
              display: "flex",
              flexDirection: "column",
              boxShadow: "-10px 0 40px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: `1px solid ${c.cardBorder}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "20px" }}>{isAdmin ? "🛡️" : "🔔"}</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "900", color: c.text }}>
                    {isAdmin ? "Admin Operations & Alerts" : "Notifications"}
                  </h3>
                  <div style={{ fontSize: "11px", color: c.subtext, marginTop: "2px" }}>
                    {isAdmin ? "Stock alerts, customer orders & live queries" : "Order tracking updates & store offers"}
                  </div>
                </div>
                {unreadCount > 0 && (
                  <span
                    style={{
                      backgroundColor: "#EF4444",
                      color: "#FFFFFF",
                      borderRadius: "999px",
                      padding: "2px 8px",
                      fontSize: "11px",
                      fontWeight: "900",
                    }}
                  >
                    {unreadCount} new
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "18px",
                  cursor: "pointer",
                  color: c.subtext,
                }}
              >
                ✕
              </button>
            </div>

            {/* WebSocket Stream Status Banner */}
            <div
              style={{
                padding: "10px 24px",
                backgroundColor: isConnected ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)",
                borderBottom: `1px solid ${c.cardBorder}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "11px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: isConnected ? "#10B981" : "#F59E0B",
                    display: "inline-block",
                  }}
                />
                <span style={{ color: isConnected ? "#10B981" : "#F59E0B", fontWeight: "800" }}>
                  {isConnected
                    ? "Live WebSocket Stream Connected"
                    : `Reconnecting (${reconnectAttempts}/5 attempts)...`}
                </span>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={isAdmin ? handleAdminMarkAllRead : markAllRead}
                  style={{
                    background: "none",
                    border: "none",
                    color: c.accent,
                    cursor: "pointer",
                    fontSize: "11px",
                    fontWeight: "800",
                    textDecoration: "underline",
                  }}
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                padding: "12px 24px",
                borderBottom: `1px solid ${c.cardBorder}`,
                overflowX: "auto",
              }}
            >
              {(isAdmin
                ? [
                    { id: "all", label: "All" },
                    { id: "unread", label: `Unread (${unreadCount})` },
                    { id: "stock", label: "🚨 Stock Alerts" },
                    { id: "order", label: "📦 New Orders" },
                    { id: "query", label: "💬 Customer Queries" },
                  ]
                : [
                    { id: "all", label: "All" },
                    { id: "unread", label: `Unread (${unreadCount})` },
                    { id: "order", label: "Orders" },
                    { id: "promo", label: "Promos" },
                  ]
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  style={{
                    backgroundColor: filter === f.id ? c.primary : "transparent",
                    color: filter === f.id ? "#000" : c.subtext,
                    border: `1px solid ${filter === f.id ? c.primary : c.cardBorder}`,
                    borderRadius: "999px",
                    padding: "4px 12px",
                    fontSize: "12px",
                    fontWeight: "800",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Notifications Feed */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "16px 24px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {filteredNotifs.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "60px 20px",
                    color: c.subtext,
                    fontSize: "14px",
                  }}
                >
                  <div style={{ fontSize: "36px", marginBottom: "8px" }}>📭</div>
                  <div>No notifications right now</div>
                </div>
              ) : (
                filteredNotifs.map((n) => {
                  const badgeText =
                    n.badge ||
                    (n.category === "stock"
                      ? "🚨 STOCK ALERT"
                      : n.category === "query"
                      ? "💬 CUSTOMER QUERY"
                      : n.category === "order"
                      ? "📦 ORDER UPDATE"
                      : "⚡ ANNOUNCEMENT");

                  const badgeColor =
                    n.category === "stock"
                      ? "#EF4444"
                      : n.category === "query"
                      ? "#F59E0B"
                      : n.category === "order"
                      ? "#10B981"
                      : "#38BDF8";

                  return (
                    <div
                      key={n.id}
                      onClick={() => (isAdmin ? handleAdminMarkSingleRead(n.id) : markSingleRead(n.id))}
                      style={{
                        backgroundColor: n.is_read ? c.cardBg : isDark ? "#1E293B" : "#EFF6FF",
                        border: `1px solid ${n.is_read ? c.cardBorder : c.accent}`,
                        borderRadius: "12px",
                        padding: "14px",
                        cursor: "pointer",
                        position: "relative",
                        transition: "transform 0.1s ease",
                      }}
                    >
                      {!n.is_read && (
                        <span
                          style={{
                            position: "absolute",
                            top: "14px",
                            right: "14px",
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: "#38BDF8",
                          }}
                        />
                      )}
                      <div
                        style={{
                          fontSize: "11px",
                          fontWeight: "800",
                          color: badgeColor,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          marginBottom: "4px",
                        }}
                      >
                        {badgeText}
                      </div>
                      <div style={{ fontSize: "14px", fontWeight: "800", color: c.text }}>
                        {n.title}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: c.subtext,
                          marginTop: "4px",
                          lineHeight: "1.4",
                        }}
                      >
                        {n.message}
                      </div>
                      <div
                        style={{
                          fontSize: "10px",
                          color: c.subtext,
                          marginTop: "8px",
                        }}
                      >
                        {n.timestamp}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {currentList.length > 0 && (
              <div
                style={{
                  padding: "16px 24px",
                  borderTop: `1px solid ${c.cardBorder}`,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <button
                  onClick={isAdmin ? handleAdminClearAll : clearAll}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#EF4444",
                    fontSize: "12px",
                    fontWeight: "800",
                    cursor: "pointer",
                  }}
                >
                  Clear All Notifications
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
