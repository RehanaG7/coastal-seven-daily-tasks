import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useUIStore } from "../store/useStore";

export default function Footer() {
  const theme = useUIStore((s) => s.theme);
  const openRightMenuView = useUIStore((s) => s.openRightMenuView);
  const isDark = theme === "dark";

  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (newsletterEmail && newsletterEmail.includes("@")) {
      setIsSubscribed(true);
      setTimeout(() => {
        setNewsletterEmail("");
      }, 3000);
    }
  };

  const c = {
    bg: isDark ? "#070B14" : "#F8FAFC",
    cardBg: isDark ? "#0F172A" : "#FFFFFF",
    border: isDark ? "#1E293B" : "#E2E8F0",
    borderSubtle: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
    text: isDark ? "#F8FAFC" : "#0F172A",
    subtext: isDark ? "#94A3B8" : "#64748B",
    primary: "#F59E0B",
    accent: "#38BDF8",
    purple: "#A855F7",
  };

  return (
    <footer
      style={{
        backgroundColor: c.bg,
        borderTop: `1px solid ${c.border}`,
        padding: "56px 24px 32px 24px",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        color: c.text,
        transition: "background-color 0.25s ease, border-color 0.25s ease",
      }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        {/* Top Trust & Value Pillars */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "20px",
            paddingBottom: "40px",
            borderBottom: `1px solid ${c.borderSubtle}`,
            marginBottom: "44px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                backgroundColor: isDark ? "rgba(56, 189, 248, 0.12)" : "rgba(2, 132, 199, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#38BDF8",
                fontSize: "20px",
                flexShrink: 0,
              }}
            >
              🚀
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: "800", color: c.text }}>24-48h Guaranteed Delivery</div>
              <div style={{ fontSize: "12px", color: c.subtext }}>Real-time GPS tracking & doorstep drop</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                backgroundColor: isDark ? "rgba(16, 185, 129, 0.12)" : "rgba(16, 185, 129, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#10B981",
                fontSize: "20px",
                flexShrink: 0,
              }}
            >
              🛡️
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: "800", color: c.text }}>100% Genuine & Verified</div>
              <div style={{ fontSize: "12px", color: c.subtext }}>Direct from brand-authorized distributors</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                backgroundColor: isDark ? "rgba(168, 85, 247, 0.12)" : "rgba(168, 85, 247, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#A855F7",
                fontSize: "20px",
                flexShrink: 0,
              }}
            >
              🧠
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: "800", color: c.text }}>AI Smart Assistant & RAG</div>
              <div style={{ fontSize: "12px", color: c.subtext }}>Grok & Gemini contextual recommendations</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                backgroundColor: isDark ? "rgba(245, 158, 11, 0.12)" : "rgba(217, 119, 6, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#F59E0B",
                fontSize: "20px",
                flexShrink: 0,
              }}
            >
              🔒
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: "800", color: c.text }}>PCI-DSS Level 1 Secure</div>
              <div style={{ fontSize: "12px", color: c.subtext }}>256-Bit SSL end-to-end tokenized checkout</div>
            </div>
          </div>
        </div>

        {/* Main Footer Content Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "36px",
            marginBottom: "44px",
          }}
        >
          {/* Brand Info & Newsletter */}
          <div style={{ gridColumn: "span 1" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "900",
                  color: "#0F172A",
                  fontSize: "18px",
                }}
              >
                ⚡
              </div>
              <span style={{ fontSize: "20px", fontWeight: "900", letterSpacing: "-0.5px" }}>
                R-MART SUPERSTORE
              </span>
            </div>
            <p style={{ color: c.subtext, fontSize: "13px", lineHeight: 1.6, margin: "0 0 18px 0" }}>
              Next-generation 3D eCommerce hypermarket powered by AI vector retrieval, Redis-backed sub-3ms caching, and Celery background order pipelines.
            </p>

            {/* Newsletter Subscription */}
            <div style={{ marginTop: "16px" }}>
              <div style={{ fontSize: "12px", fontWeight: "800", color: c.text, marginBottom: "8px" }}>
                📩 Subscribe for exclusive deals & AI drops
              </div>
              {isSubscribed ? (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "10px",
                    backgroundColor: "rgba(16, 185, 129, 0.15)",
                    color: "#10B981",
                    fontSize: "12px",
                    fontWeight: "700",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                  }}
                >
                  ✓ You're subscribed! Check your inbox for 15% off coupon.
                </div>
              ) : (
                <form onSubmit={handleSubscribe} style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    style={{
                      flex: 1,
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: `1px solid ${c.border}`,
                      backgroundColor: c.cardBg,
                      color: c.text,
                      fontSize: "13px",
                      outline: "none",
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      padding: "9px 16px",
                      borderRadius: "8px",
                      backgroundColor: "#38BDF8",
                      color: "#0F172A",
                      border: "none",
                      fontSize: "13px",
                      fontWeight: "800",
                      cursor: "pointer",
                      transition: "opacity 0.2s",
                    }}
                  >
                    Join
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Shop Categories */}
          <div>
            <h4 style={{ fontSize: "13px", fontWeight: "900", letterSpacing: "0.5px", marginBottom: "16px", color: c.text }}>
              SHOP CATEGORIES
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
              {["Mobiles & Smartphones", "Electronics & Audio", "Laptops & Computing", "Fresh Groceries & Pantry", "Fashion & Luxury", "Gaming & Consoles"].map((cat) => (
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

          {/* Customer Support */}
          <div>
            <h4 style={{ fontSize: "13px", fontWeight: "900", letterSpacing: "0.5px", marginBottom: "16px", color: c.text }}>
              CUSTOMER CARE & BOT
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
              <li>
                <button
                  onClick={() => openRightMenuView("support")}
                  style={{ background: "none", border: "none", padding: 0, color: c.subtext, cursor: "pointer", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <span>🤖</span> 24/7 AI Shopping Concierge
                </button>
              </li>
              <li>
                <button
                  onClick={() => openRightMenuView("orders")}
                  style={{ background: "none", border: "none", padding: 0, color: c.subtext, cursor: "pointer", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <span>📦</span> Live Order & Shipment Tracker
                </button>
              </li>
              <li>
                <button
                  onClick={() => openRightMenuView("inbox")}
                  style={{ background: "none", border: "none", padding: 0, color: c.subtext, cursor: "pointer", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <span>🔔</span> Celery Push Notifications
                </button>
              </li>
              <li>
                <span style={{ color: c.subtext, display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>↩️</span> 7-Day Instant Doorstep Returns
                </span>
              </li>
              <li>
                <span style={{ color: c.subtext, display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>🛡️</span> Zero-Risk Buyer Protection
                </span>
              </li>
            </ul>
          </div>

          {/* Architecture & Tech Stack */}
          <div>
            <h4 style={{ fontSize: "13px", fontWeight: "900", letterSpacing: "0.5px", marginBottom: "16px", color: c.text }}>
              TECH STACK & SECURITY
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px", color: c.subtext }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "#38BDF8" }}>⚡</span> FastAPI Backend & Async Endpoints
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "#EF4444" }}>🟥</span> Redis In-Memory Cart & Rate Limiter
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "#10B981" }}>🐘</span> PostgreSQL GIN Full-Text & Trigrams
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "#A855F7" }}>🧠</span> ChromaDB Embeddings & Vector Search
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "#F59E0B" }}>⚙️</span> Celery Distributed Async Task Workers
              </div>
            </div>

            {/* Payment Logos Pill Bar */}
            <div style={{ marginTop: "18px" }}>
              <div style={{ fontSize: "11px", fontWeight: "800", color: c.subtext, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Supported Payment Methods
              </div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                {["VISA", "MC", "AMEX", "UPI", "APPLE PAY", "GPAY", "COD"].map((pay) => (
                  <span
                    key={pay}
                    style={{
                      padding: "3px 7px",
                      borderRadius: "6px",
                      backgroundColor: isDark ? "#1E293B" : "#E2E8F0",
                      color: isDark ? "#CBD5E1" : "#334155",
                      fontSize: "10px",
                      fontWeight: "800",
                      letterSpacing: "0.5px",
                      border: `1px solid ${isDark ? "#334155" : "#CBD5E1"}`,
                    }}
                  >
                    {pay}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Legal Bar */}
        <div
          style={{
            paddingTop: "24px",
            borderTop: `1px solid ${c.borderSubtle}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            fontSize: "12px",
            color: c.subtext,
          }}
        >
          <div>
            © 2026 <strong>R-MART Superstore Global Inc.</strong> All rights reserved. Designed with modern UX & AI Intelligence.
          </div>
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            <span style={{ cursor: "pointer", transition: "color 0.15s" }}>Privacy Policy</span>
            <span style={{ cursor: "pointer", transition: "color 0.15s" }}>Terms of Service</span>
            <span style={{ cursor: "pointer", transition: "color 0.15s" }}>Security Architecture</span>
            <span style={{ cursor: "pointer", transition: "color 0.15s" }}>AI Ethics & Transparency</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
