import React, { useState, useEffect } from "react";

// ============================================================================
// PROFESSIONAL AUDIO ENGINE (Clean, Minimal, High-Fidelity Web Audio API)
// ============================================================================
class ProfessionalAudioEngine {
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

  // Soft low-frequency footsteps on polished floor
  playFootstep() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const t = now + i * 0.38;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(90, t);
        osc.frequency.exponentialRampToValueAtTime(35, t + 0.12);
        gain.gain.setValueAtTime(0.04, t);
        gain.gain.linearRampToValueAtTime(0.001, t + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.12);
      }
    } catch (e) {}
  }

  // Refined futuristic glass tap on phone
  playOrderConfirm() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.2); // A6
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {}
  }

  // Deep cinematic sub-bass whoosh as banner descends
  playCinematicWhoosh() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.9);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.9);
    } catch (e) {}
  }

  // Solid, clean floor impact when banner lands on floor
  playBannerFloorImpact() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(25, now + 0.6);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.65);
    } catch (e) {}
  }

  // Atmospheric chord when showroom illuminates
  playAtmosphericChime() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const notes = [440, 554.37, 659.25, 880]; // A major
      notes.forEach((freq, idx) => {
        const now = this.ctx.currentTime + idx * 0.06;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 1.2);
      });
    } catch (e) {}
  }
}

const audio = new ProfessionalAudioEngine();

// ============================================================================
// STYLIZED 3D AVATAR (EXECUTIVE HUMAN FIGURE WITH REFLECTIVE EDGELIGHTING)
// ============================================================================
function ProfessionalAvatar({ isHoldingPhone, isTapping, isHoldingBox }) {
  return (
    <div
      style={{
        position: "relative",
        width: "140px",
        height: "260px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* 3D Human Avatar Figure SVG */}
      <svg
        width="140"
        height="260"
        viewBox="0 0 140 260"
        style={{
          filter: "drop-shadow(0 15px 25px rgba(0,0,0,0.9))",
        }}
      >
        <defs>
          {/* Subtle Cyberpunk/Luxury Cyan Rim Light */}
          <linearGradient id="bodyRim" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
            <stop offset="30%" stopColor="#1E293B" stopOpacity="0.9" />
            <stop offset="70%" stopColor="#0F172A" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.8" />
          </linearGradient>

          {/* Skin Tone Lighting */}
          <linearGradient id="headGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#64748B" />
          </linearGradient>

          {/* Luxury Matte Jacket */}
          <linearGradient id="suitGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>
        </defs>

        {/* Head & Stylized Hair */}
        <circle cx="70" cy="40" r="18" fill="url(#headGrad)" stroke="#38BDF8" strokeWidth="1.5" />
        {/* Sleek Hair Cut */}
        <path
          d="M 52,38 Q 50,18 70,18 Q 90,18 88,38 Q 84,24 70,24 Q 56,24 52,38 Z"
          fill="#0F172A"
          stroke="#38BDF8"
          strokeWidth="0.8"
        />

        {/* Neck */}
        <rect x="66" y="58" width="8" height="10" fill="#64748B" />

        {/* Torso / Modern Minimalist Blazer */}
        <path
          d="M 44,68 L 96,68 L 90,148 L 50,148 Z"
          fill="url(#bodyRim)"
          stroke="#38BDF8"
          strokeWidth="1.5"
        />

        {/* Lapel & Clean Tie / Collar Lines */}
        <polygon points="70,68 62,105 70,130 78,105" fill="#0B0F19" stroke="#38BDF8" strokeWidth="1" />
        <line x1="70" y1="80" x2="70" y2="128" stroke="#F59E0B" strokeWidth="1.5" />

        {/* Arms */}
        {isHoldingPhone ? (
          // Arms Raised Holding Smartphone
          <g>
            <path
              d="M 44,72 Q 40,105 58,118"
              fill="none"
              stroke="#1E293B"
              strokeWidth="10"
              strokeLinecap="round"
            />
            <path
              d="M 96,72 Q 100,105 82,118"
              fill="none"
              stroke="#1E293B"
              strokeWidth="10"
              strokeLinecap="round"
            />

            {/* Futuristic Glass Smartphone */}
            <g transform="translate(62, 102)">
              <rect
                x="0"
                y="0"
                width="16"
                height="30"
                rx="3"
                fill="rgba(15, 23, 42, 0.9)"
                stroke="#38BDF8"
                strokeWidth="1.5"
              />
              <rect x="2" y="3" width="12" height="24" rx="2" fill="#0284C7" opacity="0.8" />
              {/* Screen Pulse when Tapping */}
              {isTapping ? (
                <circle cx="8" cy="15" r="4" fill="#F59E0B">
                  <animate attributeName="r" values="2;9" dur="0.4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;0" dur="0.4s" repeatCount="indefinite" />
                </circle>
              ) : (
                <rect x="4" y="16" width="8" height="4" rx="1" fill="#F59E0B" />
              )}
            </g>

            {/* Avatar Hands */}
            <circle cx="58" cy="118" r="5" fill="#94A3B8" />
            <circle cx="82" cy="118" r="5" fill="#94A3B8" />
          </g>
        ) : isHoldingBox ? (
          // Arms Wrapped Holding Delivered Package
          <g>
            <path
              d="M 44,72 Q 32,105 50,132"
              fill="none"
              stroke="#1E293B"
              strokeWidth="10"
              strokeLinecap="round"
            />
            <path
              d="M 96,72 Q 108,105 90,132"
              fill="none"
              stroke="#1E293B"
              strokeWidth="10"
              strokeLinecap="round"
            />
            {/* Package in Front */}
            <g transform="translate(42, 110)">
              <rect
                x="0"
                y="0"
                width="56"
                height="44"
                rx="4"
                fill="#0F172A"
                stroke="#F59E0B"
                strokeWidth="2"
              />
              <line x1="28" y1="0" x2="28" y2="44" stroke="#F59E0B" strokeWidth="2" />
              <line x1="0" y1="22" x2="56" y2="22" stroke="#F59E0B" strokeWidth="2" />
              <text x="28" y="26" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="900" fontFamily="system-ui">
                R-MART
              </text>
            </g>
            <circle cx="48" cy="132" r="5" fill="#94A3B8" />
            <circle cx="92" cy="132" r="5" fill="#94A3B8" />
          </g>
        ) : (
          // Neutral Arms at Side
          <g>
            <path d="M 44,72 L 36,140" stroke="#1E293B" strokeWidth="10" strokeLinecap="round" />
            <path d="M 96,72 L 104,140" stroke="#1E293B" strokeWidth="10" strokeLinecap="round" />
            <circle cx="36" cy="144" r="5" fill="#94A3B8" />
            <circle cx="104" cy="144" r="5" fill="#94A3B8" />
          </g>
        )}

        {/* Tapered Tailored Trousers */}
        <line x1="58" y1="148" x2="54" y2="235" stroke="#0F172A" strokeWidth="12" strokeLinecap="round" />
        <line x1="82" y1="148" x2="86" y2="235" stroke="#0F172A" strokeWidth="12" strokeLinecap="round" />
        {/* Subtle Cyan Crease Lighting */}
        <line x1="58" y1="150" x2="54" y2="230" stroke="#38BDF8" strokeWidth="1" opacity="0.4" />
        <line x1="82" y1="150" x2="86" y2="230" stroke="#38BDF8" strokeWidth="1" opacity="0.4" />

        {/* Formal Chelsea Boots / Shoes */}
        <polygon points="46,238 62,238 66,248 42,248" fill="#000000" stroke="#334155" strokeWidth="1" />
        <polygon points="78,238 94,238 98,248 74,248" fill="#000000" stroke="#334155" strokeWidth="1" />
      </svg>

      {/* Realistic Ground Mirror Reflection */}
      <div
        style={{
          position: "absolute",
          top: "245px",
          width: "140px",
          height: "120px",
          opacity: 0.22,
          transform: "scaleY(-1)",
          filter: "blur(2px)",
          maskImage: "linear-gradient(to top, transparent, black)",
          WebkitMaskImage: "linear-gradient(to top, transparent, black)",
          pointerEvents: "none",
        }}
      >
        <svg width="140" height="260" viewBox="0 0 140 260">
          <circle cx="70" cy="40" r="18" fill="#64748B" />
          <path d="M 44,68 L 96,68 L 90,148 L 50,148 Z" fill="#0F172A" />
          <line x1="58" y1="148" x2="54" y2="235" stroke="#0F172A" strokeWidth="12" />
          <line x1="82" y1="148" x2="86" y2="235" stroke="#0F172A" strokeWidth="12" />
        </svg>
      </div>
    </div>
  );
}

// ============================================================================
// SLEEK METALLIC DELIVERY PARCEL
// ============================================================================
function LuxuryParcel({ size = 80, delay = 0 }) {
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        position: "relative",
        animation: `dropSettle 1.1s cubic-bezier(0.2, 0.9, 0.3, 1) ${delay}s forwards`,
        opacity: 0,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        style={{ filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.85))" }}
      >
        {/* Main Box Face */}
        <rect
          x="12"
          y="28"
          width="76"
          height="62"
          rx="6"
          fill="#0B0F19"
          stroke="#1E293B"
          strokeWidth="2.5"
        />
        {/* Top 3D Flap Shading */}
        <polygon
          points="12,28 28,12 88,12 72,28"
          fill="#131B2E"
          stroke="#1E293B"
          strokeWidth="2"
        />
        <polygon
          points="88,12 72,28 88,90"
          fill="#070A11"
          opacity="0.8"
        />
        {/* Gold Metallic Security Band */}
        <rect x="44" y="12" width="12" height="78" fill="#F59E0B" opacity="0.9" />
        {/* Horizontal Laser Seam */}
        <line x1="12" y1="56" x2="88" y2="56" stroke="#38BDF8" strokeWidth="1.5" opacity="0.7" />
        {/* R-Mart Monogram Emblem */}
        <circle cx="50" cy="56" r="13" fill="#000000" stroke="#F59E0B" strokeWidth="1.5" />
        <text
          x="50"
          y="61"
          textAnchor="middle"
          fill="#F59E0B"
          fontSize="11"
          fontWeight="900"
          fontFamily="system-ui"
        >
          ⚡R
        </text>
      </svg>
    </div>
  );
}

// ============================================================================
// SECONDARY WALKING SILHOUETTE (OTHER PEOPLE ENTERING)
// ============================================================================
function WalkingShopperSilhouette({ direction = "right" }) {
  const isRight = direction === "right";
  return (
    <svg
      width="90"
      height="180"
      viewBox="0 0 90 180"
      style={{
        transform: isRight ? "scaleX(1)" : "scaleX(-1)",
        opacity: 0.65,
        filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.8))",
      }}
    >
      {/* Head */}
      <circle cx="45" cy="28" r="14" fill="#334155" stroke="#38BDF8" strokeWidth="1" />
      {/* Body */}
      <path d="M 28,48 L 62,48 L 56,108 L 34,108 Z" fill="#1E293B" stroke="#38BDF8" strokeWidth="1" />
      {/* Arms Carrying Package */}
      <path d="M 30,52 Q 22,78 40,88" stroke="#1E293B" strokeWidth="7" strokeLinecap="round" fill="none" />
      <path d="M 60,52 Q 68,78 50,88" stroke="#1E293B" strokeWidth="7" strokeLinecap="round" fill="none" />
      <rect x="36" y="74" width="22" height="18" rx="2" fill="#0B0F19" stroke="#F59E0B" strokeWidth="1" />
      {/* Walking Legs */}
      <line x1="38" y1="108" x2="26" y2="162" stroke="#0F172A" strokeWidth="9" strokeLinecap="round" />
      <line x1="52" y1="108" x2="64" y2="162" stroke="#0F172A" strokeWidth="9" strokeLinecap="round" />
      <ellipse cx="22" cy="165" rx="8" ry="4" fill="#000" />
      <ellipse cx="68" cy="165" rx="8" ry="4" fill="#000" />
    </svg>
  );
}

// ============================================================================
// MAIN PROFESSIONAL CINEMATIC WEBSITE INTRO
// ============================================================================
export default function CinematicIntro({ onFinish }) {
  // Timeline Stages:
  // 1: "walk_in" (Avatar walks in smoothly into center)
  // 2: "place_order" (Avatar lifts phone and places order, haptic wave ripples)
  // 3: "boxes_fall" (Metallic R-Mart boxes drop from darkness and settle onto floor)
  // 4: "banner_floor_drop" (Monumental R-Mart banner drops from top down ONTO FLOOR)
  // 5: "mart_illuminate" (Hypermarket environment lights up with shoppers entering)
  // 6: "executive_ready" (100% Trusted, 24-48h Delivery + START SHOPPING button)

  const [stage, setStage] = useState("walk_in");
  const [soundOn, setSoundOn] = useState(true);

  const toggleSound = () => {
    audio.init();
    audio.isMuted = soundOn;
    setSoundOn(!soundOn);
  };

  useEffect(() => {
    audio.playFootstep();

    // 1 -> 2: Place order
    const t1 = setTimeout(() => {
      setStage("place_order");
      audio.playOrderConfirm();
    }, 2200);

    // 2 -> 3: Boxes fall
    const t2 = setTimeout(() => {
      setStage("boxes_fall");
      audio.playCinematicWhoosh();
    }, 4200);

    // 3 -> 4: Banner drops from top down ONTO FLOOR
    const t3 = setTimeout(() => {
      setStage("banner_floor_drop");
      audio.playBannerFloorImpact();
    }, 6600);

    // 4 -> 5: Mart illuminates & People enter
    const t4 = setTimeout(() => {
      setStage("mart_illuminate");
      audio.playAtmosphericChime();
    }, 9200);

    // 5 -> 6: Executive Ready & Start Shopping
    const t5 = setTimeout(() => {
      setStage("executive_ready");
    }, 11400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, []);

  const isIlluminated = stage === "mart_illuminate" || stage === "executive_ready";
  const hasBannerLanded =
    stage === "banner_floor_drop" ||
    stage === "mart_illuminate" ||
    stage === "executive_ready";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        backgroundColor: "#000000",
        overflow: "hidden",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        userSelect: "none",
      }}
    >
      {/* ====================================================================
          CINEMATIC LIGHTING & ARCHITECTURAL HYPERMARKET ATRIUM
          ==================================================================== */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          transition: "opacity 1.5s cubic-bezier(0.16, 1, 0.3, 1)",
          opacity: isIlluminated ? 1 : 0.2,
          background: isIlluminated
            ? "radial-gradient(circle at 50% 20%, rgba(30, 58, 138, 0.3) 0%, rgba(15, 23, 42, 0.7) 50%, #000000 100%)"
            : "radial-gradient(circle at 50% 0%, rgba(56, 189, 248, 0.15) 0%, #000000 70%)",
        }}
      >
        {/* Overhead Skylight Beams */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "15%",
            right: "15%",
            height: "2px",
            background:
              "linear-gradient(90deg, transparent, #38BDF8, #F59E0B, #38BDF8, transparent)",
            boxShadow: "0 0 40px #38BDF8, 0 0 80px rgba(56, 189, 248, 0.5)",
          }}
        />

        {/* Ambient Architectural Aisle Pillars */}
        {isIlluminated && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              justifyContent: "space-between",
              padding: "0 80px",
              opacity: 0.18,
            }}
          >
            <div style={{ width: "80px", height: "100%", borderRight: "1px dashed #38BDF8" }} />
            <div style={{ width: "80px", height: "100%", borderLeft: "1px dashed #38BDF8" }} />
          </div>
        )}
      </div>

      {/* ====================================================================
          HIGH-GLOSS REFLECTIVE SHOWROOM FLOOR WITH PERSPECTIVE GRID
          ==================================================================== */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "42%",
          background:
            "linear-gradient(to top, rgba(15, 23, 42, 0.8) 0%, rgba(0, 0, 0, 0.95) 100%)",
          perspective: "800px",
          pointerEvents: "none",
          borderTop: "1px solid rgba(56, 189, 248, 0.2)",
        }}
      >
        {/* Perspective Grid Floor */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(56, 189, 248, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 189, 248, 0.08) 1px, transparent 1px)",
            backgroundSize: "60px 40px",
            transform: "rotateX(60deg)",
            transformOrigin: "top center",
          }}
        />
      </div>

      {/* Top Header Controls: Sound & Skip */}
      <div
        style={{
          position: "absolute",
          top: "28px",
          left: "32px",
          right: "32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 60,
        }}
      >
        <button
          onClick={toggleSound}
          style={{
            background: "rgba(15, 23, 42, 0.65)",
            border: "1px solid rgba(56, 189, 248, 0.3)",
            color: soundOn ? "#38BDF8" : "#94A3B8",
            padding: "8px 16px",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: "700",
            cursor: "pointer",
            backdropFilter: "blur(16px)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>{soundOn ? "🔊" : "🔇"}</span>
          <span>{soundOn ? "AUDIO ACTIVE" : "MUTED"}</span>
        </button>

        <button
          onClick={onFinish}
          style={{
            background: "rgba(245, 158, 11, 0.12)",
            border: "1px solid rgba(245, 158, 11, 0.4)",
            color: "#F59E0B",
            padding: "8px 20px",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: "800",
            cursor: "pointer",
            backdropFilter: "blur(16px)",
            letterSpacing: "0.5px",
          }}
        >
          SKIP INTRO ➔
        </button>
      </div>

      {/* ====================================================================
          STAGE 4: R-MART BANNER DROPS FROM TOP DIRECTLY ONTO THE FLOOR
          ==================================================================== */}
      {hasBannerLanded && (
        <div
          style={{
            position: "absolute",
            bottom: "85px",
            zIndex: 35,
            animation: "bannerDropToFloor 0.95s cubic-bezier(0.18, 0.95, 0.28, 1) forwards",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Monumental 3D Monolith Architectural Sign */}
          <div
            style={{
              backgroundColor: "rgba(10, 15, 29, 0.88)",
              border: "2px solid #F59E0B",
              borderRadius: "16px",
              padding: "16px 48px",
              boxShadow:
                "0 20px 50px rgba(0, 0, 0, 0.9), 0 0 35px rgba(245, 158, 11, 0.45), inset 0 0 20px rgba(245, 158, 11, 0.2)",
              backdropFilter: "blur(20px)",
              textAlign: "center",
              display: "flex",
              alignItems: "center",
              gap: "20px",
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
            <div>
              <div
                style={{
                  fontSize: "38px",
                  fontWeight: "900",
                  color: "#FFFFFF",
                  letterSpacing: "6px",
                  textShadow: "0 0 25px rgba(245, 158, 11, 0.6)",
                }}
              >
                R - M A R T
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "#38BDF8",
                  fontWeight: "800",
                  letterSpacing: "3px",
                  textTransform: "uppercase",
                  marginTop: "2px",
                }}
              >
                Autonomous 24-48H Global Storefront
              </div>
            </div>
            <span
              style={{
                fontSize: "36px",
                color: "#F59E0B",
                filter: "drop-shadow(0 0 12px #F59E0B)",
              }}
            >
              ⚡
            </span>
          </div>

          {/* Floor Impact Contact Line */}
          <div
            style={{
              width: "120%",
              height: "4px",
              background:
                "linear-gradient(90deg, transparent, #F59E0B, #38BDF8, #F59E0B, transparent)",
              boxShadow: "0 0 20px #F59E0B, 0 0 35px #38BDF8",
              borderRadius: "999px",
              marginTop: "4px",
            }}
          />
        </div>
      )}

      {/* ====================================================================
          CENTER STAGE: AVATAR, ORDER PLACEMENT, AND FALLING BOXES
          ==================================================================== */}
      <div
        style={{
          position: "relative",
          zIndex: 30,
          width: "100%",
          maxWidth: "1000px",
          height: "440px",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
        }}
      >
        {/* AVATAR: WALKS IN, PLACES ORDER, AND RECEIVES BOX */}
        <div
          style={{
            position: "absolute",
            bottom: "45px",
            left: stage === "walk_in" ? "40%" : "50%",
            transform:
              stage === "walk_in"
                ? "translateX(-140px)"
                : "translateX(-50%)",
            transition: "all 1.8s cubic-bezier(0.16, 1, 0.3, 1)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* HOLOGRAPHIC MINIMALIST ORDER CONFIRMATION BADGE */}
          {(stage === "walk_in" || stage === "place_order") && (
            <div
              style={{
                marginBottom: "16px",
                backgroundColor: "rgba(15, 23, 42, 0.85)",
                border: `1px solid ${
                  stage === "place_order" ? "#10B981" : "#38BDF8"
                }`,
                borderRadius: "12px",
                padding: "8px 18px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                boxShadow:
                  stage === "place_order"
                    ? "0 0 25px rgba(16, 185, 129, 0.5)"
                    : "0 0 15px rgba(56, 189, 248, 0.3)",
                backdropFilter: "blur(14px)",
                animation:
                  stage === "place_order"
                    ? "pulse 0.4s ease"
                    : "floatSubtle 2.5s infinite ease-in-out",
              }}
            >
              <span style={{ fontSize: "16px" }}>⚡</span>
              <div>
                <div style={{ fontSize: "10px", color: "#38BDF8", fontWeight: "800" }}>
                  CART SUMMARY (2 ITEMS)
                </div>
                <div style={{ fontSize: "13px", fontWeight: "900", color: "#FFFFFF" }}>
                  {stage === "place_order" ? "✔ ORDER CONFIRMED" : "PLACE ORDER"}
                </div>
              </div>
              <div
                style={{
                  backgroundColor:
                    stage === "place_order" ? "#10B981" : "#F59E0B",
                  color: "#000",
                  fontSize: "10px",
                  fontWeight: "900",
                  padding: "4px 10px",
                  borderRadius: "6px",
                }}
              >
                {stage === "place_order" ? "200 OK" : "SUBMIT"}
              </div>
            </div>
          )}

          {/* 3D Human Avatar Model */}
          <ProfessionalAvatar
            isHoldingPhone={stage === "walk_in" || stage === "place_order"}
            isTapping={stage === "place_order"}
            isHoldingBox={hasBannerLanded}
          />
        </div>

        {/* ====================================================================
            STAGE 3: LUXURY BOXES FALL FROM DARKNESS ONTO FLOOR
            ==================================================================== */}
        {(stage === "boxes_fall" ||
          stage === "banner_floor_drop" ||
          stage === "mart_illuminate" ||
          stage === "executive_ready") && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              zIndex: 25,
            }}
          >
            {/* Box Left */}
            <div
              style={{
                position: "absolute",
                left: "30%",
                bottom: "45px",
              }}
            >
              <LuxuryParcel size={70} delay={0.1} />
            </div>

            {/* Box Right */}
            <div
              style={{
                position: "absolute",
                right: "30%",
                bottom: "45px",
              }}
            >
              <LuxuryParcel size={75} delay={0.25} />
            </div>
          </div>
        )}

        {/* ====================================================================
            STAGE 5: OTHER PEOPLE ENTER WALKING ACROSS THE FLOOR
            ==================================================================== */}
        {(stage === "mart_illuminate" || stage === "executive_ready") && (
          <>
            {/* Shopper Entering from Left */}
            <div
              style={{
                position: "absolute",
                bottom: "40px",
                left: "10%",
                animation: "walkInSmoothLeft 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                zIndex: 22,
              }}
            >
              <WalkingShopperSilhouette direction="right" />
            </div>

            {/* Shopper Entering from Right */}
            <div
              style={{
                position: "absolute",
                bottom: "40px",
                right: "10%",
                animation: "walkInSmoothRight 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                zIndex: 22,
              }}
            >
              <WalkingShopperSilhouette direction="left" />
            </div>
          </>
        )}
      </div>

      {/* ====================================================================
          STAGE 6: EXECUTIVE DIALOGUE BADGES & START SHOPPING ACTION
          "100% Trusted - Get Delivered in 24-48 hours"
          ==================================================================== */}
      {stage === "executive_ready" && (
        <div
          style={{
            position: "relative",
            zIndex: 50,
            marginTop: "20px",
            textAlign: "center",
            animation: "fadeInUpSmooth 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          }}
        >
          {/* Executive Trust Badges */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "16px",
              flexWrap: "wrap",
              marginBottom: "20px",
            }}
          >
            {/* 100% Trusted */}
            <div
              style={{
                backgroundColor: "rgba(16, 185, 129, 0.12)",
                border: "1px solid #10B981",
                color: "#10B981",
                padding: "10px 24px",
                borderRadius: "10px",
                fontWeight: "900",
                fontSize: "16px",
                letterSpacing: "0.5px",
                boxShadow: "0 0 20px rgba(16, 185, 129, 0.25)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                backdropFilter: "blur(12px)",
              }}
            >
              <span>🛡️</span>
              <span>100% Trusted</span>
            </div>

            {/* Get Delivered in 24-48 hours */}
            <div
              style={{
                backgroundColor: "rgba(56, 189, 248, 0.12)",
                border: "1px solid #38BDF8",
                color: "#38BDF8",
                padding: "10px 24px",
                borderRadius: "10px",
                fontWeight: "900",
                fontSize: "16px",
                letterSpacing: "0.5px",
                boxShadow: "0 0 20px rgba(56, 189, 248, 0.25)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                backdropFilter: "blur(12px)",
              }}
            >
              <span>⚡</span>
              <span>Get Delivered in 24-48 hours</span>
            </div>
          </div>

          {/* START SHOPPING BUTTON: TAKE THEM INTO WEBSITE */}
          <button
            onClick={onFinish}
            style={{
              backgroundColor: "#F59E0B",
              color: "#030712",
              border: "none",
              padding: "16px 52px",
              borderRadius: "12px",
              fontSize: "18px",
              fontWeight: "900",
              cursor: "pointer",
              boxShadow:
                "0 10px 35px rgba(245, 158, 11, 0.45), 0 0 20px rgba(245, 158, 11, 0.3)",
              display: "inline-flex",
              alignItems: "center",
              gap: "12px",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.boxShadow =
                "0 15px 45px rgba(245, 158, 11, 0.65), 0 0 30px rgba(245, 158, 11, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow =
                "0 10px 35px rgba(245, 158, 11, 0.45), 0 0 20px rgba(245, 158, 11, 0.3)";
            }}
          >
            <span>🛍️</span>
            <span>START SHOPPING</span>
            <span>➔</span>
          </button>
        </div>
      )}

      {/* Embedded Keyframe Physics */}
      <style>{`
        @keyframes bannerDropToFloor {
          0% { transform: translateY(-380px) scale(0.85); opacity: 0; }
          70% { transform: translateY(0px) scale(1.02); opacity: 1; }
          85% { transform: translateY(-10px) scale(0.99); }
          100% { transform: translateY(0px) scale(1); opacity: 1; }
        }

        @keyframes dropSettle {
          0% { transform: translateY(-280px) scale(0.7); opacity: 0; }
          65% { transform: translateY(0px) scale(1.06); opacity: 1; }
          82% { transform: translateY(-12px) scale(0.97); }
          100% { transform: translateY(0px) scale(1); opacity: 1; }
        }

        @keyframes walkInSmoothLeft {
          0% { transform: translateX(-180px); opacity: 0; }
          100% { transform: translateX(0); opacity: 0.65; }
        }

        @keyframes walkInSmoothRight {
          0% { transform: translateX(180px); opacity: 0; }
          100% { transform: translateX(0); opacity: 0.65; }
        }

        @keyframes fadeInUpSmooth {
          0% { opacity: 0; transform: translateY(24px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes floatSubtle {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
