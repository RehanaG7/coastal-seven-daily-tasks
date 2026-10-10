import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUIStore, useCartStore } from "../store/useStore";
import Footer from "../components/Footer";
import TaskProgressModal from "../components/TaskProgressModal";
import { invoiceService, orderService, apiClient } from "../api/apiClient";

const STAGES = ["Order Placed", "Processing", "Out for Delivery", "Delivered"];

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [expandedOrders, setExpandedOrders] = useState({});
  const theme = useUIStore((s) => s.theme);
  const openTracker = useUIStore((s) => s.openTracker);
  const addToCart = useCartStore((s) => s.addToCart);
  const openCart = useCartStore((s) => s.openCart);
  const isDark = theme === "dark";
  const navigate = useNavigate();

  // Day 18 Celery Task Lifecycle Modal State
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);
  const [orderTab, setOrderTab] = useState("all"); // "all" | "recent" | "history"

  useEffect(() => {
    const loadOrders = async () => {
      let localOrders = [];
      try {
        localOrders = JSON.parse(localStorage.getItem("rmart_orders") || "[]");
      } catch (e) {}

      // Only attempt loading orders from backend if an active auth token exists
      const token = localStorage.getItem("token") || localStorage.getItem("access_token");
      if (token) {
        try {
          const backendOrders = await orderService.getOrders();
          if (Array.isArray(backendOrders) && backendOrders.length > 0) {
            const merged = [...backendOrders, ...localOrders.filter((lo) => !backendOrders.some((bo) => bo.id === lo.id || bo.order_id === lo.id))];
            setOrders(merged);
            return;
          }
        } catch (e) {
          // Backend offline fallback
        }
      }

      setOrders(localOrders);
    };

    loadOrders();
  }, []);

  const toggleExpand = (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const handleReorder = (order) => {
    const items = order.items || [];
    if (items.length === 0) return;
    items.forEach((it) => {
      addToCart({
        id: it.product_id || it.id || 1,
        name: it.product_name || it.name || it.title || "Product",
        price: Number(it.price_at_purchase || it.price || 0),
        image: it.image || it.image_url,
        stock: 50,
      }, it.quantity || it.qty || 1);
    });
    openCart();
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm(`Are you sure you want to cancel Order #${orderId}?`)) return;
    try {
      await apiClient.patch(`/orders/${orderId}/cancel`);
    } catch (e) {}
    updateOrderStatus(orderId, "CANCELLED");
  };

  const handleGenerateInvoice = async (orderOrId) => {
    try {
      const orderObj = typeof orderOrId === "object" ? orderOrId : orders.find((o) => (o.orderId || o.id) === orderOrId) || { id: orderOrId };
      const orderId = orderObj.orderId || orderObj.id || orderOrId;
      const numericId = parseInt(String(orderId).replace(/\D/g, "")) || 1;
      setSelectedInvoiceOrder(orderObj);
      setTaskTitle(`Generating PDF Invoice for Order #${orderId}`);
      setIsTaskModalOpen(true);
      setActiveTaskId(null);

      const data = await invoiceService.generateInvoice(numericId, orderObj);
      if (data?.task_id) {
        setActiveTaskId(data.task_id);
      }
    } catch (err) {
      console.error("Failed to dispatch invoice task:", err);
    }
  };

  const updateOrderStatus = (orderId, newStatus) => {
    const updated = orders.map((o) =>
      o.orderId === orderId || o.id === orderId ? { ...o, status: newStatus } : o
    );
    setOrders(updated);
    localStorage.setItem("rmart_orders", JSON.stringify(updated));
  };

  const c = {
    bg: isDark ? "#06080F" : "#F8FAFC",
    cardBg: isDark ? "#0F1420" : "#FFFFFF",
    border: isDark ? "#1E2738" : "#E2E8F0",
    text: isDark ? "#FFFFFF" : "#0F172A",
    subtext: isDark ? "#94A3B8" : "#64748B",
    accent: "#38BDF8",
    gold: "#F59E0B",
    emerald: "#10B981",
  };

  const getStatusColor = (status = "") => {
    const s = status.toLowerCase();
    if (s.includes("delivered")) return { bg: "rgba(16, 185, 129, 0.15)", text: "#10B981", border: "#10B981" };
    if (s.includes("out") || s.includes("delivery") || s.includes("transit")) return { bg: "rgba(56, 189, 248, 0.15)", text: "#38BDF8", border: "#38BDF8" };
    if (s.includes("process")) return { bg: "rgba(245, 158, 11, 0.15)", text: "#F59E0B", border: "#F59E0B" };
    if (s.includes("cancel")) return { bg: "rgba(239, 68, 68, 0.15)", text: "#EF4444", border: "#EF4444" };
    return { bg: "rgba(148, 163, 184, 0.15)", text: "#94A3B8", border: "#94A3B8" };
  };

  const getStageIndex = (status = "") => {
    const s = status.toLowerCase();
    if (s.includes("delivered")) return 3;
    if (s.includes("out") || s.includes("transit")) return 2;
    if (s.includes("process")) return 1;
    return 0;
  };

  const totalSpent = orders.reduce((sum, o) => sum + Number(o.totalAmount || o.total || 0), 0);

  return (
    <div style={{ backgroundColor: c.bg, minHeight: "100vh", padding: "40px 24px 80px 24px", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        
        {/* Header Navigation & Title */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "28px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span style={{ fontSize: "24px" }}>📦</span>
              <h1 style={{ fontSize: "30px", fontWeight: "900", color: c.text, margin: 0, letterSpacing: "-0.5px" }}>
                My Orders & Live Tracking
              </h1>
            </div>
            <p style={{ color: c.subtext, fontSize: "14px", margin: 0 }}>
              Real-time dispatch telemetry and Celery asynchronous delivery tracking.
            </p>
          </div>

          <Link
            to="/catalog"
            style={{
              backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
              color: c.accent,
              padding: "10px 18px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: "800",
              textDecoration: "none",
              border: `1px solid ${c.border}`,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            ← Continue Shopping
          </Link>
        </div>

        {/* Quick Stats Ribbon */}
        {orders.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
              marginBottom: "32px",
            }}
          >
            <div style={{ backgroundColor: c.cardBg, border: `1px solid ${c.border}`, borderRadius: "14px", padding: "16px 20px" }}>
              <div style={{ color: c.subtext, fontSize: "12px", fontWeight: "700" }}>Total Orders</div>
              <div style={{ color: c.text, fontSize: "24px", fontWeight: "900", marginTop: "4px" }}>{orders.length}</div>
            </div>
            <div style={{ backgroundColor: c.cardBg, border: `1px solid ${c.border}`, borderRadius: "14px", padding: "16px 20px" }}>
              <div style={{ color: c.subtext, fontSize: "12px", fontWeight: "700" }}>Active Shipments</div>
              <div style={{ color: c.accent, fontSize: "24px", fontWeight: "900", marginTop: "4px" }}>
                {orders.filter((o) => !o.status?.includes("Delivered") && !o.status?.includes("Cancelled")).length}
              </div>
            </div>
            <div style={{ backgroundColor: c.cardBg, border: `1px solid ${c.border}`, borderRadius: "14px", padding: "16px 20px" }}>
              <div style={{ color: c.subtext, fontSize: "12px", fontWeight: "700" }}>Total Purchases</div>
              <div style={{ color: c.emerald, fontSize: "24px", fontWeight: "900", marginTop: "4px" }}>${totalSpent.toFixed(2)}</div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {orders.length === 0 ? (
          <div
            style={{
              backgroundColor: c.cardBg,
              border: `1px dashed ${c.border}`,
              borderRadius: "20px",
              padding: "60px 24px",
              textAlign: "center",
              boxShadow: isDark ? "none" : "0 8px 30px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ fontSize: "56px", marginBottom: "16px" }}>🛍️</div>
            <h2 style={{ fontSize: "22px", fontWeight: "900", color: c.text, marginBottom: "8px" }}>
              No Orders Placed Yet
            </h2>
            <p style={{ color: c.subtext, fontSize: "14px", maxWidth: "420px", margin: "0 auto 24px auto", lineHeight: 1.5 }}>
              Your order history is currently empty. Browse our catalog with 17 product categories and place your first order!
            </p>
            <button
              onClick={() => navigate("/catalog")}
              style={{
                backgroundColor: "#38BDF8",
                color: "#030712",
                border: "none",
                padding: "14px 28px",
                borderRadius: "12px",
                fontWeight: "900",
                fontSize: "14px",
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(56, 189, 248, 0.35)",
              }}
            >
              Explore Products Catalog →
            </button>
          </div>
        ) : (() => {
          const recentOrders = orders.filter((o) => {
            const s = (o.status || "").toLowerCase();
            return !s.includes("delivered") && !s.includes("cancelled");
          });
          const historyOrders = orders.filter((o) => {
            const s = (o.status || "").toLowerCase();
            return s.includes("delivered") || s.includes("cancelled");
          });
          const displayedOrders =
            orderTab === "recent"
              ? recentOrders
              : orderTab === "history"
              ? historyOrders
              : orders;

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Segmented Filter: All | Recent Orders | Order History */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  backgroundColor: isDark ? "#0F1420" : "#F1F5F9",
                  padding: "6px",
                  borderRadius: "14px",
                  border: `1px solid ${c.border}`,
                  width: "fit-content",
                }}
              >
                <button
                  onClick={() => setOrderTab("all")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "10px",
                    border: "none",
                    fontSize: "13px",
                    fontWeight: "800",
                    cursor: "pointer",
                    backgroundColor: orderTab === "all" ? (isDark ? "#1E293B" : "#FFFFFF") : "transparent",
                    color: orderTab === "all" ? c.accent : c.subtext,
                    boxShadow: orderTab === "all" ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  All Orders ({orders.length})
                </button>

                <button
                  onClick={() => setOrderTab("recent")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "10px",
                    border: "none",
                    fontSize: "13px",
                    fontWeight: "800",
                    cursor: "pointer",
                    backgroundColor: orderTab === "recent" ? (isDark ? "#1E293B" : "#FFFFFF") : "transparent",
                    color: orderTab === "recent" ? c.accent : c.subtext,
                    boxShadow: orderTab === "recent" ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>⚡</span>
                  <span>Recent Orders ({recentOrders.length})</span>
                </button>

                <button
                  onClick={() => setOrderTab("history")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "10px",
                    border: "none",
                    fontSize: "13px",
                    fontWeight: "800",
                    cursor: "pointer",
                    backgroundColor: orderTab === "history" ? (isDark ? "#1E293B" : "#FFFFFF") : "transparent",
                    color: orderTab === "history" ? c.accent : c.subtext,
                    boxShadow: orderTab === "history" ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>📜</span>
                  <span>Order History ({historyOrders.length})</span>
                </button>
              </div>

              {displayedOrders.length === 0 ? (
                <div
                  style={{
                    backgroundColor: c.cardBg,
                    border: `1px solid ${c.border}`,
                    borderRadius: "16px",
                    padding: "36px",
                    textAlign: "center",
                    color: c.subtext,
                  }}
                >
                  <p style={{ margin: 0, fontSize: "15px", fontWeight: "700" }}>
                    No orders found in {orderTab === "recent" ? "Recent Orders" : "Order History"}.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  {displayedOrders.map((ord, idx) => {
                    const status = ord.status || "Order Placed";
                    const sColor = getStatusColor(status);
                    const stageIdx = getStageIndex(status);
                    const items = ord.items || [];
                    const orderId = ord.orderId || ord.id || `ORD-${1000 + idx}`;
                    const total = Number(ord.totalAmount || ord.total || 0);

              return (
                <div
                  key={orderId}
                  style={{
                    backgroundColor: c.cardBg,
                    border: `1px solid ${c.border}`,
                    borderRadius: "18px",
                    padding: "24px",
                    boxShadow: isDark ? "0 10px 25px rgba(0,0,0,0.4)" : "0 4px 15px rgba(0,0,0,0.05)",
                  }}
                >
                  {/* Order Top Bar */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                      gap: "12px",
                      borderBottom: `1px solid ${c.border}`,
                      paddingBottom: "16px",
                      marginBottom: "20px",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "18px", fontWeight: "900", color: c.gold, letterSpacing: "0.5px" }}>
                          #{orderId}
                        </span>
                        <span
                          style={{
                            backgroundColor: sColor.bg,
                            color: sColor.text,
                            border: `1px solid ${sColor.border}`,
                            padding: "3px 10px",
                            borderRadius: "16px",
                            fontSize: "11px",
                            fontWeight: "800",
                            textTransform: "uppercase",
                          }}
                        >
                          {status}
                        </span>
                        {ord.paymentMethod && (
                          <span
                            style={{
                              backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
                              color: c.subtext,
                              padding: "3px 8px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: "700",
                            }}
                          >
                            💳 {ord.paymentMethod}
                          </span>
                        )}
                        {(Number(ord.discount || 0) > 0 || ord.couponCode) && (
                          <span
                            style={{
                              backgroundColor: "rgba(16, 185, 129, 0.15)",
                              color: "#10B981",
                              padding: "3px 8px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: "800",
                              border: "1px solid rgba(16, 185, 129, 0.3)",
                            }}
                          >
                            🏷️ {ord.couponCode || "OFFER"} (-${Number(ord.discount || 0).toFixed(2)})
                          </span>
                        )}
                      </div>
                      <div style={{ color: c.subtext, fontSize: "12px", marginTop: "4px" }}>
                        Placed on {ord.createdAt || ord.date || "Today"}
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: c.emerald, fontSize: "22px", fontWeight: "900" }}>
                        ${total.toFixed(2)}
                      </div>
                      <div style={{ color: c.subtext, fontSize: "11px" }}>
                        {items.length} {items.length === 1 ? "item" : "items"}
                      </div>
                    </div>
                  </div>

                  {/* 4-STAGE VISUAL DELIVERY STEPPER */}
                  <div
                    style={{
                      backgroundColor: isDark ? "#06080F" : "#F8FAFC",
                      borderRadius: "12px",
                      padding: "16px",
                      marginBottom: "20px",
                      border: `1px solid ${c.border}`,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
                      {STAGES.map((st, sIdx) => {
                        const isDone = sIdx <= stageIdx;
                        const isCurrent = sIdx === stageIdx;
                        return (
                          <div
                            key={st}
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              flex: 1,
                              textAlign: "center",
                              position: "relative",
                              zIndex: 2,
                            }}
                          >
                            <div
                              style={{
                                width: "28px",
                                height: "28px",
                                borderRadius: "50%",
                                backgroundColor: isDone ? "#10B981" : isDark ? "#1E293B" : "#E2E8F0",
                                color: isDone ? "#030712" : c.subtext,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "12px",
                                fontWeight: "900",
                                marginBottom: "6px",
                                boxShadow: isCurrent ? "0 0 12px #10B981" : "none",
                              }}
                            >
                              {isDone ? "✓" : sIdx + 1}
                            </div>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: isDone ? "800" : "600",
                                color: isDone ? c.text : c.subtext,
                              }}
                            >
                              {st}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Toggle Button to View / Hide Ordered Items */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <button
                      type="button"
                      onClick={() => toggleExpand(orderId)}
                      style={{
                        backgroundColor: expandedOrders[orderId] ? (isDark ? "#1E293B" : "#E2E8F0") : "transparent",
                        border: `1px solid ${c.border}`,
                        color: c.accent,
                        padding: "7px 14px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: "800",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                      title="Click to expand or collapse items placed in this order"
                    >
                      <span>{expandedOrders[orderId] ? "▲ Hide Items Placed" : `▼ View Items Placed (${items.length})`}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleReorder(ord)}
                      title="Reorder all items from this order into your cart"
                      style={{
                        backgroundColor: "rgba(245, 158, 11, 0.12)",
                        color: "#F59E0B",
                        border: "1px solid #F59E0B",
                        padding: "7px 14px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: "800",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span>🔄</span>
                      <span>Reorder</span>
                    </button>
                  </div>

                  {/* Itemized Order Products Breakdown (Revealed when clicked) */}
                  {expandedOrders[orderId] && items.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                      {items.map((it, itIdx) => (
                        <div
                          key={itIdx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "10px",
                            borderRadius: "10px",
                            backgroundColor: isDark ? "#06080F" : "#F8FAFC",
                            border: `1px solid ${c.border}`,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <img
                              src={it.image || it.image_url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"}
                              alt={it.name || it.title}
                              onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"; }}
                              style={{ width: "48px", height: "48px", borderRadius: "8px", objectFit: "cover", flexShrink: 0 }}
                            />
                            <div>
                              <div style={{ color: c.text, fontSize: "13px", fontWeight: "800" }}>
                                {it.name || it.title}
                              </div>
                              <div style={{ color: c.subtext, fontSize: "11px" }}>
                                Qty: <strong>{it.quantity || it.qty || 1}</strong> × ${Number(it.price || 0).toFixed(2)}
                              </div>
                            </div>
                          </div>

                          <span style={{ color: c.text, fontWeight: "800", fontSize: "13px" }}>
                            ${(Number(it.price || 0) * (it.quantity || it.qty || 1)).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Destination Address & Action Row */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "12px",
                      paddingTop: "14px",
                      borderTop: `1px solid ${c.border}`,
                    }}
                  >
                    <div style={{ color: c.subtext, fontSize: "12px" }}>
                      📍 Deliver to:{" "}
                      <strong style={{ color: c.text }}>
                        {ord.fullName || "Customer"}
                      </strong>{" "}
                      — {ord.address || "123 Coastal Way"}, {ord.city || "Hub"} {ord.pincode ? `(${ord.pincode})` : ""}
                    </div>

                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => handleGenerateInvoice(ord)}
                        title="Generate and download asynchronous PDF invoice"
                        style={{
                          backgroundColor: "rgba(16, 185, 129, 0.15)",
                          color: "#10B981",
                          border: "1px solid #10B981",
                          padding: "8px 14px",
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: "800",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          boxShadow: "0 2px 8px rgba(16, 185, 129, 0.2)",
                        }}
                      >
                        <span>📄</span>
                        <span>Download PDF Invoice</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openTracker && openTracker(ord)}
                        style={{
                          backgroundColor: "#38BDF8",
                          color: "#030712",
                          border: "none",
                          padding: "8px 16px",
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: "800",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <span>📡</span>
                        <span>Track Order</span>
                        <span style={{ position: "absolute", width: "1px", height: "1px", overflow: "hidden", clip: "rect(0,0,0,0)" }}>Track Live Telemetry</span>
                      </button>

                      {!status.toUpperCase().includes("DELIVERED") && !status.toUpperCase().includes("CANCELLED") && (
                        <button
                          type="button"
                          onClick={() => handleCancelOrder(orderId)}
                          style={{
                            backgroundColor: "transparent",
                            color: "#EF4444",
                            border: "1px solid #EF4444",
                            padding: "8px 14px",
                            borderRadius: "8px",
                            fontSize: "12px",
                            fontWeight: "800",
                            cursor: "pointer",
                          }}
                        >
                          ❌ Cancel Order
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
                </div>
              )}
            </div>
          );
        })()}

      </div>

      {/* Day 18 Celery Task Lifecycle Modal for PDF Invoices with Live Realistic Invoice */}
      <TaskProgressModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        taskId={activeTaskId}
        title={taskTitle}
        orderData={selectedInvoiceOrder}
      />

      {/* Footer */}
      <div style={{ marginTop: "60px", marginInline: "-24px", marginBottom: "-80px" }}>
        <Footer />
      </div>
    </div>
  );
}

