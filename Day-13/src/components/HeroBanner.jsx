import React from "react";

export default function HeroBanner({ onShopClick }) {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #0F172A 100%)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "20px",
        padding: "48px 36px",
        margin: "0 auto 36px auto",
        maxWidth: "1240px",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "24px",
        boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.5)",
      }}
    >
      <div style={{ flex: "1 1 500px" }}>
        <div
          style={{
            display: "inline-block",
            backgroundColor: "rgba(245, 158, 11, 0.15)",
            border: "1px solid rgba(245, 158, 11, 0.4)",
            color: "#F59E0B",
            fontWeight: "800",
            fontSize: "12px",
            letterSpacing: "1px",
            textTransform: "uppercase",
            padding: "6px 14px",
            borderRadius: "999px",
            marginBottom: "16px",
          }}
        >
          ⚡ Autumn 2026 Tech Drops
        </div>
        <h1
          style={{
            fontSize: "36px",
            fontWeight: "900",
            color: "#FFFFFF",
            lineHeight: 1.2,
            margin: "0 0 14px 0",
            letterSpacing: "-0.5px",
          }}
        >
          Next-Gen Hardware & <br />
          <span style={{ color: "#60A5FA" }}>Instant Local Dispatch.</span>
        </h1>
        <p
          style={{
            fontSize: "15px",
            color: "#94A3B8",
            margin: "0 0 24px 0",
            lineHeight: 1.6,
            maxWidth: "480px",
          }}
        >
          From mechanical switches to studio audio — authentic inventory verified in real time, packed and delivered directly from our automated local hub.
        </p>
        <button
          onClick={onShopClick}
          style={{
            backgroundColor: "#F59E0B",
            color: "#000000",
            border: "none",
            padding: "12px 28px",
            borderRadius: "10px",
            fontWeight: "900",
            fontSize: "14px",
            cursor: "pointer",
            boxShadow: "0 4px 15px rgba(245, 158, 11, 0.4)",
          }}
        >
          Explore Catalog ↓
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            padding: "20px 24px",
            borderRadius: "14px",
            textAlign: "center",
            minWidth: "130px",
          }}
        >
          <div style={{ fontSize: "24px", fontWeight: "900", color: "#10B981" }}>15m</div>
          <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "4px" }}>Express Delivery</div>
        </div>
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            padding: "20px 24px",
            borderRadius: "14px",
            textAlign: "center",
            minWidth: "130px",
          }}
        >
          <div style={{ fontSize: "24px", fontWeight: "900", color: "#60A5FA" }}>100%</div>
          <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "4px" }}>Verified Stock</div>
        </div>
      </div>
    </div>
  );
}
