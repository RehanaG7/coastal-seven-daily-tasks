import React from "react";

export default function OrderTrackerModal({ order, isOpen, onClose, theme }) {
  if (!isOpen || !order) return null;

  const isDark = theme === "dark";

  const c = {
    panelBg: isDark ? "#0D111A" : "#FFFFFF",
    cardBg: isDark ? "#07090F" : "#F8FAFC",
    border: isDark ? "#1E2738" : "#E2E8F0",
    text: isDark ? "#F8FAFC" : "#0F172A",
    subtext: isDark ? "#94A3B8" : "#64748B",
    accent: "#F59E0B",
    green: "#10B981",
  };

  const stages = [
    {
      title: "Order Placed & Payment Verified",
      sub: `Payment Ref: ${order.payment?.transactionId || "TXN-8392104"} • Redis Queued`,
      completedStatuses: [
        "Processing (Queued in Redis)",
        "Shipped (Celery Dispatched)",
        "Dispatched from Hub",
        "Out for Delivery",
        "Delivered"
      ]
    },
    {
      title: "Celery Background Worker Processing",
      sub: `Task ID: ${order.celery_task_id || "celery-task-9a7f-44b2"} • Picked by worker`,
      completedStatuses: [
        "Shipped (Celery Dispatched)",
        "Dispatched from Hub",
        "Out for Delivery",
        "Delivered"
      ]
    },
    {
      title: "Dispatched from Regional Hub",
      sub: "Transit via Vijayawada-Guntur Express Corridor",
      completedStatuses: [
        "Dispatched from Hub",
        "Out for Delivery",
        "Delivered"
      ]
    },
    {
      title: "Out for Delivery",
      sub: "R-Mart Courier Assigned • Delivery ETA 15 Mins",
      completedStatuses: [
        "Out for Delivery",
        "Delivered"
      ]
    },
    {
      title: "Delivered to Customer",
      sub: `Delivered to: ${order.address}`,
      completedStatuses: [
        "Delivered"
      ]
    }
  ];

  const currentStatus = order.status || "Processing (Queued in Redis)";
  const isCancelled = currentStatus === "Cancelled";

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      backdropFilter: "blur(4px)",
      zIndex: 10000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      <div style={{
        backgroundColor: c.panelBg,
        border: `1px solid ${c.border}`,
        borderRadius: "18px",
        padding: "24px",
        maxWidth: "520px",
        width: "100%",
        boxShadow: "0 25px 60px rgba(0, 0, 0, 0.9)",
        maxHeight: "90vh",
        overflowY: "auto",
      }}>
        {/* Modal Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: `1px solid ${c.border}`, paddingBottom: "12px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "20px" }}>📦</span>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "900", color: c.text }}>
                Live Order Tracker
              </h2>
            </div>
            <span style={{ fontSize: "11px", color: c.subtext }}>
              Order ID: <b style={{ color: c.accent }}>#{order.id}</b> • Placed: {order.date}
            </span>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "none",
              border: `1px solid ${c.border}`,
              borderRadius: "6px",
              color: c.text,
              padding: "4px 8px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            ✕
          </button>
        </div>

        {/* Live Status Header Bar */}
        <div style={{
          backgroundColor: isCancelled ? "#EF444420" : "#10B98115",
          border: `1px solid ${isCancelled ? "#EF4444" : "#10B98150"}`,
          borderRadius: "10px",
          padding: "12px 16px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div>
            <span style={{ fontSize: "10px", fontWeight: "800", color: c.subtext, textTransform: "uppercase" }}>Current Status</span>
            <div style={{ fontSize: "14px", fontWeight: "900", color: isCancelled ? "#EF4444" : c.green, marginTop: "2px" }}>
              {isCancelled ? "Order Cancelled" : currentStatus}
            </div>
          </div>
          <span style={{
            fontSize: "11px",
            backgroundColor: isCancelled ? "#EF4444" : c.green,
            color: "#000",
            fontWeight: "900",
            padding: "3px 8px",
            borderRadius: "6px",
          }}>
            {isCancelled ? "CANCELLED" : "ACTIVE"}
          </span>
        </div>

        {/* Interactive Stepper Visual Timeline */}
        {!isCancelled ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0px", position: "relative", marginBottom: "20px", paddingLeft: "8px" }}>
            {stages.map((stage, idx) => {
              const isPassed = stage.completedStatuses.includes(currentStatus);
              const isLast = idx === stages.length - 1;

              return (
                <div key={idx} style={{ display: "flex", alignItems: "flex-start", position: "relative", minHeight: "56px" }}>
                  {/* Connecting Line */}
                  {!isLast && (
                    <div style={{
                      position: "absolute",
                      left: "13px",
                      top: "22px",
                      bottom: "-8px",
                      width: "2px",
                      backgroundColor: isPassed ? c.green : (isDark ? "#1E2738" : "#E2E8F0"),
                      zIndex: 1,
                    }} />
                  )}

                  {/* Indicator Dot */}
                  <div style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    backgroundColor: isPassed ? c.green : (isDark ? "#121824" : "#E2E8F0"),
                    color: isPassed ? "#000" : c.subtext,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "900",
                    fontSize: "12px",
                    zIndex: 2,
                    boxShadow: isPassed ? `0 0 12px ${c.green}60` : "none",
                  }}>
                    {isPassed ? "✓" : idx + 1}
                  </div>

                  {/* Stage Text */}
                  <div style={{ marginLeft: "14px", flex: 1 }}>
                    <div style={{ fontSize: "13px", fontWeight: isPassed ? "800" : "500", color: isPassed ? c.text : c.subtext }}>
                      {stage.title}
                    </div>
                    <div style={{ fontSize: "11px", color: c.subtext, marginTop: "2px" }}>
                      {stage.sub}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "30px 0", color: "#EF4444", fontSize: "13px" }}>
            This order was cancelled. Background Celery pipeline terminated.
          </div>
        )}

        {/* Live Logistics Metadata Box */}
        <div style={{ backgroundColor: c.cardBg, border: `1px solid ${c.border}`, borderRadius: "10px", padding: "14px", fontSize: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: c.subtext }}>Assigned Queue:</span>
            <code style={{ color: c.accent }}>{order.redis_queue || "priority_orders_queue"}</code>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: c.subtext }}>Payment Verification:</span>
            <span style={{ color: c.green, fontWeight: "bold" }}>{order.payment?.method || "UPI"} (Verified & Paid)</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: c.subtext }}>Items ({order.items.length}):</span>
            <span style={{ color: c.text, fontWeight: "bold" }}>
              {order.items.map((i) => `${i.quantity || 1}x ${i.name || i.title}`).join(", ")}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${c.border}`, paddingTop: "6px", marginTop: "4px" }}>
            <span style={{ color: c.subtext }}>Total Bill:</span>
            <b style={{ color: c.text, fontSize: "14px" }}>${Number(order.total).toFixed(2)}</b>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: "16px",
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: c.accent,
            color: "#000",
            fontWeight: "900",
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          Close Tracker
        </button>
      </div>
    </div>
  );
}
