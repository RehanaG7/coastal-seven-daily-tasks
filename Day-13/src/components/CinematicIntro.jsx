import React, { useState, useEffect } from "react";

export default function CinematicIntro({ onFinish }) {
  // Stages: "walk_in" -> "tap_order" -> "boxes_drop" -> "brand_launch" -> "fade_out"
  const [stage, setStage] = useState("walk_in");

  useEffect(() => {
    const t1 = setTimeout(() => setStage("tap_order"), 1200);
    const t2 = setTimeout(() => setStage("boxes_drop"), 2300);
    const t3 = setTimeout(() => setStage("brand_launch"), 3700);
    const t4 = setTimeout(() => setStage("fade_out"), 4900);
    const t5 = setTimeout(() => {
      if (onFinish) onFinish();
    }, 5500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [onFinish]);

  return (
    <div
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
        opacity: stage === "fade_out" ? 0 : 1,
        transition: "opacity 0.6s ease-in-out",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Background ambient lighting */}
      <div
        style={{
          position: "absolute",
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(0, 0, 0, 0) 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />

      {/* Skip Action */}
      <button
        onClick={onFinish}
        style={{
          position: "absolute",
          top: "24px",
          right: "24px",
          background: "rgba(255, 255, 255, 0.08)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          color: "#CBD5E1",
          padding: "6px 16px",
          borderRadius: "999px",
          fontSize: "12px",
          fontWeight: "800",
          cursor: "pointer",
          backdropFilter: "blur(8px)",
          zIndex: 10,
        }}
      >
        Skip Intro ⏩
      </button>

      {/* SCENE 1 & 2: Person walking in, holding glowing phone, tapping order */}
      {(stage === "walk_in" || stage === "tap_order") && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            animation: "characterSlide 1s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          }}
        >
          {/* Stylized Human Silhouette with Phone */}
          <div style={{ position: "relative", marginBottom: "20px" }}>
            <div style={{ fontSize: "80px", filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.8))" }}>
              🚶‍♂️
            </div>
            {/* Glowing Smartphone in Hand */}
            <div
              style={{
                position: "absolute",
                right: "12px",
                top: "28px",
                width: "36px",
                height: "64px",
                backgroundColor: "#0F172A",
                border: "2px solid #38BDF8",
                borderRadius: "8px",
                boxShadow: "0 0 20px #38BDF8, inset 0 0 10px #0284C7",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "3px",
                overflow: "hidden",
                transform: "rotate(6deg)",
              }}
            >
              {/* Mini feed items inside screen */}
              <div style={{ width: "100%", height: "4px", backgroundColor: "#38BDF8", borderRadius: "2px", marginBottom: "3px" }} />
              <div style={{ width: "80%", height: "3px", backgroundColor: "#94A3B8", borderRadius: "2px", marginBottom: "auto" }} />
              
              {/* Pulsating Mini Order Button */}
              <div
                style={{
                  width: "100%",
                  height: "14px",
                  backgroundColor: stage === "tap_order" ? "#10B981" : "#F59E0B",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "8px",
                  fontWeight: "900",
                  color: "#000",
                  boxShadow: stage === "tap_order" ? "0 0 12px #10B981" : "none",
                  transition: "all 0.3s ease",
                }}
              >
                {stage === "tap_order" ? "DONE" : "BUY"}
              </div>
            </div>
          </div>

          {/* Holographic Order Card Overlay */}
          <div
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.85)",
              border: "1px solid rgba(56, 189, 248, 0.4)",
              borderRadius: "14px",
              padding: "14px 24px",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.7), 0 0 30px rgba(56, 189, 248, 0.2)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div style={{ fontSize: "24px" }}>🛒</div>
            <div>
              <div style={{ fontSize: "11px", color: "#38BDF8", fontWeight: "800", textTransform: "uppercase" }}>
                Instant Local Dispatch
              </div>
              <div style={{ fontSize: "14px", fontWeight: "900", color: "#FFF" }}>
                {stage === "tap_order" ? "Order Placed! Dispatching..." : "One-Click Checkout..."}
              </div>
            </div>
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: stage === "tap_order" ? "#10B981" : "#F59E0B",
                boxShadow: stage === "tap_order" ? "0 0 10px #10B981" : "0 0 10px #F59E0B",
              }}
            />
          </div>
        </div>
      )}

      {/* SCENE 3: Dynamic 3D Falling Parcel Delivery System */}
      {stage === "boxes_drop" && (
        <div style={{ position: "relative", width: "360px", height: "240px", perspective: "1000px" }}>
          {/* Box 1 (Left Drop) */}
          <div
            style={{
              position: "absolute",
              fontSize: "64px",
              left: "20px",
              animation: "boxFallLeft 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards",
              filter: "drop-shadow(0 15px 25px rgba(0,0,0,0.8))",
            }}
          >
            📦
          </div>
          {/* Box 2 (Center Heavy Drop) */}
          <div
            style={{
              position: "absolute",
              fontSize: "84px",
              left: "135px",
              animation: "boxFallCenter 0.9s 0.15s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
              filter: "drop-shadow(0 20px 30px rgba(0,0,0,0.9))",
            }}
          >
            📦
          </div>
          {/* Box 3 (Right High Drop) */}
          <div
            style={{
              position: "absolute",
              fontSize: "68px",
              right: "20px",
              animation: "boxFallRight 0.75s 0.25s cubic-bezier(0.25, 1, 0.5, 1) forwards",
              filter: "drop-shadow(0 15px 25px rgba(0,0,0,0.8))",
            }}
          >
            📦
          </div>
          <div
            style={{
              position: "absolute",
              bottom: "10px",
              width: "100%",
              textAlign: "center",
              color: "#38BDF8",
              fontWeight: "900",
              fontSize: "12px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              animation: "fadeIn 0.5s ease-in forwards",
            }}
          >
            ⚡ Inventory Verified • Loading Hub...
          </div>
        </div>
      )}

      {/* SCENE 4: R-MART Top Drop Rocket Launch */}
      {stage === "brand_launch" && (
        <div
          style={{
            animation: "brandDrop 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: "64px",
              fontWeight: "900",
              color: "#FFFFFF",
              letterSpacing: "-1.5px",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              textShadow: "0 0 40px rgba(59, 130, 246, 0.6)",
            }}
          >
            <span style={{ color: "#F59E0B", filter: "drop-shadow(0 0 15px #F59E0B)" }}>⚡</span>
            <span>R-MART</span>
          </div>
          <p
            style={{
              marginTop: "8px",
              fontSize: "13px",
              fontWeight: "800",
              letterSpacing: "4px",
              color: "#38BDF8",
              textTransform: "uppercase",
            }}
          >
            Verified Instant Commerce
          </p>
        </div>
      )}

      <style>{`
        @keyframes characterSlide {
          0% { transform: translateX(-60px) scale(0.9); opacity: 0; }
          100% { transform: translateX(0px) scale(1); opacity: 1; }
        }
        @keyframes boxFallLeft {
          0% { transform: translateY(-200px) rotate(-35deg) scale(0.5); opacity: 0; }
          80% { transform: translateY(80px) rotate(-10deg) scale(1.05); }
          100% { transform: translateY(65px) rotate(-12deg) scale(1); opacity: 1; }
        }
        @keyframes boxFallCenter {
          0% { transform: translateY(-240px) scale(0.6); opacity: 0; }
          80% { transform: translateY(40px) scale(1.1); }
          100% { transform: translateY(30px) scale(1); opacity: 1; }
        }
        @keyframes boxFallRight {
          0% { transform: translateY(-220px) rotate(40deg) scale(0.5); opacity: 0; }
          80% { transform: translateY(90px) rotate(15deg) scale(1.05); }
          100% { transform: translateY(75px) rotate(14deg) scale(1); opacity: 1; }
        }
        @keyframes brandDrop {
          0% { transform: translateY(-120px) scale(0.7); opacity: 0; filter: blur(10px); }
          80% { transform: translateY(10px) scale(1.08); filter: blur(0); }
          100% { transform: translateY(0px) scale(1); opacity: 1; }
        }
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
