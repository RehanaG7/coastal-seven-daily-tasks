// ==============================================================================
// DAY 17: REAL-TIME WEBSOCKET ORDER TRACKER MODAL
// Listens to WebSocket /ws/orders/{order_id} for live order status updates
// ==============================================================================

import React, { useState, useEffect } from "react";
import { useWebSocket } from "../hooks/useWebSocket";
import { env } from "../config/env";

export default function OrderTrackerModal({ order, isOpen, onClose, theme }) {
  if (!isOpen || !order) return null;

  const isDark = theme === "dark";
  const orderId = order.id || order.orderId || "1";
  const numericOrderId = typeof orderId === "string" ? parseInt(orderId.replace(/\D/g, "")) || 1 : orderId;

  // Real-time live status from WebSocket
  const [liveStatus, setLiveStatus] = useState(order.status || "PROCESSING");
  const [lastEventMsg, setLastEventMsg] = useState("Connected to live tracking dispatch queue");

  // WebSocket Subscription
  const wsUrl = `${env.WS_URL}/orders/${numericOrderId}`;
  const { status, isConnected, reconnectAttempts } = useWebSocket(wsUrl, {
    autoConnect: true,
    reconnect: true,
    maxReconnectAttempts: 5,
    onMessage: (data) => {
      if (!data) return;
      if (data.status) {
        setLiveStatus(data.status);
      }
      if (data.message) {
        setLastEventMsg(data.message);
      }
    },
  });

  // Keep in sync if parent order prop updates
  useEffect(() => {
    if (order?.status) {
      setLiveStatus(order.status);
    }
  }, [order?.status]);

  const c = {
    panelBg: isDark ? "#0D111A" : "#FFFFFF",
    cardBg: isDark ? "#07090F" : "#F8FAFC",
    border: isDark ? "#1E2738" : "#E2E8F0",
    text: isDark ? "#F8FAFC" : "#0F172A",
    subtext: isDark ? "#94A3B8" : "#64748B",
    accent: "#F59E0B",
    green: "#10B981",
    blue: "#38BDF8",
  };

  const stages = [
    {
      id: "PENDING",
      title: "Order Placed & Payment Verified",
      sub: `Payment Ref: ${order.payment?.transactionId || "TXN-8392104"} • Redis Queued`,
      completedStatuses: [
        "PENDING",
        "PROCESSING",
        "CONFIRMED",
        "Processing (Queued in Redis)",
        "SHIPPED",
        "Shipped (Celery Dispatched)",
        "Dispatched from Hub",
        "OUT_FOR_DELIVERY",
        "Out for Delivery",
        "DELIVERED",
        "Delivered",
      ],
    },
    {
      id: "PROCESSING",
      title: "Celery Background Worker Processing",
      sub: `Task ID: ${order.celery_task_id || "celery-task-9a7f-44b2"} • Picked by worker`,
      completedStatuses: [
        "PROCESSING",
        "CONFIRMED",
        "Processing (Queued in Redis)",
        "SHIPPED",
        "Shipped (Celery Dispatched)",
        "Dispatched from Hub",
        "OUT_FOR_DELIVERY",
        "Out for Delivery",
        "DELIVERED",
        "Delivered",
      ],
    },
    {
      id: "SHIPPED",
      title: "Dispatched from Regional Hub",
      sub: "Transit via Vijayawada-Guntur Express Corridor",
      completedStatuses: [
        "SHIPPED",
        "Shipped (Celery Dispatched)",
        "Dispatched from Hub",
        "OUT_FOR_DELIVERY",
        "Out for Delivery",
        "DELIVERED",
        "Delivered",
      ],
    },
    {
      id: "OUT_FOR_DELIVERY",
      title: "Out for Delivery",
      sub: "R-Mart Courier Assigned • Delivery ETA 15 Mins",
      completedStatuses: [
        "OUT_FOR_DELIVERY",
        "Out for Delivery",
        "DELIVERED",
        "Delivered",
      ],
    },
    {
      id: "DELIVERED",
      title: "Delivered to Customer",
      sub: `Delivered to: ${order.address?.street || order.address || "Customer Address"}`,
      completedStatuses: ["DELIVERED", "Delivered"],
    },
  ];

  return (
    <div
      data-testid="order-tracker-modal"
      style={{
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
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: c.panelBg,
          border: `1px solid ${c.border}`,
          borderRadius: "18px",
          padding: "24px",
          maxWidth: "520px",
          width: "100%",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.9)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
            borderBottom: `1px solid ${c.border}`,
            paddingBottom: "12px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "20px" }}>📦</span>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "900", color: c.text }}>
                Live Order Tracker
              </h2>
            </div>
            <div style={{ fontSize: "12px", color: c.subtext, marginTop: "2px" }}>
              Tracking Order <span style={{ color: c.accent, fontWeight: "800" }}>#{orderId}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              backgroundColor: "transparent",
              border: "none",
              color: c.subtext,
              fontSize: "18px",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        {/* Real-Time WebSocket Telemetry Pill */}
        <div
          style={{
            backgroundColor: isConnected ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.12)",
            border: `1px solid ${isConnected ? "rgba(16, 185, 129, 0.3)" : "rgba(245, 158, 11, 0.3)"}`,
            borderRadius: "10px",
            padding: "8px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "20px",
            fontSize: "11px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: isConnected ? "#10B981" : "#F59E0B",
                display: "inline-block",
                boxShadow: isConnected ? "0 0 8px #10B981" : "none",
              }}
            />
            <span style={{ fontWeight: "800", color: isConnected ? "#10B981" : "#F59E0B" }}>
              {isConnected
                ? "Live WebSocket Stream Active (Zero Page Refreshes)"
                : `Reconnecting socket (${reconnectAttempts}/5)...`}
            </span>
          </div>
          <span style={{ color: c.subtext, fontSize: "10px" }}>Order #{numericOrderId}</span>
        </div>

        {/* Current Live Status Card */}
        <div
          style={{
            backgroundColor: c.cardBg,
            border: `1px solid ${c.border}`,
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: c.subtext, textTransform: "uppercase", fontWeight: "700" }}>
              Current Fulfillment Phase
            </span>
            <span
              style={{
                backgroundColor: liveStatus === "DELIVERED" || liveStatus === "Delivered" ? "#10B981" : c.accent,
                color: "#000",
                fontSize: "11px",
                fontWeight: "900",
                padding: "3px 10px",
                borderRadius: "999px",
              }}
            >
              {liveStatus}
            </span>
          </div>
          <div style={{ fontSize: "13px", fontWeight: "700", color: c.text, marginTop: "8px" }}>
            {lastEventMsg}
          </div>
        </div>

        {/* Visual Real-Time Stepper */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingLeft: "8px" }}>
          {stages.map((stage, idx) => {
            const isCompleted = stage.completedStatuses.includes(liveStatus);
            const isLast = idx === stages.length - 1;

            return (
              <div key={idx} style={{ display: "flex", gap: "16px", position: "relative" }}>
                {!isLast && (
                  <div
                    style={{
                      position: "absolute",
                      left: "11px",
                      top: "24px",
                      bottom: "-16px",
                      width: "2px",
                      backgroundColor: isCompleted ? c.green : c.border,
                      transition: "background-color 0.4s ease",
                    }}
                  />
                )}

                {/* Step Circle Indicator */}
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    backgroundColor: isCompleted ? c.green : isDark ? "#1E2738" : "#E2E8F0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    color: isCompleted ? "#000" : c.subtext,
                    fontWeight: "900",
                    zIndex: 1,
                    transition: "all 0.3s ease",
                    boxShadow: isCompleted ? `0 0 10px ${c.green}66` : "none",
                  }}
                >
                  {isCompleted ? "✓" : idx + 1}
                </div>

                {/* Step Content */}
                <div style={{ flex: 1, paddingBottom: isLast ? "0" : "8px" }}>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: "800",
                      color: isCompleted ? c.text : c.subtext,
                      transition: "color 0.3s ease",
                    }}
                  >
                    {stage.title}
                  </div>
                  <div style={{ fontSize: "11px", color: c.subtext, marginTop: "2px", lineHeight: "1.4" }}>
                    {stage.sub}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Close CTA */}
        <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: isDark ? "#1E2738" : "#E2E8F0",
              color: c.text,
              border: "none",
              borderRadius: "8px",
              padding: "10px 18px",
              fontSize: "12px",
              fontWeight: "800",
              cursor: "pointer",
            }}
          >
            Close Tracker
          </button>
        </div>
      </div>
    </div>
  );
}
