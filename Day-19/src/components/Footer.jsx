import React from "react";
import { Link } from "react-router-dom";
import { useUIStore } from "../store/useStore";

export default function Footer() {
  const theme = useUIStore((s) => s.theme);
  const openRightMenuView = useUIStore((s) => s.openRightMenuView);
  const isDark = theme === "dark";

  const c = {
    bg: isDark ? "#050811" : "#F1F5F9",
    border: isDark ? "#1E293B" : "#CBD5E1",
    text: isDark ? "#F8FAFC" : "#0F172A",
    subtext: isDark ? "#94A3B8" : "#64748B",
    primary: "#F59E0B",
    accent: "#38BDF8",
  };

  return (
    <footer
      style={{
        backgroundColor: c.bg,
        borderTop: `1px solid ${c.border}`,
        padding: "48px 24px 28px 24px",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        color: c.text,
        transition: "background-color 0.25s ease, border-color 0.25s ease",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "36px",
          marginBottom: "40px",
        }}
      >
        {/* Column 1: Brand Info & Guarantees */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <span style={{ fontSize: "24px", color: c.primary }}>⚡</span>
            <span style={{ fontSize: "20px", fontWeight: "900", letterSpacing: "-0.5px" }}>
              R - M A R T
            </span>
          </div>
          <p style={{ color: c.subtext, fontSize: "13px", lineHeight: 1.6, margin: "0 0 16px 0" }}>
            Next-generation 3D hypermarket offering verified electronics, fresh gourmet groceries, tech apparel, and home essentials with guaranteed 24-48 hour delivery.
          </p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <span
              style={{
                backgroundColor: "rgba(16, 185, 129, 0.15)",
                color: "#10B981",
                fontSize: "11px",
                fontWeight: "800",
                padding: "4px 10px",
                borderRadius: "12px",
              }}
            >
              ✓ 100% Genuine
            </span>
            <span
              style={{
                backgroundColor: "rgba(56, 189, 248, 0.15)",
                color: "#38BDF8",
                fontSize: "11px",
                fontWeight: "800",
                padding: "4px 10px",
                borderRadius: "12px",
              }}
            >
              🚀 24-48h Delivery
            </span>
            <span
              style={{
                backgroundColor: "rgba(245, 158, 11, 0.15)",
                color: "#F59E0B",
                fontSize: "11px",
                fontWeight: "800",
                padding: "4px 10px",
                borderRadius: "12px",
              }}
            >
              ⏳ Pay Later (0% APR)
            </span>
          </div>
        </div>

        {/* Column 2: Popular Categories */}
        <div>
          <h4 style={{ fontSize: "14px", fontWeight: "900", marginBottom: "16px", color: c.text }}>
            TOP CATEGORIES
          </h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
            {["Mobiles and Electronics", "Deals and Savings", "Fashion", "Home and Furniture", "Groceries and Pet Supplies", "Games and Live Shopping"].map((cat) => (
              <li key={cat}>
                <Link
                  to="/catalog"
                  style={{ color: c.subtext, textDecoration: "none", transition: "color 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = c.accent)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = c.subtext)}
                >
                  {cat}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3: Customer Care & Support */}
        <div>
          <h4 style={{ fontSize: "14px", fontWeight: "900", marginBottom: "16px", color: c.text }}>
            CUSTOMER SUPPORT
          </h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
            <li>
              <button
                onClick={() => openRightMenuView("support")}
                style={{ background: "none", border: "none", padding: 0, color: c.subtext, cursor: "pointer", fontSize: "13px" }}
              >
                🤖 24/7 R-Bot AI Smart Assistant
              </button>
            </li>
            <li>
              <button
                onClick={() => openRightMenuView("orders")}
                style={{ background: "none", border: "none", padding: 0, color: c.subtext, cursor: "pointer", fontSize: "13px" }}
              >
                📦 Live Order Tracker
              </button>
            </li>
            <li>
              <button
                onClick={() => openRightMenuView("inbox")}
                style={{ background: "none", border: "none", padding: 0, color: c.subtext, cursor: "pointer", fontSize: "13px" }}
              >
                🔔 Celery Background Notifications
              </button>
            </li>
            <li>
              <span style={{ color: c.subtext }}>
                ↩️ 7-Day Doorstep Return & Refund Policy
              </span>
            </li>
          </ul>
        </div>

        {/* Column 4: System Architecture & Security */}
        <div>
          <h4 style={{ fontSize: "14px", fontWeight: "900", marginBottom: "16px", color: c.text }}>
            SECURE CHECKOUT & STACK
          </h4>
          <p style={{ color: c.subtext, fontSize: "12px", lineHeight: 1.6, margin: "0 0 14px 0" }}>
            Powered by FastAPI, Redis cart caching, Celery asynchronous workers, and TanStack React Query.
          </p>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", fontSize: "18px" }}>
            <span title="UPI Instant Payments">⚡ UPI</span>
            <span title="Visa Cards">💳 Visa</span>
            <span title="Mastercard">💳 Mastercard</span>
            <span title="R-Mart Pay Later">⏳ Pay Later</span>
            <span title="Cash on Delivery">💵 COD</span>
          </div>
        </div>
      </div>

      {/* Bottom Copyright Bar */}
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          paddingTop: "20px",
          borderTop: `1px solid ${c.border}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          fontSize: "12px",
          color: c.subtext,
        }}
      >
        <div>
          © 2026 <strong>R-MART Superstore Inc.</strong> All rights reserved.
        </div>
        <div style={{ display: "flex", gap: "20px" }}>
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <span>Security Architecture</span>
        </div>
      </div>
    </footer>
  );
}
