import React, { useEffect, useRef, useState } from "react";

export default function RMartIntro({ onComplete }) {
  const canvasRef = useRef(null);
  const [showLogo, setShowLogo] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const centerX = canvas.width / 2;
    const floorY = canvas.height * 0.76;

    // Shopper silhouette entering
    let person = {
      x: -80,
      targetX: centerX,
      y: floorY,
      step: 0,
      inPlace: false,
    };

    // 3D Isometric Parcel generator
    const colors = ["#E09F3E", "#D97706", "#F59E0B", "#B45309", "#78350F"];
    const boxes = [];
    for (let i = 0; i < 55; i++) {
      boxes.push({
        x: centerX + (Math.random() - 0.5) * 360,
        y: -150 - Math.random() * 1100,
        targetY: floorY - 20 - Math.random() * 220,
        w: 36 + Math.random() * 26,
        h: 28 + Math.random() * 20,
        d: 16 + Math.random() * 14,
        vy: 4 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        landed: false,
        tapeGlow: Math.random() > 0.4 ? "#00F0FF" : "#FBBF24",
      });
    }

    // Impact sparks
    const sparks = [];
    const addSparks = (x, y, color) => {
      for (let i = 0; i < 6; i++) {
        sparks.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 8,
          vy: -Math.random() * 5 - 2,
          life: 1,
          color,
        });
      }
    };

    const startTime = Date.now();

    // Isometric 3D Box Renderer
    const drawIsometricBox = (b) => {
      ctx.save();
      ctx.translate(b.x, b.y);

      const hw = b.w / 2;
      const hh = b.h / 2;
      const isoX = b.d * 0.7;
      const isoY = b.d * 0.4;

      // Front Face
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.moveTo(-hw, -hh);
      ctx.lineTo(hw, -hh);
      ctx.lineTo(hw, hh);
      ctx.lineTo(-hw, hh);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.stroke();

      // Top Face
      ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
      ctx.beginPath();
      ctx.moveTo(-hw, -hh);
      ctx.lineTo(-hw + isoX, -hh - isoY);
      ctx.lineTo(hw + isoX, -hh - isoY);
      ctx.lineTo(hw, -hh);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Right Face
      ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
      ctx.beginPath();
      ctx.moveTo(hw, -hh);
      ctx.lineTo(hw + isoX, -hh - isoY);
      ctx.lineTo(hw + isoX, hh - isoY);
      ctx.lineTo(hw, hh);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Neon Tracking Strip / Amazon tape
      ctx.fillStyle = b.tapeGlow;
      ctx.shadowColor = b.tapeGlow;
      ctx.shadowBlur = b.landed ? 4 : 12;
      ctx.fillRect(-hw + b.w * 0.38, -hh, b.w * 0.24, b.h);

      // R mark
      ctx.fillStyle = "#000000";
      ctx.font = `900 ${Math.floor(b.w * 0.35)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("R", 0, 0);

      ctx.restore();
    };

    const drawCharacter = (x, y) => {
      ctx.save();
      ctx.translate(x, y);

      // Floor Shadow & Amber Neon Spotlight
      const glow = ctx.createRadialGradient(0, 10, 5, 0, 10, 120);
      glow.addColorStop(0, "rgba(245, 158, 11, 0.35)");
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.ellipse(0, 15, 110, 24, 0, 0, Math.PI * 2);
      ctx.fill();

      // Silhouette Stylized Body
      ctx.fillStyle = "#F3F4F6";
      ctx.shadowColor = "#F59E0B";
      ctx.shadowBlur = 18;

      // Head with headphone/cap accent
      ctx.beginPath();
      ctx.arc(0, -96, 14, 0, Math.PI * 2);
      ctx.fill();

      // Neck + Torso
      ctx.beginPath();
      ctx.roundRect(-20, -78, 40, 56, 8);
      ctx.fill();

      // Walking Leg Dynamics
      person.step += 0.12;
      const swing = person.inPlace ? 0 : Math.sin(person.step) * 10;
      ctx.fillRect(-16, -22, 12, 38 + swing);
      ctx.fillRect(4, -22, 12, 38 - swing);

      ctx.restore();
    };

    const render = () => {
      const elapsed = Date.now() - startTime;
      ctx.fillStyle = "rgba(7, 9, 15, 0.32)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Character walking towards center
      if (person.x < person.targetX) {
        person.x += (person.targetX - person.x) * 0.05 + 2.2;
      } else {
        person.inPlace = true;
      }
      drawCharacter(person.x, person.y);

      // Boxes start cascading from top
      if (elapsed > 600) {
        boxes.forEach((b) => {
          if (!b.landed) {
            b.y += b.vy;
            b.vy += 0.35; // Gravity
            if (b.y >= b.targetY) {
              b.y = b.targetY;
              b.landed = true;
              addSparks(b.x, b.y + b.h / 2, b.tapeGlow);
            }
          }
          drawIsometricBox(b);
        });
      }

      // Render sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.life -= 0.04;
        if (s.life <= 0) {
          sparks.splice(i, 1);
        } else {
          ctx.fillStyle = s.color;
          ctx.shadowColor = s.color;
          ctx.shadowBlur = 8;
          ctx.fillRect(s.x, s.y, 3, 3);
        }
      }

      // Climax: R-MART Launch Burst
      if (elapsed > 1700) {
        setShowLogo(true);
      }

      animId = requestAnimationFrame(render);
    };

    render();

    // 3.4 seconds transition to Authentication
    const timer = setTimeout(() => {
      setFading(true);
      setTimeout(onComplete, 700);
    }, 3400);

    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(timer);
      window.removeEventListener("resize", resize);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#07090F] transition-opacity duration-700 ${
        fading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />

      {showLogo && (
        <div className="z-20 flex flex-col items-center animate-fade-in text-center px-4">
          <div className="relative mb-3">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-300 p-[3px] shadow-[0_0_80px_rgba(245,158,11,0.8)] animate-pulse">
              <div className="w-full h-full bg-[#0D111A] rounded-[21px] flex items-center justify-center">
                <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-orange-500">
                  R
                </span>
              </div>
            </div>
          </div>
          <h1 className="text-6xl md:text-7xl font-black tracking-widest text-white drop-shadow-[0_0_40px_rgba(245,158,11,0.7)] font-sans">
            R-MART
          </h1>
          <p className="mt-2 text-amber-400 font-extrabold tracking-[0.35em] text-xs uppercase">
            Delivery Delivered at Speed
          </p>
        </div>
      )}
    </div>
  );
}
