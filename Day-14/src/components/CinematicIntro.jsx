import React, { useState, useEffect, useRef } from "react";

// ============================================================================
// ULTRA-FAST 5-SECOND SYNTH AUDIO ENGINE (Lightweight, Non-blocking)
// ============================================================================
class FastAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
  }

  init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  playLightHum() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.35);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {}
  }

  playOrderTap() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.setValueAtTime(880, now + 0.08); // A5
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {}
  }

  playDeliveryWhoosh() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.25);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.5);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {}
  }

  playSuccessChime() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C E G C
      notes.forEach((freq, idx) => {
        const now = this.ctx.currentTime + idx * 0.06;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.6);
      });
    } catch (e) {}
  }
}

const audio = new FastAudioEngine();

// ============================================================================
// COMPONENT: FAST 5-SECOND CINEMATIC INTRO
// ============================================================================
export default function CinematicIntro({ onFinish }) {
  // Stage flow over exactly 5.0 seconds:
  // 0.0s - 1.2s: "entering"   (Person enters from left scrolling phone)
  // 1.2s - 2.4s: "mart_open"  (R-Mart appears in front with beautiful neon lighting)
  // 2.4s - 3.4s: "order"      (Person taps 'Place Order' on phone, ripple pulse)
  // 3.4s - 4.6s: "delivery"   (Delivery boy zooms in and delivers boxes)
  // 4.6s - 5.0s: "finished"   (Success badge & auto-enter store)
  const [stage, setStage] = useState("entering");
  const [progress, setProgress] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const hasFinishedRef = useRef(false);

  const handleFinish = () => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    if (onFinish) onFinish();
  };

  const toggleSound = () => {
    audio.init();
    audio.isMuted = soundOn;
    setSoundOn(!soundOn);
  };

  useEffect(() => {
    const startTime = Date.now();
    const DURATION = 5000; // Exact 5 seconds

    // Smooth progress bar update (every 50ms)
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / DURATION) * 100));
      setProgress(pct);
    }, 50);

    // Timeline triggers
    const tMart = setTimeout(() => {
      setStage("mart_open");
      audio.playLightHum();
    }, 1200);

    const tOrder = setTimeout(() => {
      setStage("order");
      audio.playOrderTap();
    }, 2400);

    const tDelivery = setTimeout(() => {
      setStage("delivery");
      audio.playDeliveryWhoosh();
    }, 3400);

    const tFinishSound = setTimeout(() => {
      setStage("finished");
      audio.playSuccessChime();
    }, 4500);

    // Auto-enter store at 5.0s
    const tEnd = setTimeout(() => {
      handleFinish();
    }, DURATION);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(tMart);
      clearTimeout(tOrder);
      clearTimeout(tDelivery);
      clearTimeout(tFinishSound);
      clearTimeout(tEnd);
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        backgroundColor: "#000000",
        overflow: "hidden",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        userSelect: "none",
      }}
    >
      {/* Dynamic Keyframe Styles */}
      <style>{`
        @keyframes walkIn {
          0% { transform: translateX(-180px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes phoneScrollThumb {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes phoneScreenGlow {
          0%, 100% { opacity: 0.8; filter: drop-shadow(0 0 10px #38BDF8); }
          50% { opacity: 1; filter: drop-shadow(0 0 20px #38BDF8); }
        }
        @keyframes martAppear {
          0% { opacity: 0; transform: scale(0.92) translateY(20px); filter: brightness(0.2); }
          50% { filter: brightness(1.4); }
          100% { opacity: 1; transform: scale(1) translateY(0); filter: brightness(1); }
        }
        @keyframes neonFlicker {
          0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% {
            filter: drop-shadow(0 0 8px #F59E0B) drop-shadow(0 0 25px rgba(245, 158, 11, 0.7));
          }
          20%, 24%, 55% {
            filter: none;
            opacity: 0.6;
          }
        }
        @keyframes orderPulseRing {
          0% { transform: scale(0.6); opacity: 1; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes deliveryBoyZoom {
          0% { transform: translateX(360px); opacity: 0; }
          60% { transform: translateX(-20px); opacity: 1; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes boxHandover {
          0% { transform: translateY(-10px) scale(0.8); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes bounceGently {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>

      {/* ====================================================================
          TOP BAR: 5-SECOND COUNTDOWN & SKIP BUTTON
          ==================================================================== */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          padding: "16px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 100,
        }}
      >
        {/* Audio Mute/Unmute */}
        <button
          onClick={toggleSound}
          style={{
            background: "rgba(15, 23, 42, 0.6)",
            border: "1px solid rgba(56, 189, 248, 0.25)",
            color: soundOn ? "#38BDF8" : "#64748B",
            padding: "6px 14px",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: "800",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            backdropFilter: "blur(12px)",
          }}
        >
          <span>{soundOn ? "🔊" : "🔇"}</span>
          <span>{soundOn ? "AUDIO ON" : "MUTED"}</span>
        </button>

        {/* 5-Second Timer Pill & Skip */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "rgba(15, 23, 42, 0.7)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              padding: "6px 14px",
              borderRadius: "20px",
              backdropFilter: "blur(12px)",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#F59E0B",
                boxShadow: "0 0 8px #F59E0B",
                animation: "bounceGently 1s infinite",
              }}
            />
            <span style={{ color: "#F8FAFC", fontSize: "12px", fontWeight: "800" }}>
              5s Fast Intro
            </span>
          </div>

          <button
            onClick={handleFinish}
            style={{
              backgroundColor: "rgba(245, 158, 11, 0.15)",
              border: "1px solid #F59E0B",
              color: "#F59E0B",
              padding: "7px 18px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: "900",
              cursor: "pointer",
              backdropFilter: "blur(12px)",
              letterSpacing: "0.5px",
            }}
          >
            SKIP ➔
          </button>
        </div>
      </div>

      {/* Top 5-Second Linear Progress Bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "3px",
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          zIndex: 101,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: "linear-gradient(90deg, #38BDF8, #F59E0B, #10B981)",
            boxShadow: "0 0 10px #F59E0B",
            transition: "width 0.05s linear",
          }}
        />
      </div>

      {/* ====================================================================
          DARK BACKGROUND ENVIRONMENT WITH SLEEK REFLECTIVE FLOOR
          ==================================================================== */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at 50% 35%, #0B132B 0%, #030712 60%, #000000 100%)",
          zIndex: 1,
        }}
      />

      {/* Subtle Star Dust */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "5%",
          right: "5%",
          height: "40%",
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px), radial-gradient(circle, rgba(56,189,248,0.25) 1px, transparent 1px)",
          backgroundSize: "80px 80px, 140px 140px",
          backgroundPosition: "0 0, 40px 40px",
          opacity: 0.4,
          zIndex: 2,
        }}
      />

      {/* Ground High-Gloss Perspective Floor */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "38%",
          background:
            "linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, rgba(3, 7, 18, 0.98) 60%, rgba(0, 0, 0, 1) 100%)",
          perspective: "600px",
          borderTop: "1px solid rgba(56, 189, 248, 0.2)",
          zIndex: 3,
        }}
      >
        {/* Cyber Neon Floor Grid Lines */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(56, 189, 248, 0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 189, 248, 0.09) 1px, transparent 1px)",
            backgroundSize: "50px 30px",
            transform: "rotateX(55deg)",
            transformOrigin: "top center",
          }}
        />
      </div>

      {/* ====================================================================
          STAGE 2: R-MART SUPERSTORE APPEARS WITH GORGEOUS LIGHTING (Right/Center)
          ==================================================================== */}
      {(stage === "mart_open" || stage === "order" || stage === "delivery" || stage === "finished") && (
        <div
          style={{
            position: "absolute",
            right: "8%",
            bottom: "28%",
            zIndex: 10,
            animation: "martAppear 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* MART BUILDING FACADE */}
          <div
            style={{
              position: "relative",
              width: "480px",
              height: "260px",
              backgroundColor: "rgba(10, 15, 30, 0.85)",
              border: "2px solid rgba(56, 189, 248, 0.4)",
              borderRadius: "20px 20px 4px 4px",
              boxShadow:
                "0 0 50px rgba(56, 189, 248, 0.2), 0 20px 40px rgba(0, 0, 0, 0.9), inset 0 0 30px rgba(245, 158, 11, 0.15)",
              backdropFilter: "blur(20px)",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            {/* Architectural Roof Overhang with Warm Spotlights */}
            <div
              style={{
                position: "absolute",
                top: "-14px",
                left: "-12px",
                right: "-12px",
                height: "18px",
                backgroundColor: "#0F172A",
                border: "1px solid #38BDF8",
                borderRadius: "8px",
                display: "flex",
                justifyContent: "space-around",
                alignItems: "center",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.8)",
              }}
            >
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: "#F59E0B",
                    boxShadow: "0 0 8px #F59E0B",
                  }}
                />
              ))}
            </div>

            {/* Radiant Glowing Neon Mart Sign */}
            <div
              style={{
                textAlign: "center",
                marginTop: "10px",
                padding: "8px 24px",
                backgroundColor: "rgba(3, 7, 18, 0.9)",
                border: "2px solid #F59E0B",
                borderRadius: "14px",
                boxShadow: "0 0 25px rgba(245, 158, 11, 0.45)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                animation: "neonFlicker 3s infinite",
              }}
            >
              <span style={{ fontSize: "28px", color: "#F59E0B", filter: "drop-shadow(0 0 10px #F59E0B)" }}>
                ⚡
              </span>
              <span
                style={{
                  fontSize: "30px",
                  fontWeight: "900",
                  color: "#FFFFFF",
                  letterSpacing: "4px",
                  textShadow:
                    "0 0 10px #FFFFFF, 0 0 20px #F59E0B, 0 0 40px #F59E0B",
                }}
              >
                R - M A R T
              </span>
              <span
                style={{
                  backgroundColor: "#10B981",
                  color: "#030712",
                  fontSize: "10px",
                  fontWeight: "900",
                  padding: "3px 8px",
                  borderRadius: "6px",
                  letterSpacing: "1px",
                  boxShadow: "0 0 8px #10B981",
                }}
              >
                OPEN 24/7
              </span>
            </div>

            {/* Illuminated Glass Storefront Windows with Warm Shelves Inside */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "12px",
                height: "130px",
                marginTop: "12px",
              }}
            >
              {/* Window 1: Fresh & Grocery Aisles */}
              <div
                style={{
                  backgroundColor: "rgba(245, 158, 11, 0.08)",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                  borderRadius: "8px",
                  padding: "10px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "inset 0 0 20px rgba(245, 158, 11, 0.2)",
                }}
              >
                <div style={{ fontSize: "10px", fontWeight: "800", color: "#F59E0B" }}>
                  🍎 Fresh Mart
                </div>
                {/* Lit Shelves */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ height: "4px", backgroundColor: "#F59E0B", opacity: 0.7, borderRadius: "2px" }} />
                  <div style={{ height: "4px", backgroundColor: "#F59E0B", opacity: 0.5, borderRadius: "2px" }} />
                  <div style={{ height: "4px", backgroundColor: "#F59E0B", opacity: 0.3, borderRadius: "2px" }} />
                </div>
                <div style={{ fontSize: "16px", textAlign: "center" }}>🛒 🥑 🥛</div>
              </div>

              {/* Window 2: Main Glass Sliding Entrance */}
              <div
                style={{
                  backgroundColor: "rgba(56, 189, 248, 0.12)",
                  border: "1px solid rgba(56, 189, 248, 0.5)",
                  borderRadius: "8px",
                  padding: "10px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow: "inset 0 0 25px rgba(56, 189, 248, 0.3), 0 0 20px rgba(56, 189, 248, 0.2)",
                }}
              >
                <div style={{ fontSize: "10px", fontWeight: "800", color: "#38BDF8" }}>
                  ✨ Glass Doors
                </div>
                <div style={{ fontSize: "28px" }}>🏪</div>
                <div style={{ fontSize: "9px", fontWeight: "800", color: "#38BDF8" }}>
                  ENTRANCE
                </div>
              </div>

              {/* Window 3: Electronics & Deals */}
              <div
                style={{
                  backgroundColor: "rgba(16, 185, 129, 0.08)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  borderRadius: "8px",
                  padding: "10px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "inset 0 0 20px rgba(16, 185, 129, 0.2)",
                }}
              >
                <div style={{ fontSize: "10px", fontWeight: "800", color: "#10B981" }}>
                  ⚡ Daily Deals
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ height: "4px", backgroundColor: "#10B981", opacity: 0.7, borderRadius: "2px" }} />
                  <div style={{ height: "4px", backgroundColor: "#10B981", opacity: 0.5, borderRadius: "2px" }} />
                  <div style={{ height: "4px", backgroundColor: "#10B981", opacity: 0.3, borderRadius: "2px" }} />
                </div>
                <div style={{ fontSize: "16px", textAlign: "center" }}>📦 🏷️ 🎧</div>
              </div>
            </div>
          </div>

          {/* Golden Ambient Floor Light Pool coming out of Mart */}
          <div
            style={{
              width: "520px",
              height: "40px",
              background:
                "radial-gradient(ellipse at center, rgba(245, 158, 11, 0.45) 0%, rgba(56, 189, 248, 0.2) 50%, transparent 80%)",
              filter: "blur(12px)",
              marginTop: "-15px",
            }}
          />
        </div>
      )}

      {/* ====================================================================
          STAGE 1 & 3: THE PERSON ENTERS SCROLLING PHONE & PLACES ORDER
          ==================================================================== */}
      <div
        style={{
          position: "absolute",
          left: "22%",
          bottom: "26%",
          zIndex: 30,
          animation: "walkIn 1.1s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Floating Order Notification Bubble when Tapped */}
        {stage === "order" && (
          <div
            style={{
              position: "absolute",
              top: "-80px",
              backgroundColor: "rgba(16, 185, 129, 0.95)",
              color: "#FFFFFF",
              padding: "8px 18px",
              borderRadius: "20px",
              fontSize: "13px",
              fontWeight: "900",
              boxShadow: "0 0 25px #10B981",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              whiteSpace: "nowrap",
              animation: "bounceGently 0.8s ease infinite",
            }}
          >
            <span>✓</span>
            <span>ORDER PLACED INSTANTLY!</span>
          </div>
        )}

        {/* When Delivery Arrives: Package Collected Badge */}
        {(stage === "delivery" || stage === "finished") && (
          <div
            style={{
              position: "absolute",
              top: "-85px",
              backgroundColor: "rgba(245, 158, 11, 0.95)",
              color: "#030712",
              padding: "8px 20px",
              borderRadius: "20px",
              fontSize: "13px",
              fontWeight: "900",
              boxShadow: "0 0 25px rgba(245, 158, 11, 0.8)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              whiteSpace: "nowrap",
              animation: "bounceGently 0.8s ease infinite",
            }}
          >
            <span>📦</span>
            <span>ORDER DELIVERED AT DOORSTEP!</span>
          </div>
        )}

        {/* STYLIZED 2D VECTOR CHARACTER: PERSON SCROLLING PHONE */}
        <div style={{ position: "relative", width: "120px", height: "230px" }}>
          <svg width="120" height="230" viewBox="0 0 120 230">
            <defs>
              <linearGradient id="jacketGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1E293B" />
                <stop offset="100%" stopColor="#0F172A" />
              </linearGradient>
              <linearGradient id="phoneGlowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#0284C7" />
              </linearGradient>
            </defs>

            {/* Head & Hair */}
            <circle cx="60" cy="38" r="18" fill="#F8FAFC" />
            <path
              d="M 44,32 Q 60,18 76,32 Q 78,42 74,40 Q 60,34 46,40 Z"
              fill="#0F172A"
            />

            {/* Torso / Modern Jacket */}
            <path
              d="M 40,60 L 80,60 L 74,136 L 46,136 Z"
              fill="url(#jacketGrad)"
              stroke="#38BDF8"
              strokeWidth="1.5"
            />

            {/* Legs */}
            <line x1="50" y1="136" x2="44" y2="204" stroke="#0F172A" strokeWidth="12" strokeLinecap="round" />
            <line x1="70" y1="136" x2="76" y2="204" stroke="#0F172A" strokeWidth="12" strokeLinecap="round" />
            {/* Modern Sneakers */}
            <ellipse cx="40" cy="208" rx="10" ry="5" fill="#38BDF8" />
            <ellipse cx="80" cy="208" rx="10" ry="5" fill="#38BDF8" />

            {/* Left Arm holding phone in front */}
            <path
              d="M 44,68 Q 30,102 54,106"
              stroke="#1E293B"
              strokeWidth="9"
              strokeLinecap="round"
              fill="none"
            />
            {/* Right Arm scrolling phone */}
            <path
              d="M 76,68 Q 88,102 68,106"
              stroke="#1E293B"
              strokeWidth="9"
              strokeLinecap="round"
              fill="none"
            />

            {/* THE GLOWING PHONE */}
            <rect
              x="54"
              y="92"
              width="18"
              height="30"
              rx="3"
              fill="#030712"
              stroke="#38BDF8"
              strokeWidth="1.5"
              style={{ animation: "phoneScreenGlow 1.5s infinite" }}
            />
            {/* Phone Screen display */}
            <rect x="56" y="94" width="14" height="24" rx="2" fill="url(#phoneGlowGrad)" />
            {/* Animated Scrolling Thumb */}
            <circle
              cx="64"
              cy="106"
              r="3"
              fill="#F8FAFC"
              style={{ animation: "phoneScrollThumb 0.8s infinite" }}
            />
          </svg>

          {/* Ripple Pulse on Screen Tap when placing order */}
          {stage === "order" && (
            <div
              style={{
                position: "absolute",
                left: "58px",
                top: "100px",
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                border: "2px solid #10B981",
                animation: "orderPulseRing 0.8s cubic-bezier(0, 0.2, 0.8, 1) infinite",
                pointerEvents: "none",
              }}
            />
          )}

          {/* Delivered Boxes in Person's Hand after Delivery */}
          {(stage === "delivery" || stage === "finished") && (
            <div
              style={{
                position: "absolute",
                left: "30px",
                top: "85px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "2px",
                animation: "boxHandover 0.4s ease forwards",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "22px",
                  backgroundColor: "#F59E0B",
                  border: "1px solid #B45309",
                  borderRadius: "4px",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "10px",
                  fontWeight: "900",
                  color: "#030712",
                }}
              >
                ⚡ R-MART
              </div>
              <div
                style={{
                  width: "56px",
                  height: "24px",
                  backgroundColor: "#D97706",
                  border: "1px solid #78350F",
                  borderRadius: "4px",
                  boxShadow: "0 6px 15px rgba(0,0,0,0.8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: "900",
                  color: "#030712",
                }}
              >
                📦 PARCEL
              </div>
            </div>
          )}
        </div>

        {/* Character Floor Shadow */}
        <div
          style={{
            width: "90px",
            height: "14px",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            borderRadius: "50%",
            filter: "blur(5px)",
            marginTop: "-8px",
          }}
        />
      </div>

      {/* ====================================================================
          STAGE 4: FAST DELIVERY BOY DELIVERS BOXES (Zooms in from Right)
          ==================================================================== */}
      {(stage === "delivery" || stage === "finished") && (
        <div
          style={{
            position: "absolute",
            left: "35%",
            bottom: "26%",
            zIndex: 35,
            animation: "deliveryBoyZoom 0.7s cubic-bezier(0.18, 0.9, 0.32, 1) forwards",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* DELIVERY BOY VECTOR FIGURE */}
          <div style={{ position: "relative", width: "120px", height: "230px" }}>
            <svg width="120" height="230" viewBox="0 0 120 230">
              {/* Delivery Boy Cap */}
              <path d="M 46,26 Q 60,14 74,26 L 86,28 L 84,34 L 46,34 Z" fill="#F59E0B" />
              {/* Head */}
              <circle cx="60" cy="38" r="16" fill="#F8FAFC" />

              {/* Delivery Uniform Jacket with R-Mart Badge */}
              <path
                d="M 42,58 L 78,58 L 72,136 L 48,136 Z"
                fill="#F59E0B"
                stroke="#B45309"
                strokeWidth="1.5"
              />
              <rect x="52" y="70" width="16" height="8" rx="2" fill="#030712" />
              <text x="60" y="76" fontSize="5" fontWeight="900" fill="#F59E0B" textAnchor="middle">
                R-MART
              </text>

              {/* Legs */}
              <line x1="52" y1="136" x2="48" y2="204" stroke="#0F172A" strokeWidth="12" strokeLinecap="round" />
              <line x1="68" y1="136" x2="72" y2="204" stroke="#0F172A" strokeWidth="12" strokeLinecap="round" />
              <ellipse cx="46" cy="208" rx="10" ry="5" fill="#F59E0B" />
              <ellipse cx="74" cy="208" rx="10" ry="5" fill="#F59E0B" />

              {/* Forward Reaching Arms Delivering Box */}
              <path
                d="M 44,68 Q 24,96 14,94"
                stroke="#F59E0B"
                strokeWidth="9"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 76,68 Q 44,98 16,94"
                stroke="#F59E0B"
                strokeWidth="9"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>

          {/* Delivery Boy Floor Shadow */}
          <div
            style={{
              width: "80px",
              height: "12px",
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              borderRadius: "50%",
              filter: "blur(5px)",
              marginTop: "-8px",
            }}
          />
        </div>
      )}

      {/* ====================================================================
          BOTTOM STATUS TOAST: CLEAR NARRATIVE & AUTO-TRANSITION
          ==================================================================== */}
      <div
        style={{
          position: "absolute",
          bottom: "36px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "10px",
          zIndex: 50,
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(10, 15, 30, 0.85)",
            border: "1px solid rgba(245, 158, 11, 0.4)",
            borderRadius: "30px",
            padding: "10px 28px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.9), 0 0 20px rgba(245, 158, 11, 0.2)",
            backdropFilter: "blur(16px)",
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <span style={{ fontSize: "18px" }}>
            {stage === "entering" && "📱"}
            {stage === "mart_open" && "🏪"}
            {stage === "order" && "⚡"}
            {stage === "delivery" && "🛵"}
            {stage === "finished" && "🎉"}
          </span>
          <span style={{ color: "#F8FAFC", fontSize: "14px", fontWeight: "800", letterSpacing: "0.2px" }}>
            {stage === "entering" && "Browsing R-Mart catalog on smartphone..."}
            {stage === "mart_open" && "R-Mart Superstore opens with luminous display!"}
            {stage === "order" && "Tapping 'Place Order' on smartphone..."}
            {stage === "delivery" && "Delivery agent hands over fresh grocery boxes!"}
            {stage === "finished" && "Delivered! Opening store now..."}
          </span>
        </div>

        {/* One-Click Enter Store Button */}
        <button
          onClick={handleFinish}
          style={{
            backgroundColor: "#F59E0B",
            color: "#030712",
            border: "none",
            borderRadius: "20px",
            padding: "8px 24px",
            fontSize: "12px",
            fontWeight: "900",
            cursor: "pointer",
            boxShadow: "0 0 20px rgba(245, 158, 11, 0.5)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span>START SHOPPING NOW</span>
          <span>➔</span>
        </button>
      </div>
    </div>
  );
}
