import React, { useState } from "react";
import { useStore } from "../context/StoreContext";

export default function SupportPage() {
  const { theme, tickets, addTicket } = useStore();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const isDark = theme === "dark";

  const c = {
    bg: isDark ? "#06080F" : "#F8FAFC",
    cardBg: isDark ? "#0F1420" : "#FFFFFF",
    border: isDark ? "#1E2738" : "#E2E8F0",
    text: isDark ? "#FFFFFF" : "#0F172A",
    subtext: isDark ? "#94A3B8" : "#64748B",
    inputBg: isDark ? "#070A10" : "#F1F5F9",
    accent: "#F59E0B",
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!subject || !message) return;
    addTicket(subject, message);
    setSubject("");
    setMessage("");
  };

  return (
    <div style={{ backgroundColor: c.bg, minHeight: "calc(100vh - 64px)", padding: "32px 24px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "900", color: c.text, margin: "0 0 6px 0" }}>
          Customer Support & Tickets
        </h1>
        <p style={{ color: c.subtext, fontSize: "14px", marginBottom: "24px" }}>
          Communicate directly with R-Mart administrators.
        </p>

        {/* Raise Ticket Form */}
        <form onSubmit={handleSubmit} style={{
          backgroundColor: c.cardBg,
          border: `1px solid ${c.border}`,
          borderRadius: "14px",
          padding: "20px",
          marginBottom: "28px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}>
          <h3 style={{ margin: 0, fontSize: "16px", color: c.text, fontWeight: "800" }}>Raise a Support Ticket</h3>
          <input
            type="text"
            required
            placeholder="Subject (e.g. Order Delivery Status, Refund Request)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              border: `1px solid ${c.border}`,
              backgroundColor: c.inputBg,
              color: c.text,
              fontSize: "14px",
            }}
          />
          <textarea
            required
            rows="3"
            placeholder="Describe your issue in detail..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              border: `1px solid ${c.border}`,
              backgroundColor: c.inputBg,
              color: c.text,
              fontSize: "14px",
            }}
          />
          <button
            type="submit"
            style={{
              alignSelf: "flex-start",
              backgroundColor: c.accent,
              color: "#000",
              fontWeight: "900",
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Submit Ticket
          </button>
        </form>

        {/* Active Tickets List */}
        <h3 style={{ fontSize: "18px", fontWeight: "800", color: c.text, marginBottom: "14px" }}>
          Your Active Tickets
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {tickets.map((t) => (
            <div
              key={t.id}
              style={{
                backgroundColor: c.cardBg,
                border: `1px solid ${c.border}`,
                borderRadius: "12px",
                padding: "16px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontWeight: "800", color: c.text }}>{t.subject} (From: {t.user})</span>
                <span style={{ color: c.accent, fontWeight: "bold", fontSize: "12px" }}>{t.status}</span>
              </div>
              <p style={{ margin: "0 0 8px 0", fontSize: "13px", color: c.subtext }}>{t.message}</p>
              <span style={{ fontSize: "11px", color: c.subtext }}>Ticket #{t.id} • {t.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
