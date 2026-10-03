import React, { useState, useEffect } from "react";

// Web Audio API Sound FX Engine (Procedural, 100% Offline, Zero Dependencies)
class CinematicSoundEngine {
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

  playFootsteps() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const t = now + i * 0.35;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(80, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.1);
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.linearRampToValueAtTime(0.001, t + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.1);
      }
    } catch (e) {}
  }

  playOrderClick() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.08); // A5
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {}
  }

  playBannerLaunch() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.5);
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.6);
    } catch (e) {}
  }

  playBoxDropBonk() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.3);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {}
  }

  playSuccessChime() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const chords = [523.25, 659.25, 783.99, 1046.5]; // C major
      chords.forEach((freq, idx) => {
        const now = this.ctx.currentTime + idx * 0.08;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.8);
      });
    } catch (e) {}
  }
}

const sfx = new CinematicSoundEngine();

export default function CinematicIntro({ onFinish }) {
  // Storyline Stages:
  // 1: "walk_in" (Person enters scrolling phone)
  // 2: "tap_order" (Clicks place order)
  // 3: "banner_launch" (From top banner launches: R-Mart)
  // 4: "mart_transform" (Background changes to R-Mart)
  // 5: "boxes_drop" (Boxes drop on his head, sits holding box)
  // 6: "people_enter" (Other people enter taking boxes)
  // 7: "show_dialogues" (100% Trusted - Get Delivered in 24-48 hours)
  // 8: "start_shopping" (START SHOPPING button ready)

  const [stage, setStage] = useState("walk_in");
  const [soundOn, setSoundOn] = useState(true);

  const toggleSound = () => {
    sfx.init();
    sfx.isMuted = soundOn;
    setSoundOn(!soundOn);
  };

  useEffect(() => {
    sfx.playFootsteps();

    // Timeline Sequence:
    const t1 = setTimeout(() => {
      setStage("tap_order");
      sfx.playOrderClick();
    }, 2400);

    const t2 = setTimeout(() => {
      setStage("banner_launch");
      sfx.playBannerLaunch();
    }, 4200);

    const t3 = setTimeout(() => {
      setStage("mart_transform");
    }, 6200);

    const t4 = setTimeout(() => {
      setStage("boxes_drop");
      sfx.playBoxDropBonk();
    }, 8200);

    const t5 = setTimeout(() => {
      setStage("people_enter");
    }, 10800);

    const t6 = setTimeout(() => {
      setStage("show_dialogues");
      sfx.playSuccessChime();
    }, 13000);

    const t7 = setTimeout(() => {
      setStage("start_shopping");
    }, 15200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
      clearTimeout(t7);
    };
  }, []);

  const isMartBg =
    stage === "mart_transform" ||
    stage === "boxes_drop" ||
    stage === "people_enter" ||
    stage === "show_dialogues" ||
    stage === "start_shopping";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        backgroundColor: "#030712",
        overflow: "hidden",
        fontFamily: "'Inter', system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* ====================================================================
          BACKGROUND: BLACK INITIALLY -> TRANSFORMS TO R-MART STOREFRONT
          ==================================================================== */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: isMartBg ? 1 : 0,
          transition: "opacity 1.2s ease-in-out",
          background: isMartBg
            ? "radial-gradient(ellipse at 50% 30%, rgba(30, 58, 138, 0.45) 0%, rgba(15, 23, 42, 0.95) 70%, #030712 100%)"
            : "#030712",
          zIndex: 1,
        }}
      >
        {/* Animated Supermarket Aisles & Neon Shelf Lights */}
        {isMartBg && (
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            {/* Ceiling Lights */}
            <div
              style={{
                position: "absolute",
                top: "10%",
                left: "10%",
                right: "10%",
                height: "6px",
                background: "linear-gradient(90deg, transparent, #38BDF8, #F59E0B, #38BDF8, transparent)",
                boxShadow: "0 0 25px #38BDF8, 0 0 45px #38BDF8",
                borderRadius: "999px",
              }}
            />

            {/* Glowing Supermarket Storefront Wall */}
            <div
              style={{
                position: "absolute",
                top: "15%",
                left: "50%",
                transform: "translateX(-50%)",
                textAlign: "center",
                opacity: 0.25,
              }}
            >
              <div style={{ fontSize: "52px", fontWeight: "900", color: "#38BDF8", letterSpacing: "8px" }}>
                R-MART SUPERSTORE
              </div>
              <div style={{ fontSize: "16px", color: "#F59E0B", fontWeight: "800", letterSpacing: "4px" }}>
                AISLE 01 • RAPID AUTOMATED DISPATCH HUB
              </div>
            </div>

            {/* Supermarket Shelves & Grid Lines */}
            <div
              style={{
                position: "absolute",
                bottom: "0",
                left: "0",
                right: "0",
                height: "45%",
                backgroundImage:
                  "linear-gradient(rgba(56, 189, 248, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 189, 248, 0.08) 1px, transparent 1px)",
                backgroundSize: "60px 40px",
                transform: "perspective(600px) rotateX(45deg)",
                transformOrigin: "bottom",
              }}
            />
          </div>
        )}
      </div>

      {/* Top Controls: Sound Toggle & Skip */}
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
        <button
          onClick={toggleSound}
          style={{
            background: "rgba(15, 23, 42, 0.75)",
            border: "1px solid rgba(56, 189, 248, 0.3)",
            color: soundOn ? "#38BDF8" : "#94A3B8",
            padding: "8px 16px",
            borderRadius: "999px",
            fontSize: "12px",
            fontWeight: "800",
            cursor: "pointer",
            backdropFilter: "blur(12px)",
          }}
        >
          {soundOn ? "🔊 Sound: ON" : "🔇 Sound: OFF"}
        </button>

        <button
          onClick={onFinish}
          style={{
            background: "rgba(245, 158, 11, 0.15)",
            border: "1px solid rgba(245, 158, 11, 0.5)",
            color: "#F59E0B",
            padding: "8px 20px",
            borderRadius: "999px",
            fontSize: "12px",
            fontWeight: "900",
            cursor: "pointer",
            backdropFilter: "blur(12px)",
          }}
        >
          Skip to Storefront ⏩
        </button>
      </div>

      {/* ====================================================================
          SCENE 3: R-MART BANNER LAUNCHES FROM TOP
          ==================================================================== */}
      {(stage === "banner_launch" ||
        stage === "mart_transform" ||
        stage === "boxes_drop" ||
        stage === "people_enter" ||
        stage === "show_dialogues" ||
        stage === "start_shopping") && (
        <div
          style={{
            position: "absolute",
            top: "36px",
            zIndex: 40,
            animation: "bannerDrop 0.8s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #1E1B4B 0%, #0F172A 100%)",
              border: "3px solid #F59E0B",
              borderRadius: "18px",
              padding: "16px 48px",
              boxShadow: "0 0 35px rgba(245, 158, 11, 0.6), inset 0 0 15px rgba(245, 158, 11, 0.3)",
              textAlign: "center",
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <span style={{ fontSize: "32px" }}>⚡</span>
            <div>
              <div
                style={{
                  fontSize: "36px",
                  fontWeight: "900",
                  color: "#FFFFFF",
                  letterSpacing: "4px",
                  textShadow: "0 0 20px #F59E0B",
                }}
              >
                R - M A R T
              </div>
              <div style={{ fontSize: "12px", color: "#38BDF8", fontWeight: "800", letterSpacing: "2px" }}>
                HYPER-SPEED E-COMMERCE
              </div>
            </div>
            <span style={{ fontSize: "32px" }}>⚡</span>
          </div>
        </div>
      )}

      {/* ====================================================================
          MAIN STAGE: PERSON WALKING, PHONE SCROLLING, BOXES DROPPING
          ==================================================================== */}
      <div
        style={{
          position: "relative",
          zIndex: 20,
          width: "100%",
          maxWidth: "960px",
          height: "460px",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
        }}
      >
        {/* CHARACTER 1: The Main Shopper */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            left:
              stage === "walk_in"
                ? "45%"
                : "50%",
            transform:
              stage === "walk_in"
                ? "translateX(-150px)"
                : "translateX(-50%)",
            transition: "all 1.6s cubic-bezier(0.2, 0.8, 0.2, 1)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            zIndex: 25,
          }}
        >
          {/* SCENE 2: HOLOGRAPHIC PHONE & "PLACE ORDER" BUTTON */}
          {(stage === "walk_in" || stage === "tap_order") && (
            <div
              style={{
                position: "relative",
                marginBottom: "12px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {/* Floating Holographic Order Pop-up */}
              <div
                style={{
                  backgroundColor: "rgba(15, 23, 42, 0.9)",
                  border: `2px solid ${stage === "tap_order" ? "#10B981" : "#38BDF8"}`,
                  borderRadius: "14px",
                  padding: "10px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  boxShadow: stage === "tap_order" ? "0 0 25px #10B981" : "0 0 15px #38BDF8",
                  animation: stage === "tap_order" ? "pulse 0.4s ease" : "float3D 2s infinite ease-in-out",
                  backdropFilter: "blur(8px)",
                }}
              >
                <span style={{ fontSize: "20px" }}>🛒</span>
                <div>
                  <div style={{ fontSize: "10px", color: "#38BDF8", fontWeight: "800", textTransform: "uppercase" }}>
                    R-Mart App Cart (2 Items)
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: "900", color: "#FFF" }}>
                    {stage === "tap_order" ? "✔ ORDER PLACED!" : "Tap to Order"}
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: stage === "tap_order" ? "#10B981" : "#F59E0B",
                    color: "#000",
                    fontWeight: "900",
                    fontSize: "11px",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    boxShadow: stage === "tap_order" ? "0 0 12px #10B981" : "0 0 8px #F59E0B",
                  }}
                >
                  {stage === "tap_order" ? "CONFIRMED" : "PLACE ORDER"}
                </div>
              </div>
            </div>
          )}

          {/* PERSON CHARACTER BODY */}
          <div
            style={{
              position: "relative",
              textAlign: "center",
            }}
          >
            {/* When boxes drop, he sits on the floor holding a delivery box! */}
            {stage === "boxes_drop" ||
            stage === "people_enter" ||
            stage === "show_dialogues" ||
            stage === "start_shopping" ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                {/* Person Sitting & Grabbing a Box */}
                <div style={{ fontSize: "84px", lineHeight: "1" }}>🧘‍♂️</div>
                {/* Delivery Box In His Hands */}
                <div
                  style={{
                    marginTop: "-30px",
                    backgroundColor: "#B45309",
                    border: "2px solid #F59E0B",
                    borderRadius: "10px",
                    padding: "8px 24px",
                    color: "#FFF",
                    fontWeight: "900",
                    fontSize: "15px",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.8), 0 0 20px #F59E0B88",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    zIndex: 30,
                  }}
                >
                  <span>📦</span>
                  <span>R-MART PARCEL</span>
                </div>
              </div>
            ) : (
              /* Person Walking & Scrolling on Phone */
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ fontSize: "88px", lineHeight: "1" }}>🚶‍♂️</div>
                {/* Glowing Phone in Hand */}
                <div
                  style={{
                    position: "absolute",
                    right: "-12px",
                    top: "32px",
                    width: "28px",
                    height: "48px",
                    backgroundColor: "#0F172A",
                    border: "2px solid #38BDF8",
                    borderRadius: "6px",
                    boxShadow: "0 0 18px #38BDF8",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "2px",
                  }}
                >
                  <div style={{ width: "100%", height: "4px", backgroundColor: "#38BDF8", marginBottom: "2px" }} />
                  <div style={{ width: "80%", height: "3px", backgroundColor: "#94A3B8" }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ====================================================================
            SCENE 5: DELIVERY BOXES DROP SLOWLY FROM TOP ONTO HIS HEAD
            ==================================================================== */}
        {(stage === "boxes_drop" ||
          stage === "people_enter" ||
          stage === "show_dialogues" ||
          stage === "start_shopping") && (
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            {/* Box 1 (Lands directly on his head comically) */}
            <div
              style={{
                position: "absolute",
                left: "48%",
                top: "160px",
                fontSize: "52px",
                animation: "boxDropOnHead 0.9s cubic-bezier(0.25, 1, 0.5, 1) forwards",
                filter: "drop-shadow(0 15px 20px rgba(0,0,0,0.8))",
              }}
            >
              📦
            </div>

            {/* Box 2 (Left drop) */}
            <div
              style={{
                position: "absolute",
                left: "38%",
                bottom: "45px",
                fontSize: "64px",
                filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.8))",
              }}
            >
              📦
            </div>

            {/* Box 3 (Right drop) */}
            <div
              style={{
                position: "absolute",
                right: "36%",
                bottom: "45px",
                fontSize: "72px",
                filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.8))",
              }}
            >
              📦
            </div>
          </div>
        )}

        {/* ====================================================================
            SCENE 6: OTHER PEOPLE ENTER INTO SCREEN TAKING BOXES
            ==================================================================== */}
        {(stage === "people_enter" ||
          stage === "show_dialogues" ||
          stage === "start_shopping") && (
          <>
            {/* Person entering from left carrying box */}
            <div
              style={{
                position: "absolute",
                bottom: "40px",
                left: "12%",
                animation: "walkInLeft 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <div style={{ fontSize: "74px" }}>🏃‍♀️</div>
              <div style={{ fontSize: "44px" }}>📦</div>
            </div>

            {/* Person entering from right carrying box */}
            <div
              style={{
                position: "absolute",
                bottom: "40px",
                right: "12%",
                animation: "walkInRight 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <div style={{ fontSize: "44px" }}>📦</div>
              <div style={{ fontSize: "74px" }}>🚶‍♂️</div>
            </div>
          </>
        )}
      </div>

      {/* ====================================================================
          SCENE 7: EXACT REQUESTED DIALOGUES DISPLAYED ON SCREEN
          "100% Trusted - Get Delivered in 24-48 hours"
          ==================================================================== */}
      {(stage === "show_dialogues" || stage === "start_shopping") && (
        <div
          style={{
            position: "relative",
            zIndex: 45,
            marginTop: "16px",
            textAlign: "center",
            animation: "fadeInUp 0.6s ease forwards",
          }}
        >
          {/* Dialogue Badges */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "18px",
              flexWrap: "wrap",
              marginBottom: "24px",
            }}
          >
            {/* 100% Trusted */}
            <div
              style={{
                backgroundColor: "rgba(16, 185, 129, 0.15)",
                border: "2px solid #10B981",
                color: "#10B981",
                padding: "12px 28px",
                borderRadius: "14px",
                fontWeight: "900",
                fontSize: "20px",
                letterSpacing: "1px",
                boxShadow: "0 0 25px rgba(16, 185, 129, 0.4)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                backdropFilter: "blur(10px)",
              }}
            >
              <span>🛡️</span>
              <span>100% Trusted</span>
            </div>

            {/* Get Delivered in 24-48 hours */}
            <div
              style={{
                backgroundColor: "rgba(56, 189, 248, 0.15)",
                border: "2px solid #38BDF8",
                color: "#38BDF8",
                padding: "12px 28px",
                borderRadius: "14px",
                fontWeight: "900",
                fontSize: "20px",
                letterSpacing: "1px",
                boxShadow: "0 0 25px rgba(56, 189, 248, 0.4)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                backdropFilter: "blur(10px)",
              }}
            >
              <span>⚡</span>
              <span>Get Delivered in 24-48 hours</span>
            </div>
          </div>

          {/* ====================================================================
              SCENE 8: START SHOPPING BUTTON TAKE THEM INTO WEBSITE
              ==================================================================== */}
          <button
            onClick={onFinish}
            style={{
              backgroundColor: "#F59E0B",
              color: "#030712",
              border: "none",
              padding: "16px 48px",
              borderRadius: "16px",
              fontSize: "18px",
              fontWeight: "900",
              cursor: "pointer",
              boxShadow: "0 10px 35px rgba(245, 158, 11, 0.6), 0 0 25px rgba(245, 158, 11, 0.4)",
              display: "inline-flex",
              alignItems: "center",
              gap: "12px",
              animation: "pulse 1.8s infinite",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.06)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <span>🛍️</span>
            <span>START SHOPPING</span>
            <span>➔</span>
          </button>
        </div>
      )}

      {/* Embedded Animation Styles */}
      <style>{`
        @keyframes bannerDrop {
          0% { transform: translateY(-160px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes boxDropOnHead {
          0% { transform: translateY(-300px) scale(0.6); opacity: 0; }
          75% { transform: translateY(0px) scale(1.15); opacity: 1; }
          90% { transform: translateY(-15px) scale(0.95); }
          100% { transform: translateY(0px) scale(1); opacity: 1; }
        }
        @keyframes walkInLeft {
          0% { transform: translateX(-180px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes walkInRight {
          0% { transform: translateX(180px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
