import React from "react";
import { useStore } from "../context/StoreContext";

export default function OrdersPage() {
  const { theme, orders, updateOrderStatus } = useStore();
  const isDark = theme === "dark";

  const c = {
    bg: isDark ? "#06080F" : "#F8FAFC",
    cardBg: isDark ? "#0F1420" : "#FFFFFF",
    border: isDark ? "#1E2738" : "#E2E8F0",
    text: isDark ? "#FFFFFF" : "#0F172A",
    subtext: isDark ? "#94A3B8" : "#64748B",
    accent: "#F59E0B",
  };

  return (
    <div style={{ backgroundColor: c.bg, minHeight: "calc(100vh - 64px)", padding: "32px 24px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "900", color: c.text, margin: "0 0 6px 0" }}>
          My Orders & Live Tracking
        </h1>
        <p style={{ color: c.subtext, fontSize: "14px", marginBottom: "24px" }}>
          Real-time delivery status synced with Celery task pipeline.
        </p>

        {orders.length === 0 ? (
          <div style={{ backgroundColor: c.cardBg, border: `1px solid ${c.border}`, borderRadius: "14px", padding: "40px", textAlign: "center", color: c.subtext }}>
            You have not placed any orders yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {orders.map((ord) => (
              <div
                key={ord.id}
                style={{
                  backgroundColor: c.cardBg,
                  border: `1px solid ${c.border}`,
                  borderRadius: "14px",
                  padding: "20px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                  <div>
                    <span style={{ fontSize: "16px", fontWeight: "900", color: c.accent }}>
                      Order #{ord.id}
                    </span>
                    <span style={{ fontSize: "12px", color: c.subtext, marginLeft: "10px" }}>
                      Placed on {ord.date}
                    </span>
                  </div>
                  <span style={{
                    backgroundColor: ord.status === "Cancelled" ? "#EF4444" : ord.status.includes("Shipped") || ord.status === "Delivered" ? "#10B981" : "#F59E0B",
                    color: "#000",
                    fontWeight: "900",
                    fontSize: "11px",
                    padding: "4px 10px",
                    borderRadius: "20px",
                    textTransform: "uppercase",
                  }}>
                    {ord.status}
                  </span>
                </div>

                <div style={{ borderTop: `1px solid ${c.border}`, borderBottom: `1px solid ${c.border}`, padding: "12px 0", margin: "12px 0" }}>
                  {ord.items.map((it, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: c.text, marginBottom: "4px" }}>
                      <span>{it.quantity || it.qty}x {it.name || it.title}</span>
                      <span style={{ fontWeight: "700" }}>${(Number(it.price) * (it.quantity || it.qty || 1)).toFixed(2)}</span>
                    </div>
                  ))}
                  <div style={{ fontSize: "12px", color: c.subtext, marginTop: "8px" }}>
                    ?? Destination: <b>{ord.address}</b>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "16px", fontWeight: "900", color: c.text }}>
                    Total: ${Number(ord.total).toFixed(2)}
                  </span>

                  {ord.status !== "Cancelled" && ord.status !== "Delivered" && (
                    <button
                      onClick={() => updateOrderStatus(ord.id, "Cancelled")}
                      style={{
                        backgroundColor: "transparent",
                        color: "#EF4444",
                        border: "1px solid #EF4444",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        fontWeight: "700",
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
