import React, { useState, useEffect, useRef } from "react";

// ============================================================================
// CLEAN & MINIMALIST AUDIO ENGINE (Web Audio API)
// ============================================================================
class IntroAudioEngine {
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

  playTap() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(580, t);
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.1);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    } catch (e) {}
  }

  playDelivered() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(640, t + 0.15);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.35);
    } catch (e) {}
  }

  playRMartChime() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      [440, 554.37, 659.25, 880].forEach((freq, idx) => {
        const t = this.ctx.currentTime + idx * 0.08;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.45);
      });
    } catch (e) {}
  }
}

const audio = new IntroAudioEngine();

// ============================================================================
// SIMPLE & ELEGANT ANIMATION: Phone Scroll -> Place Order -> Delivered -> R-Mart
// ============================================================================
export default function CinematicIntro({ onFinish }) {
  // 4 Simple Stages:
  // 1. "scroll":    Phone appears, scrolling products
  // 2. "order":     Button taps "Place Order" -> "Order Placed"
  // 3. "delivered": Box drops -> "Delivered in 15 Mins"
  // 4. "rmart":     "R-MART" brand reveals, entering store
  const [step, setStep] = useState("scroll");
  const [soundOn, setSoundOn] = useState(true);
  const finishedRef = useRef(false);

  const handleFinish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (onFinish) onFinish();
  };

  const toggleSound = (e) => {
    e.stopPropagation();
    audio.init();
    audio.isMuted = soundOn;
    setSoundOn(!soundOn);
  };

  useEffect(() => {
    // Stage 1 -> Stage 2: Place Order (at 1.4s)
    const tOrder = setTimeout(() => {
      setStep("order");
      audio.playTap();
    }, 1400);

    // Stage 2 -> Stage 3: Delivered (at 2.7s)
    const tDelivered = setTimeout(() => {
      setStep("delivered");
      audio.playDelivered();
    }, 2700);

    // Stage 3 -> Stage 4: R-Mart (at 3.9s)
    const tRMart = setTimeout(() => {
      setStep("rmart");
      audio.playRMartChime();
    }, 3900);

    // Stage 4 -> Finish (at 4.9s)
    const tFinish = setTimeout(() => {
      handleFinish();
    }, 4950);

    return () => {
      clearTimeout(tOrder);
      clearTimeout(tDelivered);
      clearTimeout(tRMart);
      clearTimeout(tFinish);
    };
  }, []);

  return (
    <div
      onClick={handleFinish}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        backgroundColor: "#030712",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        cursor: "pointer",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        userSelect: "none",
      }}
    >
      <style>{`
        @keyframes scrollItems {
          0% { transform: translateY(0px); }
          100% { transform: translateY(-90px); }
        }

        @keyframes boxDrop {
          0% { transform: translateY(-80px) scale(0.6); opacity: 0; }
          60% { transform: translateY(10px) scale(1.05); opacity: 1; }
          100% { transform: translateY(0px) scale(1); opacity: 1; }
        }

        @keyframes tapEffect {
          0% { transform: scale(1); }
          50% { transform: scale(0.92); }
          100% { transform: scale(1); }
        }

        @keyframes logoPulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 25px rgba(245, 158, 11, 0.6)); }
          50% { transform: scale(1.04); filter: drop-shadow(0 0 45px rgba(56, 189, 248, 0.8)); }
        }

        @keyframes fadeInScale {
          0% { opacity: 0; transform: scale(0.85); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* Top Controls: Sound & Skip */}
      <div
        style={{
          position: "absolute",
          top: "24px",
          left: "24px",
          right: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 50,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "20px", color: "#F59E0B" }}>⚡</span>
          <span
            style={{
              fontSize: "14px",
              fontWeight: "900",
              letterSpacing: "1.5px",
              color: "#FFFFFF",
            }}
          >
            R-MART
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={toggleSound}
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#FFFFFF",
              borderRadius: "20px",
              padding: "6px 14px",
              fontSize: "12px",
              fontWeight: "700",
              cursor: "pointer",
              backdropFilter: "blur(6px)",
            }}
          >
            {soundOn ? "🔊 Sound On" : "🔇 Muted"}
          </button>

          <button
            onClick={handleFinish}
            style={{
              background: "rgba(245, 158, 11, 0.2)",
              border: "1px solid #F59E0B",
              color: "#F59E0B",
              borderRadius: "20px",
              padding: "6px 16px",
              fontSize: "12px",
              fontWeight: "900",
              cursor: "pointer",
            }}
          >
            Skip ✕
          </button>
        </div>
      </div>

      {/* ====================================================================
          STEPS 1, 2, 3: PHONE SCROLL -> PLACE ORDER -> DELIVERED
          ==================================================================== */}
      {step !== "rmart" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "24px",
            animation: "fadeInScale 0.4s ease-out",
          }}
        >
          {/* Main Stage: Smartphone + Delivery Box */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "36px",
              flexWrap: "wrap",
            }}
          >
            {/* 1. Phone Mockup */}
            <div
              style={{
                width: "220px",
                height: "360px",
                backgroundColor: "#0B1120",
                borderRadius: "32px",
                border: "3px solid rgba(255, 255, 255, 0.2)",
                boxShadow:
                  "0 20px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(56, 189, 248, 0.2)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}
            >
              {/* Notch */}
              <div
                style={{
                  width: "60px",
                  height: "10px",
                  backgroundColor: "#000000",
                  borderRadius: "10px",
                  margin: "8px auto 4px auto",
                }}
              />

              {/* Phone Header */}
              <div
                style={{
                  padding: "4px 12px 8px 12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                <span style={{ fontSize: "11px", fontWeight: "900", color: "#F59E0B" }}>
                  ⚡ R-Mart App
                </span>
                <span
                  style={{
                    fontSize: "8px",
                    fontWeight: "800",
                    color: "#10B981",
                    backgroundColor: "rgba(16, 185, 129, 0.15)",
                    padding: "2px 6px",
                    borderRadius: "999px",
                  }}
                >
                  ● Online
                </span>
              </div>

              {/* Phone Content: Scrolling Products */}
              <div
                style={{
                  flex: 1,
                  overflow: "hidden",
                  padding: "8px",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    animation: step === "scroll" ? "scrollItems 2s ease-in-out infinite alternate" : "none",
                  }}
                >
                  {/* Card 1 */}
                  <div
                    style={{
                      backgroundColor: "rgba(30, 41, 59, 0.8)",
                      borderRadius: "10px",
                      padding: "8px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      border: "1px solid rgba(56, 189, 248, 0.25)",
                    }}
                  >
                    <img
                      src="https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=100"
                      alt="iPhone"
                      style={{ width: "32px", height: "32px", borderRadius: "6px", objectFit: "cover" }}
                    />
                    <div>
                      <div style={{ fontSize: "10px", fontWeight: "800", color: "#FFF" }}>
                        iPhone 15 Pro
                      </div>
                      <div style={{ fontSize: "9px", color: "#38BDF8", fontWeight: "900" }}>
                        $1,199.99
                      </div>
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div
                    style={{
                      backgroundColor: "rgba(30, 41, 59, 0.8)",
                      borderRadius: "10px",
                      padding: "8px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      border: "1px solid rgba(245, 158, 11, 0.25)",
                    }}
                  >
                    <img
                      src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100"
                      alt="Sneakers"
                      style={{ width: "32px", height: "32px", borderRadius: "6px", objectFit: "cover" }}
                    />
                    <div>
                      <div style={{ fontSize: "10px", fontWeight: "800", color: "#FFF" }}>
                        Nike Air Shoes
                      </div>
                      <div style={{ fontSize: "9px", color: "#F59E0B", fontWeight: "900" }}>
                        $99.99
                      </div>
                    </div>
                  </div>

                  {/* Card 3 */}
                  <div
                    style={{
                      backgroundColor: "rgba(30, 41, 59, 0.8)",
                      borderRadius: "10px",
                      padding: "8px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      border: "1px solid rgba(16, 185, 129, 0.25)",
                    }}
                  >
                    <img
                      src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100"
                      alt="Headphones"
                      style={{ width: "32px", height: "32px", borderRadius: "6px", objectFit: "cover" }}
                    />
                    <div>
                      <div style={{ fontSize: "10px", fontWeight: "800", color: "#FFF" }}>
                        Sony Headphones
                      </div>
                      <div style={{ fontSize: "9px", color: "#10B981", fontWeight: "900" }}>
                        $349.99
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* In-Phone Place Order Button */}
              <div style={{ padding: "10px", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <div
                  style={{
                    backgroundColor: step === "scroll" ? "#F59E0B" : "#10B981",
                    color: "#000000",
                    padding: "9px",
                    borderRadius: "10px",
                    fontSize: "11px",
                    fontWeight: "900",
                    textAlign: "center",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    animation: step === "order" ? "tapEffect 0.3s ease-out" : "none",
                    boxShadow:
                      step === "scroll"
                        ? "0 4px 12px rgba(245, 158, 11, 0.4)"
                        : "0 0 20px rgba(16, 185, 129, 0.6)",
                    transition: "all 0.25s ease",
                  }}
                >
                  <span>{step === "scroll" ? "⚡" : "✓"}</span>
                  <span>{step === "scroll" ? "PLACE ORDER" : "ORDER PLACED!"}</span>
                </div>
              </div>
            </div>

            {/* 2. Delivery Box (Appears on step === 'delivered') */}
            {step === "delivered" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "14px",
                  animation: "boxDrop 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                }}
              >
                {/* Parcel Box */}
                <div
                  style={{
                    width: "140px",
                    height: "110px",
                    backgroundColor: "#F59E0B",
                    borderRadius: "16px",
                    border: "2px solid #D97706",
                    boxShadow:
                      "0 20px 40px rgba(0, 0, 0, 0.8), 0 0 25px rgba(245, 158, 11, 0.4)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                  }}
                >
                  {/* Tape */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      bottom: 0,
                      width: "18px",
                      backgroundColor: "rgba(0,0,0,0.4)",
                    }}
                  />
                  <span style={{ fontSize: "36px", zIndex: 1 }}>📦</span>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: "900",
                      color: "#000000",
                      letterSpacing: "1px",
                      zIndex: 1,
                    }}
                  >
                    R-MART
                  </div>
                </div>

                {/* Delivered Badge */}
                <div
                  style={{
                    backgroundColor: "rgba(16, 185, 129, 0.15)",
                    border: "1px solid #10B981",
                    color: "#10B981",
                    padding: "6px 14px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "900",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>✓</span>
                  <span>DELIVERED IN 15 MINS!</span>
                </div>
              </div>
            )}
          </div>

          {/* Simple Step Indicator */}
          <div
            style={{
              fontSize: "13px",
              fontWeight: "800",
              color: "#94A3B8",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span style={{ color: step === "scroll" ? "#38BDF8" : "#475569" }}>
              1. Phone Scroll
            </span>
            <span>→</span>
            <span style={{ color: step === "order" ? "#F59E0B" : "#475569" }}>
              2. Place Order
            </span>
            <span>→</span>
            <span style={{ color: step === "delivered" ? "#10B981" : "#475569" }}>
              3. Delivered
            </span>
          </div>
        </div>
      )}

      {/* ====================================================================
          STEP 4: R-MART BRAND FINALE
          ==================================================================== */}
      {step === "rmart" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
            animation: "fadeInScale 0.4s ease-out",
            textAlign: "center",
            padding: "20px",
          }}
        >
          {/* Logo */}
          <div
            style={{
              fontSize: "64px",
              marginBottom: "8px",
              animation: "logoPulse 1.5s ease-in-out infinite",
            }}
          >
            ⚡
          </div>

          {/* Brand Name */}
          <h1
            style={{
              fontSize: "52px",
              fontWeight: "900",
              letterSpacing: "6px",
              color: "#FFFFFF",
              margin: 0,
              textShadow:
                "0 0 30px rgba(245, 158, 11, 0.7), 0 0 60px rgba(56, 189, 248, 0.5)",
            }}
          >
            R - M A R T
          </h1>

          <p
            style={{
              fontSize: "16px",
              fontWeight: "700",
              color: "#94A3B8",
              margin: "4px 0 16px 0",
              letterSpacing: "1px",
            }}
          >
            100% Genuine • Superfast Delivery
          </p>

          {/* Direct CTA */}
          <button
            onClick={handleFinish}
            style={{
              backgroundColor: "#F59E0B",
              color: "#030712",
              border: "none",
              padding: "14px 32px",
              borderRadius: "14px",
              fontSize: "15px",
              fontWeight: "900",
              cursor: "pointer",
              boxShadow: "0 4px 25px rgba(245, 158, 11, 0.5)",
            }}
          >
            Start Shopping →
          </button>
        </div>
      )}
    </div>
  );
}
