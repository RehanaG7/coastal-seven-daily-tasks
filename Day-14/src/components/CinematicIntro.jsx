import React, { useState, useEffect, useRef } from "react";

// ============================================================================
// ULTRA-FAST 5-SECOND SYNTH AUDIO ENGINE (Non-blocking, Web Audio API)
// ============================================================================
class CinematicAudioEngine {
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

  playAmbientSwell() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.8);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.9);
    } catch (e) {}
  }

  playOrderPulse() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // High-tech haptic tap sound
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.08); // A5
      gain.gain.setValueAtTime(0.15, now);
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
      osc.type = "triangle";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(550, now + 0.2);
      osc.frequency.exponentialRampToValueAtTime(130, now + 0.5);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {}
  }

  playFinishChime() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const notes = [440, 554.37, 659.25, 880]; // A Major Chord
      notes.forEach((freq, idx) => {
        const now = this.ctx.currentTime + idx * 0.05;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.7);
      });
    } catch (e) {}
  }
}

const audio = new CinematicAudioEngine();

// ============================================================================
// COMPONENT: NEAT & PROFESSIONAL 3D CINEMATIC INTRO
// ============================================================================
export default function CinematicIntro({ onFinish }) {
  // Phases over 5.0s:
  // 0.0s - 1.2s: "device_browsing"  (Isometric 3D smartphone floats in, user scrolling items)
  // 1.2s - 2.5s: "mart_emerge"      (Flagship R-MART pavilion illuminates in cosmic dark background)
  // 2.5s - 3.5s: "order_pulse"      (One-tap order ripple shockwave in 3D perspective)
  // 3.5s - 4.6s: "rapid_dispatch"   (High-tech aerodynamic courier pod delivers parcel)
  // 4.6s - 5.0s: "zoom_enter"       (Camera accelerates smoothly into store)
  const [phase, setPhase] = useState("device_browsing");
  const [progress, setProgress] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const hasFinishedRef = useRef(false);

  const handleFinish = () => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    if (onFinish) onFinish();
  };

  const toggleSound = (e) => {
    e.stopPropagation();
    audio.init();
    audio.isMuted = soundOn;
    setSoundOn(!soundOn);
  };

  useEffect(() => {
    const startTime = Date.now();
    const DURATION = 5000;

    // Progress bar update
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / DURATION) * 100));
      setProgress(pct);
    }, 50);

    // Timeline triggers
    const tMart = setTimeout(() => {
      setPhase("mart_emerge");
      audio.playAmbientSwell();
    }, 1200);

    const tOrder = setTimeout(() => {
      setPhase("order_pulse");
      audio.playOrderPulse();
    }, 2500);

    const tDispatch = setTimeout(() => {
      setPhase("rapid_dispatch");
      audio.playDeliveryWhoosh();
    }, 3500);

    const tFinish = setTimeout(() => {
      setPhase("zoom_enter");
      audio.playFinishChime();
      setTimeout(handleFinish, 450);
    }, 4550);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(tMart);
      clearTimeout(tOrder);
      clearTimeout(tDispatch);
      clearTimeout(tFinish);
    };
  }, []);

  return (
    <div
      onClick={handleFinish}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100000,
        backgroundColor: "#030712",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        cursor: "pointer",
        fontFamily: "'Inter', -apple-system, system-ui, sans-serif",
        userSelect: "none",
        perspective: "1200px",
      }}
    >
      {/* ====================================================================
          1. KEYFRAME ANIMATIONS
          ==================================================================== */}
      <style>{`
        @keyframes floatDevice {
          0% { transform: translateY(40px) rotateY(-20deg) rotateX(12deg) scale(0.92); opacity: 0; }
          40% { transform: translateY(0px) rotateY(-14deg) rotateX(8deg) scale(1); opacity: 1; }
          100% { transform: translateY(-8px) rotateY(-8deg) rotateX(4deg) scale(1); opacity: 1; }
        }

        @keyframes phoneScrollTrack {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-70px); }
          100% { transform: translateY(-140px); }
        }

        @keyframes laserSweep {
          0% { transform: scaleX(0); opacity: 0; }
          50% { transform: scaleX(1); opacity: 0.9; }
          100% { transform: scaleX(1); opacity: 0.4; }
        }

        @keyframes rmartGlowPulse {
          0%, 100% { filter: drop-shadow(0 0 15px rgba(245, 158, 11, 0.4)) drop-shadow(0 0 40px rgba(245, 158, 11, 0.2)); }
          50% { filter: drop-shadow(0 0 25px rgba(245, 158, 11, 0.8)) drop-shadow(0 0 60px rgba(56, 189, 248, 0.35)); }
        }

        @keyframes shockwave3D {
          0% { transform: translate(-50%, -50%) scale(0.2); opacity: 1; border-width: 4px; }
          100% { transform: translate(-50%, -50%) scale(2.8); opacity: 0; border-width: 1px; }
        }

        @keyframes dispatchSwoop {
          0% { transform: translateX(280px) translateY(-80px) scale(0.6); opacity: 0; }
          60% { transform: translateX(-15px) translateY(10px) scale(1.05); opacity: 1; }
          100% { transform: translateX(0px) translateY(0px) scale(1); opacity: 1; }
        }

        @keyframes parcelDropGently {
          0% { transform: translateY(-50px) scale(0.7); opacity: 0; }
          60% { transform: translateY(4px) scale(1.03); opacity: 1; }
          100% { transform: translateY(0px) scale(1); opacity: 1; }
        }

        @keyframes gridFlythrough {
          0% { background-position: 0 0; }
          100% { background-position: 0 80px; }
        }

        @keyframes particleDrift {
          0% { transform: translateY(0) scale(1); opacity: 0.2; }
          50% { opacity: 0.7; }
          100% { transform: translateY(-120px) scale(0.6); opacity: 0; }
        }

        @keyframes zoomIntoStore {
          0% { transform: scale(1); opacity: 1; filter: blur(0px); }
          100% { transform: scale(1.4); opacity: 0; filter: blur(10px); }
        }
      `}</style>

      {/* ====================================================================
          2. ATMOSPHERIC 3D COSMIC BACKGROUND
          ==================================================================== */}
      {/* Radial Nebula Glow */}
      <div
        style={{
          position: "absolute",
          top: "15%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "800px",
          height: "450px",
          background:
            "radial-gradient(ellipse at center, rgba(56, 189, 248, 0.18) 0%, rgba(245, 158, 11, 0.12) 40%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />

      {/* 3D Perspective Receding Grid Floor */}
      <div
        style={{
          position: "absolute",
          bottom: "-5%",
          left: "-20%",
          right: "-20%",
          height: "55%",
          transform: "perspective(500px) rotateX(68deg)",
          backgroundImage:
            "linear-gradient(to right, rgba(56, 189, 248, 0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(56, 189, 248, 0.12) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage: "linear-gradient(to top, rgba(0,0,0,1) 10%, transparent 95%)",
          WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,1) 10%, transparent 95%)",
          animation: "gridFlythrough 4s linear infinite",
          pointerEvents: "none",
        }}
      />

      {/* Floating Ambient Starlight Particles */}
      {[...Array(16)].map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${(i * 6.2 + 8) % 94}%`,
            top: `${(i * 11.3 + 12) % 85}%`,
            width: `${(i % 3) + 2}px`,
            height: `${(i % 3) + 2}px`,
            borderRadius: "50%",
            backgroundColor: i % 2 === 0 ? "#38BDF8" : "#F59E0B",
            boxShadow: `0 0 8px ${i % 2 === 0 ? "#38BDF8" : "#F59E0B"}`,
            animation: `particleDrift ${2.5 + (i % 3)}s ease-in-out infinite`,
            animationDelay: `${(i * 0.25).toFixed(2)}s`,
            pointerEvents: "none",
          }}
        />
      ))}

      {/* ====================================================================
          3. TOP NAVIGATION CONTROLS (Sound & Minimalist Skip)
          ==================================================================== */}
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
          <span style={{ fontSize: "18px", color: "#F59E0B" }}>⚡</span>
          <span
            style={{
              fontSize: "13px",
              fontWeight: "900",
              letterSpacing: "2px",
              color: "#FFFFFF",
              opacity: 0.8,
            }}
          >
            R-MART • 3D HYPERMARKET
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={toggleSound}
            style={{
              background: "rgba(15, 23, 42, 0.7)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#FFFFFF",
              borderRadius: "20px",
              padding: "6px 14px",
              fontSize: "12px",
              fontWeight: "700",
              cursor: "pointer",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>{soundOn ? "🔊" : "🔇"}</span>
            <span>{soundOn ? "Audio On" : "Muted"}</span>
          </button>

          <button
            onClick={handleFinish}
            style={{
              background: "rgba(245, 158, 11, 0.15)",
              border: "1px solid rgba(245, 158, 11, 0.4)",
              color: "#F59E0B",
              borderRadius: "20px",
              padding: "6px 16px",
              fontSize: "12px",
              fontWeight: "900",
              cursor: "pointer",
              backdropFilter: "blur(8px)",
            }}
          >
            ✕ Skip
          </button>
        </div>
      </div>

      {/* ====================================================================
          4. MAIN 3D COMPOSITION STAGE
          ==================================================================== */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "1000px",
          height: "560px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: phase === "zoom_enter" ? "zoomIntoStore 0.5s ease-in forwards" : "none",
        }}
      >
        {/* ------------------------------------------------------------------
            STAGE A: R-MART ARCHITECTURAL PAVILION (Luminous Horizon)
            ------------------------------------------------------------------ */}
        <div
          style={{
            position: "absolute",
            top: "8%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            opacity: phase === "device_browsing" ? 0.35 : 1,
            transform: phase === "device_browsing" ? "scale(0.9) translateY(20px)" : "scale(1) translateY(0)",
            transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* Laser Gateway Lines */}
          <div
            style={{
              width: "480px",
              height: "2px",
              background:
                "linear-gradient(90deg, transparent, #38BDF8 30%, #F59E0B 50%, #38BDF8 70%, transparent)",
              marginBottom: "14px",
              boxShadow: "0 0 16px #38BDF8",
              animation: "laserSweep 1.2s ease-out forwards",
            }}
          />

          {/* Majestic R-MART Brand Insignia */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              animation: "rmartGlowPulse 2.5s ease-in-out infinite",
            }}
          >
            <span
              style={{
                fontSize: "36px",
                color: "#F59E0B",
                filter: "drop-shadow(0 0 12px #F59E0B)",
              }}
            >
              ⚡
            </span>
            <span
              style={{
                fontSize: "44px",
                fontWeight: "900",
                letterSpacing: "6px",
                color: "#FFFFFF",
                textShadow:
                  "0 0 20px rgba(245, 158, 11, 0.6), 0 0 40px rgba(56, 189, 248, 0.4)",
              }}
            >
              R - M A R T
            </span>
          </div>

          {/* Futuristic Pavilion Glass Arch */}
          <div
            style={{
              width: "280px",
              height: "70px",
              borderTop: "2px solid rgba(56, 189, 248, 0.6)",
              borderLeft: "2px solid rgba(56, 189, 248, 0.3)",
              borderRight: "2px solid rgba(56, 189, 248, 0.3)",
              borderRadius: "140px 140px 0 0",
              background: "linear-gradient(180deg, rgba(56, 189, 248, 0.08) 0%, transparent 100%)",
              marginTop: "8px",
              boxShadow: "0 0 30px rgba(56, 189, 248, 0.25)",
            }}
          />
        </div>

        {/* ------------------------------------------------------------------
            STAGE B: FLOATING ISOMETRIC 3D SMARTPHONE (Person Browsing Store)
            ------------------------------------------------------------------ */}
        <div
          style={{
            position: "absolute",
            left: phase === "rapid_dispatch" ? "20%" : "30%",
            top: "24%",
            width: "220px",
            height: "360px",
            animation: "floatDevice 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            transition: "left 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
            transformStyle: "preserve-3d",
            zIndex: 20,
          }}
        >
          {/* Smartphone Hardware Frame (Titanium Glassmorphism) */}
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "32px",
              backgroundColor: "rgba(15, 23, 42, 0.88)",
              border: "3px solid rgba(255, 255, 255, 0.25)",
              boxShadow:
                "0 25px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(56, 189, 248, 0.3), inset 0 0 15px rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(20px)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              position: "relative",
            }}
          >
            {/* Dynamic Island Notch */}
            <div
              style={{
                width: "60px",
                height: "12px",
                backgroundColor: "#000",
                borderRadius: "10px",
                margin: "10px auto 6px auto",
                boxShadow: "0 0 4px rgba(0,0,0,0.8)",
              }}
            />

            {/* In-App Header */}
            <div
              style={{
                padding: "4px 14px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <span style={{ fontSize: "10px", fontWeight: "900", color: "#F59E0B" }}>
                ⚡ R-Mart App
              </span>
              <span
                style={{
                  fontSize: "8px",
                  color: "#10B981",
                  backgroundColor: "rgba(16, 185, 129, 0.2)",
                  padding: "1px 6px",
                  borderRadius: "999px",
                  fontWeight: "800",
                }}
              >
                ● 24h Express
              </span>
            </div>

            {/* In-App Product Scrolling Viewport */}
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
                  gap: "10px",
                  animation: "phoneScrollTrack 3.5s ease-in-out infinite alternate",
                }}
              >
                {/* Product Card 1: Smartphone */}
                <div
                  style={{
                    backgroundColor: "rgba(30, 41, 59, 0.7)",
                    border: "1px solid rgba(56, 189, 248, 0.3)",
                    borderRadius: "14px",
                    padding: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <img
                    src="https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=150"
                    alt="iPhone"
                    style={{ width: "36px", height: "36px", borderRadius: "8px", objectFit: "cover" }}
                  />
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: "900", color: "#FFF" }}>
                      iPhone 15 Titanium
                    </div>
                    <div style={{ fontSize: "9px", color: "#38BDF8", fontWeight: "800" }}>
                      $1199.99
                    </div>
                  </div>
                </div>

                {/* Product Card 2: Runner Sneakers */}
                <div
                  style={{
                    backgroundColor: "rgba(30, 41, 59, 0.7)",
                    border: "1px solid rgba(245, 158, 11, 0.3)",
                    borderRadius: "14px",
                    padding: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <img
                    src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=150"
                    alt="Nike"
                    style={{ width: "36px", height: "36px", borderRadius: "8px", objectFit: "cover" }}
                  />
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: "900", color: "#FFF" }}>
                      Nike Air Running
                    </div>
                    <div style={{ fontSize: "9px", color: "#F59E0B", fontWeight: "800" }}>
                      $99.99
                    </div>
                  </div>
                </div>

                {/* Product Card 3: Espresso Maker */}
                <div
                  style={{
                    backgroundColor: "rgba(30, 41, 59, 0.7)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    borderRadius: "14px",
                    padding: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <img
                    src="https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=150"
                    alt="Espresso"
                    style={{ width: "36px", height: "36px", borderRadius: "8px", objectFit: "cover" }}
                  />
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: "900", color: "#FFF" }}>
                      Barista Espresso XL
                    </div>
                    <div style={{ fontSize: "9px", color: "#10B981", fontWeight: "800" }}>
                      $349.99
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* In-App "Place Order" Haptic Button */}
            <div style={{ padding: "10px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <div
                style={{
                  backgroundColor: phase === "order_pulse" || phase === "rapid_dispatch" || phase === "zoom_enter" ? "#10B981" : "#F59E0B",
                  color: "#030712",
                  padding: "8px",
                  borderRadius: "10px",
                  fontSize: "11px",
                  fontWeight: "900",
                  textAlign: "center",
                  boxShadow:
                    phase === "order_pulse"
                      ? "0 0 20px #10B981, inset 0 0 10px #FFFFFF"
                      : "0 4px 14px rgba(245, 158, 11, 0.4)",
                  transform: phase === "order_pulse" ? "scale(0.96)" : "scale(1)",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <span>{phase === "order_pulse" || phase === "rapid_dispatch" || phase === "zoom_enter" ? "✔" : "⚡"}</span>
                <span>
                  {phase === "order_pulse" || phase === "rapid_dispatch" || phase === "zoom_enter"
                    ? "ORDER CONFIRMED"
                    : "PLACE ORDER"}
                </span>
              </div>
            </div>
          </div>

          {/* Perspective Shadow Beneath Phone */}
          <div
            style={{
              width: "180px",
              height: "20px",
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              borderRadius: "50%",
              filter: "blur(10px)",
              margin: "-10px auto 0 auto",
            }}
          />
        </div>

        {/* ------------------------------------------------------------------
            STAGE C: 3D SHOCKWAVE PULSE (Expands across floor upon Order Tap)
            ------------------------------------------------------------------ */}
        {(phase === "order_pulse" || phase === "rapid_dispatch" || phase === "zoom_enter") && (
          <div
            style={{
              position: "absolute",
              left: "40%",
              top: "55%",
              width: "350px",
              height: "350px",
              borderRadius: "50%",
              border: "3px solid #38BDF8",
              boxShadow: "0 0 40px rgba(56, 189, 248, 0.8), inset 0 0 20px rgba(245, 158, 11, 0.5)",
              animation: "shockwave3D 1.2s cubic-bezier(0.1, 0.8, 0.3, 1) forwards",
              pointerEvents: "none",
            }}
          />
        )}

        {/* ------------------------------------------------------------------
            STAGE D: HIGH-TECH AUTOMATED DISPATCH POD & LUXURY PARCEL DELIVERY
            ------------------------------------------------------------------ */}
        {(phase === "rapid_dispatch" || phase === "zoom_enter") && (
          <div
            style={{
              position: "absolute",
              right: "22%",
              top: "22%",
              zIndex: 30,
              animation: "dispatchSwoop 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {/* Aerodynamic High-Tech Dispatch Carrier Drone / Pod */}
            <div style={{ position: "relative", width: "160px", height: "70px", marginBottom: "12px" }}>
              <svg width="160" height="70" viewBox="0 0 160 70">
                {/* Thruster Cyan Glow */}
                <ellipse cx="25" cy="35" rx="14" ry="6" fill="#38BDF8" opacity="0.6" filter="blur(4px)" />
                <ellipse cx="135" cy="35" rx="14" ry="6" fill="#38BDF8" opacity="0.6" filter="blur(4px)" />

                {/* Cybernetic Pod Wings */}
                <path d="M 10,35 Q 40,15 80,18 Q 120,15 150,35 Q 110,48 80,45 Q 50,48 10,35 Z" fill="#0F172A" stroke="#38BDF8" strokeWidth="2" />

                {/* Central Cockpit / Sensor Eye */}
                <ellipse cx="80" cy="30" rx="20" ry="9" fill="#1E293B" stroke="#F59E0B" strokeWidth="1.5" />
                <circle cx="80" cy="30" r="4" fill="#F59E0B" />

                {/* Pulse Light */}
                <line x1="40" y1="36" x2="120" y2="36" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="4 2" />
              </svg>
            </div>

            {/* Luxury Gold-Embossed R-MART Parcel Box */}
            <div
              style={{
                width: "120px",
                height: "90px",
                backgroundColor: "#F59E0B",
                borderRadius: "14px",
                border: "2px solid #B45309",
                boxShadow:
                  "0 20px 40px rgba(0, 0, 0, 0.8), 0 0 30px rgba(245, 158, 11, 0.5), inset 0 2px 6px rgba(255, 255, 255, 0.4)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                animation: "parcelDropGently 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                position: "relative",
              }}
            >
              {/* Premium Ribbon */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  width: "16px",
                  backgroundColor: "#030712",
                  opacity: 0.85,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  height: "14px",
                  backgroundColor: "#030712",
                  opacity: 0.85,
                }}
              />

              {/* R-MART Gold Badge Emblem */}
              <div
                style={{
                  position: "relative",
                  zIndex: 2,
                  backgroundColor: "#030712",
                  border: "1px solid #F59E0B",
                  borderRadius: "8px",
                  padding: "4px 8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  boxShadow: "0 0 10px rgba(245, 158, 11, 0.6)",
                }}
              >
                <span style={{ color: "#F59E0B", fontSize: "11px" }}>⚡</span>
                <span
                  style={{
                    color: "#FFFFFF",
                    fontSize: "11px",
                    fontWeight: "900",
                    letterSpacing: "1px",
                  }}
                >
                  R-MART
                </span>
              </div>
            </div>

            {/* Holographic Delivery Pedestal */}
            <div
              style={{
                width: "160px",
                height: "18px",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(56, 189, 248, 0.5) 0%, transparent 75%)",
                filter: "blur(6px)",
                marginTop: "12px",
              }}
            />
          </div>
        )}
      </div>

      {/* ====================================================================
          5. BOTTOM STREAMLINED PROGRESS BAR & INSTRUCTION
          ==================================================================== */}
      <div
        style={{
          position: "absolute",
          bottom: "32px",
          width: "100%",
          maxWidth: "460px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "10px",
          zIndex: 50,
        }}
      >
        {/* Progress Track */}
        <div
          style={{
            width: "100%",
            height: "3px",
            backgroundColor: "rgba(255, 255, 255, 0.12)",
            borderRadius: "999px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              background: "linear-gradient(90deg, #38BDF8, #F59E0B)",
              boxShadow: "0 0 8px #F59E0B",
              transition: "width 0.05s linear",
            }}
          />
        </div>

        {/* Minimalist Hint */}
        <div
          style={{
            fontSize: "11px",
            fontWeight: "700",
            letterSpacing: "1px",
            color: "rgba(255, 255, 255, 0.5)",
            textTransform: "uppercase",
          }}
        >
          Tap anywhere to enter store
        </div>
      </div>
    </div>
  );
}
