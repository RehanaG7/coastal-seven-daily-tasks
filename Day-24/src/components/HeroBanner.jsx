import React, { useState, useRef } from "react";
import { useUIStore } from "../store/useStore";

export default function HeroBanner({ onShopClick }) {
  const triggerIntro = useUIStore((s) => s.triggerIntro);
  const openStateModal = useUIStore((s) => s.openStateModal);
  const backendHealth = useUIStore((s) => s.backendHealth);
  const theme = useUIStore((s) => s.theme);
  const isDark = theme === "dark";

  // Mouse 3D Tilt calculation for Interactive Holographic Cube
  const [tilt, setTilt] = useState({ x: -15, y: 25 });
  const heroRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    const rotY = (x / (rect.width / 2)) * 30;
    const rotX = -(y / (rect.height / 2)) * 30;

    setTilt({ x: rotX, y: rotY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: -15, y: 25 });
  };

  return (
    <div
      ref={heroRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        background: isDark
          ? "radial-gradient(ellipse at 80% 20%, rgba(56, 189, 248, 0.12) 0%, #0B1120 60%, #030712 100%)"
          : "radial-gradient(ellipse at 80% 20%, rgba(56, 189, 248, 0.15) 0%, #F1F5F9 60%, #FFFFFF 100%)",
        border: `1px solid ${isDark ? "rgba(56, 189, 248, 0.25)" : "rgba(56, 189, 248, 0.4)"}`,
        borderRadius: "24px",
        padding: "48px 36px",
        margin: "0 auto 36px auto",
        maxWidth: "1280px",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "36px",
        position: "relative",
        overflow: "hidden",
        boxShadow: isDark
          ? "0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 35px rgba(56, 189, 248, 0.1)"
          : "0 20px 40px -15px rgba(0, 0, 0, 0.1)",
      }}
    >
      {/* Background Laser Grid Pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `linear-gradient(${isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"} 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
          pointerEvents: "none",
        }}
      />

      {/* Left Column: Heading, Tech Stack Pills & CTA */}
      <div style={{ flex: "1 1 540px", position: "relative", zIndex: 10 }}>
        {/* Release Pill */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "rgba(245, 158, 11, 0.15)",
            border: "1px solid rgba(245, 158, 11, 0.4)",
            color: "#F59E0B",
            fontWeight: "900",
            fontSize: "12px",
            letterSpacing: "1px",
            textTransform: "uppercase",
            padding: "6px 16px",
            borderRadius: "999px",
            marginBottom: "20px",
          }}
        >
          <span>⚡</span> Day 10–14 Connected Full-Stack System
        </div>

        <h1
          style={{
            fontSize: "42px",
            fontWeight: "900",
            color: isDark ? "#FFFFFF" : "#0F172A",
            lineHeight: 1.15,
            margin: "0 0 16px 0",
            letterSpacing: "-1px",
          }}
        >
          3D Motion Graphics & <br />
          <span
            style={{
              background: "linear-gradient(135deg, #38BDF8 0%, #818CF8 50%, #F59E0B 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Optimized State Performance.
          </span>
        </h1>

        <p
          style={{
            fontSize: "15px",
            color: isDark ? "#94A3B8" : "#475569",
            margin: "0 0 28px 0",
            lineHeight: 1.6,
            maxWidth: "520px",
          }}
        >
          Powered by <strong>Zustand</strong> persistent state, <strong>TanStack Query v5</strong> infinite caching, and high-framerate 3D animations connected with the <strong>FastAPI Day-10 backend</strong>.
        </p>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "28px" }}>
          <button
            onClick={onShopClick}
            style={{
              backgroundColor: "#F59E0B",
              color: "#030712",
              border: "none",
              padding: "13px 26px",
              borderRadius: "12px",
              fontWeight: "900",
              fontSize: "14px",
              cursor: "pointer",
              boxShadow: "0 6px 20px rgba(245, 158, 11, 0.4)",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              transition: "transform 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            Explore 3D Catalog ↓
          </button>

          <button
            onClick={triggerIntro}
            style={{
              backgroundColor: isDark ? "rgba(15, 23, 42, 0.7)" : "#FFFFFF",
              color: isDark ? "#38BDF8" : "#0284C7",
              border: `1px solid ${isDark ? "rgba(56, 189, 248, 0.4)" : "#BAE6FD"}`,
              padding: "13px 22px",
              borderRadius: "12px",
              fontWeight: "800",
              fontSize: "14px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              backdropFilter: "blur(8px)",
              transition: "transform 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <span>🎬</span> Replay 3D Intro
          </button>

          <button
            onClick={openStateModal}
            style={{
              backgroundColor: isDark ? "rgba(129, 140, 248, 0.15)" : "#EEF2FF",
              color: "#818CF8",
              border: "1px solid rgba(129, 140, 248, 0.4)",
              padding: "13px 20px",
              borderRadius: "12px",
              fontWeight: "800",
              fontSize: "14px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>📊</span> State Comparison
          </button>
        </div>

        {/* Live Architecture Connection Pills */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: "800",
              color: "#10B981",
              backgroundColor: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              padding: "4px 10px",
              borderRadius: "999px",
            }}
          >
            ✔ FastAPI Backend Port 8000
          </span>
          <span
            style={{
              fontSize: "11px",
              fontWeight: "800",
              color: "#38BDF8",
              backgroundColor: "rgba(56, 189, 248, 0.12)",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              padding: "4px 10px",
              borderRadius: "999px",
            }}
          >
            ✔ Redis Caching & Celery
          </span>
          <span
            style={{
              fontSize: "11px",
              fontWeight: "800",
              color: "#A855F7",
              backgroundColor: "rgba(168, 85, 247, 0.12)",
              border: "1px solid rgba(168, 85, 247, 0.3)",
              padding: "4px 10px",
              borderRadius: "999px",
            }}
          >
            ✔ Zustand Store + React Query v5
          </span>
        </div>
      </div>

      {/* Right Column: Interactive 3D Holographic Cargo Cube with Real-time Mouse Tracking */}
      <div
        style={{
          flex: "0 0 320px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
          perspective: "1200px",
        }}
      >
        <div
          className="preserve-3d"
          style={{
            width: "180px",
            height: "180px",
            position: "relative",
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transition: "transform 0.15s cubic-bezier(0.2, 0, 0.2, 1)",
            transformOrigin: "center center",
          }}
        >
          {/* 6-Sided Interactive Cube */}
          {[
            { transform: "translateZ(90px)", text: "⚡ R-MART 3D", border: "#38BDF8", bg: "rgba(15, 23, 42, 0.85)" },
            { transform: "rotateY(180deg) translateZ(90px)", text: "🚀 DISPATCH", border: "#F59E0B", bg: "rgba(15, 23, 42, 0.85)" },
            { transform: "rotateY(-90deg) translateZ(90px)", text: "📦 INVENTORY", border: "#10B981", bg: "rgba(15, 23, 42, 0.85)" },
            { transform: "rotateY(90deg) translateZ(90px)", text: "🔒 SECURE JWT", border: "#A855F7", bg: "rgba(15, 23, 42, 0.85)" },
            { transform: "rotateX(90deg) translateZ(90px)", text: "⚡ DAY 10–14", border: "#38BDF8", bg: "rgba(15, 23, 42, 0.85)" },
            { transform: "rotateX(-90deg) translateZ(90px)", text: "🌐 60 FPS", border: "#F59E0B", bg: "rgba(15, 23, 42, 0.85)" },
          ].map((face, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: "180px",
                height: "180px",
                background: face.bg,
                border: `2px solid ${face.border}`,
                boxShadow: `0 0 25px ${face.border}66, inset 0 0 15px ${face.border}33`,
                transform: face.transform,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                fontWeight: "900",
                fontSize: "13px",
                letterSpacing: "1px",
                borderRadius: "16px",
                backdropFilter: "blur(10px)",
                userSelect: "none",
              }}
            >
              <span style={{ fontSize: "28px", marginBottom: "6px" }}>
                {i === 0 ? "⚡" : i === 1 ? "🚀" : i === 2 ? "📦" : i === 3 ? "🔒" : i === 4 ? "🛰️" : "✨"}
              </span>
              <span>{face.text}</span>
            </div>
          ))}
        </div>

        {/* Hint Pill */}
        <div
          style={{
            position: "absolute",
            bottom: "-32px",
            fontSize: "11px",
            color: "#64748B",
            fontWeight: "700",
            letterSpacing: "0.5px",
            textAlign: "center",
          }}
        >
          Hover mouse to rotate 3D hologram ↗
        </div>
      </div>
    </div>
  );
}
