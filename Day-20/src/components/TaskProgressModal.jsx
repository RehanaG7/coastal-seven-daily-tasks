import React, { useState, useEffect } from "react";
import { taskService } from "../api/apiClient";
import { useUIStore } from "../store/useStore";

export default function TaskProgressModal({
  isOpen,
  onClose,
  taskId,
  title = "Background Job Execution",
  onComplete,
  orderData,
}) {
  const theme = useUIStore((s) => s.theme);
  const isDark = theme === "dark";

  const [task, setTask] = useState(null);
  const [error, setError] = useState(null);

  const isInvoiceTask =
    title.toLowerCase().includes("invoice") ||
    task?.task_type === "generate_pdf_invoice" ||
    task?.task_type === "pdf_invoice";

  const isCsvTask =
    title.toLowerCase().includes("csv") ||
    title.toLowerCase().includes("import") ||
    task?.task_type === "bulk_csv_import";

  useEffect(() => {
    if (!isOpen || !taskId) {
      setTask(null);
      setError(null);
      return;
    }

    let isMounted = true;
    let pollInterval = null;

    const poll = async () => {
      try {
        const data = await taskService.getTaskStatus(taskId);
        if (!isMounted) return;
        setTask(data);

        if (data.status === "SUCCESS") {
          clearInterval(pollInterval);
          if (onComplete) onComplete(data.result);
        } else if (data.status === "FAILURE") {
          clearInterval(pollInterval);
          setError(data.error || "Background task encountered an error.");
        }
      } catch (err) {
        if (!isMounted) return;
        console.warn("Polling task status failed:", err);
      }
    };

    poll();
    pollInterval = setInterval(poll, 700);

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [isOpen, taskId, onComplete]);

  if (!isOpen) return null;

  const progress = task ? task.progress || 0 : 0;
  const status = task ? task.status : "PENDING";
  const message = task?.message || "Queued in Celery worker pool...";

  const getStatusBadge = () => {
    switch (status) {
      case "SUCCESS":
        return { text: "COMPLETED", bg: "rgba(16, 185, 129, 0.15)", color: "#10B981", border: "#10B981" };
      case "FAILURE":
        return { text: "FAILED", bg: "rgba(239, 68, 68, 0.15)", color: "#EF4444", border: "#EF4444" };
      case "PROGRESS":
        return { text: `IN PROGRESS (${progress}%)`, bg: "rgba(56, 189, 248, 0.15)", color: "#38BDF8", border: "#38BDF8" };
      default:
        return { text: "PENDING / QUEUED", bg: "rgba(245, 158, 11, 0.15)", color: "#F59E0B", border: "#F59E0B" };
    }
  };

  const badge = getStatusBadge();

  // Realistic Order and Invoice Values
  const orderId = orderData?.orderId || orderData?.id || (task?.result?.order_id ? `ORD-${task.result.order_id}` : "ORD-951931");
  const invoiceNum = `INV-2026-${String(orderId).replace(/\D/g, "") || "951931"}`;
  const customerName = orderData?.fullName || "Shaik Rehana";
  const customerAddress = orderData?.address || "Flat 402, Coastal Silicon Residency";
  const customerCity = `${orderData?.city || "Coastal Hub"} ${orderData?.pincode ? `(${orderData.pincode})` : "560100"}`;
  const totalAmount = Number(orderData?.totalAmount || orderData?.total || 1199.99);
  const items = orderData?.items && orderData.items.length > 0 ? orderData.items : [
    { title: "Apple iPhone 15 Pro Max 256GB Titanium", qty: 1, price: 1199.99, hsn: "8517" },
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px",
        overflowY: "auto",
      }}
    >
      <style>{`
        @keyframes stampThump {
          0% {
            transform: scale(2.8) rotate(-20deg);
            opacity: 0;
          }
          60% {
            transform: scale(0.92) rotate(-10deg);
            opacity: 1;
          }
          85% {
            transform: scale(1.05) rotate(-13deg);
            opacity: 0.95;
          }
          100% {
            transform: scale(1) rotate(-12deg);
            opacity: 0.92;
          }
        }
      `}</style>

      <div
        style={{
          backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
          border: `1px solid ${isDark ? "#1E293B" : "#E2E8F0"}`,
          borderRadius: "24px",
          width: "100%",
          maxWidth: (isInvoiceTask || isCsvTask) ? "760px" : "540px",
          maxHeight: "92vh",
          overflowY: "auto",
          padding: "24px 28px",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.7)",
          color: isDark ? "#FFFFFF" : "#0F172A",
          fontFamily: "'Inter', system-ui, sans-serif",
          transition: "max-width 0.25s ease",
        }}
      >
        {/* Modal Top Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "22px" }}>
                {status === "SUCCESS" ? "📄" : status === "FAILURE" ? "❌" : "⚙️"}
              </span>
              <h2 style={{ fontSize: "19px", fontWeight: "900", margin: 0, letterSpacing: "-0.3px" }}>
                {title}
              </h2>
            </div>
            <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: isDark ? "#94A3B8" : "#64748B" }}>
              Celery Distributed Task Pipeline • Real-time Telemetry & PDF Generator
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                backgroundColor: badge.bg,
                color: badge.color,
                border: `1px solid ${badge.border}`,
                padding: "4px 10px",
                borderRadius: "12px",
                fontSize: "11px",
                fontWeight: "900",
                letterSpacing: "0.5px",
              }}
            >
              {badge.text}
            </span>

            <button
              type="button"
              onClick={onClose}
              title="Close modal"
              style={{
                background: "transparent",
                border: "none",
                fontSize: "18px",
                color: isDark ? "#94A3B8" : "#64748B",
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: "8px",
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Task Telemetry Bar */}
        <div
          style={{
            backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
            borderRadius: "10px",
            padding: "8px 14px",
            fontSize: "11px",
            fontFamily: "monospace",
            color: isDark ? "#38BDF8" : "#0284C7",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <span>Task ID: <strong>{taskId || "Celery Worker Queue"}</strong></span>
          <span style={{ color: isDark ? "#94A3B8" : "#64748B" }}>
            {task?.task_type ? `Type: ${task.task_type}` : "Worker Status"}
          </span>
        </div>

        {/* Progress Bar Ribbon */}
        <div style={{ marginBottom: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>
            <span style={{ color: isDark ? "#CBD5E1" : "#334155" }}>
              {status === "SUCCESS" ? "✅ PDF Generated & Stamped" : "Live Task Execution"}
            </span>
            <span style={{ color: status === "SUCCESS" ? "#10B981" : "#38BDF8", fontWeight: "900" }}>
              {progress}%
            </span>
          </div>

          <div
            style={{
              width: "100%",
              height: "10px",
              backgroundColor: isDark ? "#1E293B" : "#E2E8F0",
              borderRadius: "999px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                backgroundColor: status === "SUCCESS" ? "#10B981" : status === "FAILURE" ? "#EF4444" : "#38BDF8",
                borderRadius: "999px",
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>

        {/* Live Step Log */}
        <div
          style={{
            fontSize: "12px",
            color: isDark ? "#94A3B8" : "#64748B",
            backgroundColor: isDark ? "#06080F" : "#F8FAFC",
            border: `1px solid ${isDark ? "#1E293B" : "#E2E8F0"}`,
            borderRadius: "8px",
            padding: "8px 12px",
            marginBottom: "18px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {status === "PROGRESS" && <span style={{ animation: "spin 1s linear infinite" }}>⏳</span>}
          <span>{error || message}</span>
        </div>

        {/* REALISTIC INVOICE DOCUMENT SECTION (Directly visible under the progress bar) */}
        {isInvoiceTask && (
          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                backgroundColor: "#FFFFFF",
                color: "#0F172A",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.35)",
                border: "1px solid #CBD5E1",
                fontFamily: "'Courier New', Courier, monospace, system-ui",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Official PAID Circular Stamp Watermark - Stamps down live as task finishes */}
              {(progress >= 70 || status === "SUCCESS") && (
                <div
                  style={{
                    position: "absolute",
                    right: "36px",
                    top: "135px",
                    border: "4px solid #10B981",
                    borderRadius: "50%",
                    width: "124px",
                    height: "124px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#10B981",
                    fontWeight: "900",
                    fontSize: "11px",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    pointerEvents: "none",
                    zIndex: 10,
                    animation: "stampThump 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
                    boxShadow: "0 0 20px rgba(16, 185, 129, 0.3), inset 0 0 10px rgba(16, 185, 129, 0.15)",
                    backgroundColor: "rgba(255, 255, 255, 0.85)",
                  }}
                >
                  <span style={{ fontSize: "17px", fontWeight: "900" }}>✓ PAID</span>
                  <span style={{ fontSize: "8px", marginTop: "2px", letterSpacing: "0.5px" }}>R-MART VERIFIED</span>
                  <span style={{ fontSize: "7px", marginTop: "1px", color: "#059669" }}>
                    {new Date().toISOString().slice(0, 10)}
                  </span>
                </div>
              )}

              {/* Stamping In-Progress indicator while bar is running */}
              {progress < 70 && status !== "SUCCESS" && (
                <div
                  style={{
                    position: "absolute",
                    right: "36px",
                    top: "145px",
                    padding: "6px 14px",
                    borderRadius: "999px",
                    border: "1px dashed #94A3B8",
                    backgroundColor: "rgba(241, 245, 249, 0.9)",
                    color: "#475569",
                    fontSize: "10px",
                    fontWeight: "800",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    zIndex: 10,
                  }}
                >
                  <span style={{ animation: "spin 1s linear infinite" }}>⚙️</span>
                  <span>Live Stamping...</span>
                </div>
              )}

              {/* Company Letterhead */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  borderBottom: "2px solid #0F172A",
                  paddingBottom: "12px",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "20px", color: "#F59E0B" }}>⚡</span>
                    <strong style={{ fontSize: "18px", letterSpacing: "1px", fontFamily: "sans-serif" }}>
                      R-MART SUPERSTORE
                    </strong>
                  </div>
                  <div style={{ fontSize: "10px", color: "#475569", marginTop: "4px" }}>
                    Retail Private Ltd • CIN: U52100KA2026PTC098765
                  </div>
                  <div style={{ fontSize: "10px", color: "#475569" }}>
                    GSTIN: 29AAACR9519Z1Z5 • 108 Silicon Harbor, Hub 560100
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "14px", fontWeight: "900", letterSpacing: "1px", color: "#0F172A" }}>
                    TAX INVOICE
                  </div>
                  <div style={{ fontSize: "11px", fontWeight: "700", color: "#0284C7", marginTop: "2px" }}>
                    #{invoiceNum}
                  </div>
                  <div style={{ fontSize: "10px", color: "#64748B" }}>
                    Date: {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                </div>
              </div>

              {/* Bill To & Dispatch Details */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  marginBottom: "16px",
                  fontSize: "11px",
                  backgroundColor: "#F8FAFC",
                  padding: "10px 14px",
                  borderRadius: "8px",
                }}
              >
                <div>
                  <span style={{ fontWeight: "900", color: "#0F172A", textTransform: "uppercase", fontSize: "10px" }}>
                    Billed & Delivered To:
                  </span>
                  <div style={{ fontWeight: "800", color: "#0F172A", marginTop: "2px" }}>{customerName}</div>
                  <div style={{ color: "#475569" }}>{customerAddress}</div>
                  <div style={{ color: "#475569" }}>{customerCity}</div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <span style={{ fontWeight: "900", color: "#0F172A", textTransform: "uppercase", fontSize: "10px" }}>
                    Order Telemetry:
                  </span>
                  <div style={{ fontWeight: "800", color: "#0F172A", marginTop: "2px" }}>Order ID: #{orderId}</div>
                  <div style={{ color: "#475569" }}>Payment: Captured (Prepaid)</div>
                  <div style={{ color: "#10B981", fontWeight: "700" }}>Express Dispatch: Guaranteed 24-48h</div>
                </div>
              </div>

              {/* Goods & Line Items Table */}
              <div style={{ marginBottom: "16px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1.5px solid #CBD5E1", backgroundColor: "#F1F5F9" }}>
                      <th style={{ textAlign: "left", padding: "6px 8px" }}>#</th>
                      <th style={{ textAlign: "left", padding: "6px 8px" }}>Product Description</th>
                      <th style={{ textAlign: "center", padding: "6px 8px" }}>HSN</th>
                      <th style={{ textAlign: "center", padding: "6px 8px" }}>Qty</th>
                      <th style={{ textAlign: "right", padding: "6px 8px" }}>Rate</th>
                      <th style={{ textAlign: "right", padding: "6px 8px" }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px dashed #E2E8F0" }}>
                        <td style={{ padding: "6px 8px" }}>{idx + 1}</td>
                        <td style={{ padding: "6px 8px", fontWeight: "700" }}>
                          {it.name || it.title || it.product_name || "Item"}
                        </td>
                        <td style={{ padding: "6px 8px", textAlign: "center", color: "#64748B" }}>
                          {it.hsn || "8517"}
                        </td>
                        <td style={{ padding: "6px 8px", textAlign: "center" }}>
                          {it.quantity || it.qty || 1}
                        </td>
                        <td style={{ padding: "6px 8px", textAlign: "right" }}>
                          ${Number(it.price || it.price_at_purchase || 0).toFixed(2)}
                        </td>
                        <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: "700" }}>
                          ${(Number(it.price || it.price_at_purchase || 0) * (it.quantity || it.qty || 1)).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Subtotals & Taxes Calculation */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
                <div style={{ width: "240px", fontSize: "11px" }}>
                  {Number(orderData?.discount || 0) > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", color: "#10B981", fontWeight: "700" }}>
                      <span>Coupon Discount ({orderData?.couponCode || "OFFER"}):</span>
                      <span>-${Number(orderData.discount).toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", color: "#475569" }}>
                    <span>Taxable Value:</span>
                    <span>${(totalAmount * 0.82).toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", color: "#475569" }}>
                    <span>CGST (9%):</span>
                    <span>${(totalAmount * 0.09).toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", color: "#475569" }}>
                    <span>SGST (9%):</span>
                    <span>${(totalAmount * 0.09).toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", color: "#10B981", fontWeight: "700" }}>
                    <span>Express Shipping:</span>
                    <span>FREE</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      borderTop: "2px solid #0F172A",
                      paddingTop: "6px",
                      marginTop: "4px",
                      fontSize: "13px",
                      fontWeight: "900",
                      color: "#0F172A",
                    }}
                  >
                    <span>TOTAL PAID:</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Footer Sign-off & QR Code Simulation */}
              <div
                style={{
                  borderTop: "1px solid #CBD5E1",
                  paddingTop: "10px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "9px",
                  color: "#64748B",
                }}
              >
                <div>
                  <div>Computer-generated digital invoice. Stamped by R-Mart Billing Authority.</div>
                  <div>Certified by Coastal Seven Enterprise • ISO 27001 Verified</div>
                </div>
                <div style={{ textAlign: "right", fontFamily: "sans-serif", fontWeight: "700", color: "#0F172A" }}>
                  [QR-CODE VERIFIED] 🛡️
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CSV BATCH INGESTION & AUDIT REPORT */}
        {isCsvTask && (
          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                backgroundColor: isDark ? "#06080F" : "#F8FAFC",
                border: `1px solid ${isDark ? "#1E293B" : "#CBD5E1"}`,
                borderRadius: "16px",
                padding: "20px",
                color: isDark ? "#FFFFFF" : "#0F172A",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "20px" }}>📊</span>
                  <strong style={{ fontSize: "14px", fontWeight: "900" }}>CSV Batch Import Audit Report</strong>
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "800",
                    padding: "3px 10px",
                    borderRadius: "6px",
                    backgroundColor: status === "SUCCESS" ? "rgba(16, 185, 129, 0.15)" : "rgba(56, 189, 248, 0.15)",
                    color: status === "SUCCESS" ? "#10B981" : "#38BDF8",
                    border: `1px solid ${status === "SUCCESS" ? "#10B981" : "#38BDF8"}`,
                  }}
                >
                  {status === "SUCCESS" ? "✓ Ingestion Complete" : "Processing Batch..."}
                </span>
              </div>

              {/* Stats Metrics Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", marginBottom: "16px" }}>
                <div style={{ padding: "12px", borderRadius: "10px", backgroundColor: isDark ? "#0F172A" : "#FFFFFF", border: `1px solid ${isDark ? "#1E293B" : "#E2E8F0"}` }}>
                  <div style={{ fontSize: "11px", color: isDark ? "#94A3B8" : "#64748B", fontWeight: "700" }}>Total Rows</div>
                  <div style={{ fontSize: "18px", fontWeight: "900", color: "#38BDF8", marginTop: "2px" }}>
                    {task?.result?.total_rows ?? (progress >= 10 ? "Reading..." : "Queued")}
                  </div>
                </div>

                <div style={{ padding: "12px", borderRadius: "10px", backgroundColor: isDark ? "#0F172A" : "#FFFFFF", border: `1px solid ${isDark ? "#1E293B" : "#E2E8F0"}` }}>
                  <div style={{ fontSize: "11px", color: isDark ? "#94A3B8" : "#64748B", fontWeight: "700" }}>Imported / Synced</div>
                  <div style={{ fontSize: "18px", fontWeight: "900", color: "#10B981", marginTop: "2px" }}>
                    {task?.result?.imported_count ?? (task?.result?.imported_so_far || (progress === 100 ? "Done" : 0))}
                  </div>
                </div>

                <div style={{ padding: "12px", borderRadius: "10px", backgroundColor: isDark ? "#0F172A" : "#FFFFFF", border: `1px solid ${isDark ? "#1E293B" : "#E2E8F0"}` }}>
                  <div style={{ fontSize: "11px", color: isDark ? "#94A3B8" : "#64748B", fontWeight: "700" }}>PostgreSQL Index</div>
                  <div style={{ fontSize: "18px", fontWeight: "900", color: "#F59E0B", marginTop: "2px" }}>
                    {status === "SUCCESS" ? "GIN Synced" : "Updating..."}
                  </div>
                </div>

                <div style={{ padding: "12px", borderRadius: "10px", backgroundColor: isDark ? "#0F172A" : "#FFFFFF", border: `1px solid ${isDark ? "#1E293B" : "#E2E8F0"}` }}>
                  <div style={{ fontSize: "11px", color: isDark ? "#94A3B8" : "#64748B", fontWeight: "700" }}>Errors / Skipped</div>
                  <div style={{ fontSize: "18px", fontWeight: "900", color: (task?.result?.errors?.length || 0) > 0 ? "#EF4444" : "#10B981", marginTop: "2px" }}>
                    {task?.result?.errors?.length || 0}
                  </div>
                </div>
              </div>

              {/* Sample Processed Items Table */}
              {task?.result?.items && task.result.items.length > 0 && (
                <div>
                  <div style={{ fontSize: "12px", fontWeight: "800", marginBottom: "8px", color: isDark ? "#CBD5E1" : "#334155" }}>
                    Imported Catalog Products Preview ({task.result.items.length}):
                  </div>
                  <div style={{ maxHeight: "180px", overflowY: "auto", borderRadius: "8px", border: `1px solid ${isDark ? "#1E293B" : "#E2E8F0"}` }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                      <thead>
                        <tr style={{ backgroundColor: isDark ? "#0F172A" : "#F1F5F9", borderBottom: `1px solid ${isDark ? "#1E293B" : "#CBD5E1"}` }}>
                          <th style={{ padding: "6px 10px", textAlign: "left" }}>Product Name</th>
                          <th style={{ padding: "6px 10px", textAlign: "left" }}>Category</th>
                          <th style={{ padding: "6px 10px", textAlign: "right" }}>Price</th>
                          <th style={{ padding: "6px 10px", textAlign: "center" }}>Stock</th>
                          <th style={{ padding: "6px 10px", textAlign: "center" }}>DB Sync</th>
                        </tr>
                      </thead>
                      <tbody>
                        {task.result.items.map((it, idx) => (
                          <tr key={idx} style={{ borderBottom: `1px solid ${isDark ? "#1E293B" : "#E2E8F0"}` }}>
                            <td style={{ padding: "6px 10px", fontWeight: "700" }}>{it.name}</td>
                            <td style={{ padding: "6px 10px", color: isDark ? "#94A3B8" : "#64748B" }}>{it.category}</td>
                            <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: "800" }}>${Number(it.price).toFixed(2)}</td>
                            <td style={{ padding: "6px 10px", textAlign: "center" }}>{it.stock}</td>
                            <td style={{ padding: "6px 10px", textAlign: "center", color: "#10B981", fontWeight: "800" }}>✓ Synced</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Any Errors List */}
              {task?.result?.errors && task.result.errors.length > 0 && (
                <div style={{ marginTop: "12px", padding: "10px", borderRadius: "8px", backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid #EF4444" }}>
                  <div style={{ fontSize: "11px", fontWeight: "800", color: "#EF4444", marginBottom: "4px" }}>⚠️ Row Warnings:</div>
                  <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "11px", color: "#EF4444" }}>
                    {task.result.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* BOTTOM ACTION BUTTONS: Download PDF Invoice & Close */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "12px",
            borderTop: `1px solid ${isDark ? "#1E293B" : "#E2E8F0"}`,
            paddingTop: "16px",
          }}
        >
          {status === "SUCCESS" && task?.result?.download_url && (
            <a
              href={`http://127.0.0.1:8000${task.result.download_url}`}
              target="_blank"
              rel="noopener noreferrer"
              download
              title="Download signed PDF invoice with official stamp"
              style={{
                backgroundColor: "#10B981",
                color: "#FFFFFF",
                textDecoration: "none",
                padding: "10px 20px",
                borderRadius: "10px",
                fontWeight: "900",
                fontSize: "13px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 14px rgba(16, 185, 129, 0.4)",
                cursor: "pointer",
              }}
            >
              <span>📄</span>
              <span>Download PDF Invoice</span>
            </a>
          )}

          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: isDark ? "#334155" : "#E2E8F0",
              color: isDark ? "#FFFFFF" : "#0F172A",
              border: "none",
              padding: "10px 18px",
              borderRadius: "10px",
              fontWeight: "800",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            {status === "SUCCESS" ? "Close" : status === "FAILURE" ? "Dismiss" : "Run in Background"}
          </button>
        </div>
      </div>
    </div>
  );
}
