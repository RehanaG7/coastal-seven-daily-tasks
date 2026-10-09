import React, { useState, useEffect } from "react";
import { useWebSocket } from "../hooks/useWebSocket";
import { env } from "../config/env";
import { useUIStore, useAuthStore, useNotificationStore } from "../store/useStore";

export default function NotificationsPanel({ isOpen, onClose }) {
  const theme = useUIStore((s) => s.theme);
  const user = useAuthStore((s) => s.user);
  const isDark = theme === "dark";

  // Zustand persistent notification state shared across entire app & Navbar
  const notifications = useNotificationStore((s) => s.notifications || []);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const markAllRead = useNotificationStore((s) => s.markAllAsRead);
  const markSingleRead = useNotificationStore((s) => s.markSingleRead);
  const clearAll = useNotificationStore((s) => s.clearAllNotifications);

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

        const newNotif = {
          id: data.id || Date.now(),
          title: data.title || "Real-Time System Alert",
          message: data.message || "An event occurred in the system.",
          category: data.category || "order",
          is_read: 0,
          timestamp: "Just now",
        };

        addNotification(newNotif);

        // Pop floating toast notification for 4.5 seconds
        setActiveToast(newNotif);
        setTimeout(() => {
          setActiveToast(null);
        }, 4500);
      },
    }
  );

  const filteredNotifs = notifications.filter((n) => {
    if (filter === "unread") return n.is_read === 0;
    if (filter === "order") return n.category === "order";
    if (filter === "promo") return n.category === "promo" || n.category === "stock";
    return true;
  });

  const unreadCount = notifications.filter((n) => n.is_read === 0).length;

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
                <span style={{ fontSize: "20px" }}>🔔</span>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "900", color: c.text }}>
                  Notifications
                </h3>
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
                  onClick={markAllRead}
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
              }}
            >
              {[
                { id: "all", label: "All" },
                { id: "unread", label: `Unread (${unreadCount})` },
                { id: "order", label: "Orders" },
                { id: "promo", label: "Promos" },
              ].map((f) => (
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
                filteredNotifs.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markSingleRead(n.id)}
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
                        color: n.category === "order" ? c.emerald : c.primary,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        marginBottom: "4px",
                      }}
                    >
                      {n.category === "order" ? "📦 Order Update" : "⚡ Announcement"}
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
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div
                style={{
                  padding: "16px 24px",
                  borderTop: `1px solid ${c.cardBorder}`,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <button
                  onClick={clearAll}
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
