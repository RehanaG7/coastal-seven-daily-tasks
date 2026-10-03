import React, { useState, useEffect } from "react";

// ============================================================================
// PROCEDURAL CARTOON SOUND EFFECTS ENGINE (Web Audio API - 100% Offline)
// ============================================================================
class CartoonSoundEngine {
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

  // Cartoon Tippy-Toe Footsteps
  playCartoonFootsteps() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      for (let i = 0; i < 4; i++) {
        const t = now + i * 0.28;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(320 + (i % 2) * 80, t);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.08);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.linearRampToValueAtTime(0.001, t + 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.08);
      }
    } catch (e) {}
  }

  // Cartoon "Bloop / Pop!" on Tap Order
  playCartoonTapPop() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.12);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {}
  }

  // Cartoon Slide-Whistle Whoosh for Banner
  playSlideWhistle() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(950, now + 0.45);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.55);
    } catch (e) {}
  }

  // Cartoon Boing & Bonk!
  playCartoonBonk() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // Spring Boing
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(140, now);
      osc1.frequency.exponentialRampToValueAtTime(600, now + 0.18);
      osc1.frequency.exponentialRampToValueAtTime(220, now + 0.35);
      gain1.gain.setValueAtTime(0.35, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.38);

      // Woodblock Bonk
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(440, now);
      osc2.frequency.exponentialRampToValueAtTime(110, now + 0.15);
      gain2.gain.setValueAtTime(0.3, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now);
      osc2.stop(now + 0.2);
    } catch (e) {}
  }

  // Cartoon Happy Victory Fanfare
  playVictoryFanfare() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const melody = [
        { f: 523.25, d: 0.12 }, // C5
        { f: 659.25, d: 0.12 }, // E5
        { f: 783.99, d: 0.12 }, // G5
        { f: 1046.5, d: 0.35 }, // C6
      ];
      let offset = 0;
      melody.forEach((note) => {
        const now = this.ctx.currentTime + offset;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(note.f, now);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + note.d);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + note.d);
        offset += note.d * 0.85;
      });
    } catch (e) {}
  }
}

const sfx = new CartoonSoundEngine();

// ============================================================================
// CARTOON VECTOR ASSETS (AUTHENTIC HAND-CRAFTED SVG ILLUSTRATIONS)
// ============================================================================

// 1. CARTOON DELIVERY PARCEL (Cardboard, Red-Gold Ribbon, R-Mart Stamp)
function CartoonDeliveryBox({ size = 80, label = "R-MART" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ filter: "drop-shadow(0 8px 12px rgba(0,0,0,0.6))" }}
    >
      {/* Box Front Face */}
      <rect
        x="15"
        y="35"
        width="70"
        height="55"
        rx="8"
        fill="#D97706"
        stroke="#92400E"
        strokeWidth="3.5"
      />
      {/* Box Top Flap Lid Shading */}
      <polygon
        points="15,35 30,15 85,15 70,35"
        fill="#F59E0B"
        stroke="#92400E"
        strokeWidth="3.5"
      />
      <polygon
        points="85,15 70,35 85,90"
        fill="#B45309"
        stroke="#92400E"
        strokeWidth="3.5"
        opacity="0.3"
      />
      {/* Red Packing Tape */}
      <rect x="44" y="15" width="12" height="75" fill="#EF4444" rx="2" />
      {/* Golden Tape Across */}
      <rect x="15" y="52" width="70" height="10" fill="#FDE047" opacity="0.9" />
      {/* R-Mart Logo Stamp */}
      <circle cx="50" cy="57" r="14" fill="#000000" />
      <text
        x="50"
        y="62"
        textAnchor="middle"
        fill="#F59E0B"
        fontSize="12"
        fontWeight="900"
        fontFamily="'Impact', 'Arial Black', sans-serif"
      >
        ⚡ R
      </text>
      {/* Shipping Barcode */}
      <rect x="22" y="72" width="16" height="10" fill="#FFFFFF" rx="2" />
      <line x1="25" y1="74" x2="25" y2="80" stroke="#000" strokeWidth="1.5" />
      <line x1="28" y1="74" x2="28" y2="80" stroke="#000" strokeWidth="2" />
      <line x1="32" y1="74" x2="32" y2="80" stroke="#000" strokeWidth="1.5" />
      <line x1="35" y1="74" x2="35" y2="80" stroke="#000" strokeWidth="1" />
    </svg>
  );
}

// 2. THE MAIN CARTOON CHARACTER (Leo the Shopper)
function CartoonLeoCharacter({ stage }) {
  const isSittingWithBox =
    stage === "boxes_drop" ||
    stage === "people_enter" ||
    stage === "show_dialogues" ||
    stage === "start_shopping";

  const isTapping = stage === "tap_order";
  const isLookingUp = stage === "banner_launch" || stage === "mart_transform";

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Spinning Cartoon Dizzy Stars when Bonked */}
      {stage === "boxes_drop" && (
        <div
          style={{
            position: "absolute",
            top: "-30px",
            fontSize: "24px",
            animation: "spinStars 1.5s infinite linear",
            zIndex: 40,
          }}
        >
          💫 ⭐ ✨ 💫
        </div>
      )}

      {/* SVG Cartoon Character Illustration */}
      <svg
        width={isSittingWithBox ? "210" : "170"}
        height={isSittingWithBox ? "210" : "250"}
        viewBox="0 0 200 260"
        style={{
          transform: isSittingWithBox
            ? "scale(1.05)"
            : isTapping
            ? "scale(1.03)"
            : "scale(1)",
          transition: "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        }}
      >
        <defs>
          <radialGradient id="skinGrad" cx="45%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="100%" stopColor="#F59E0B" />
          </radialGradient>
          <linearGradient id="hoodieGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
        </defs>

        {isSittingWithBox ? (
          /* ================================================================
             LEO SITTING ON FLOOR HAPPILY HUGGING THE R-MART BOX
             ================================================================ */
          <g>
            {/* Sitting Legs Crossed */}
            <path
              d="M 40,210 Q 100,245 160,210 Q 180,230 150,240 Q 100,250 50,240 Q 20,230 40,210 Z"
              fill="#1E293B"
              stroke="#0F172A"
              strokeWidth="4"
            />
            {/* Red Sneakers */}
            <ellipse cx="40" cy="225" rx="16" ry="10" fill="#EF4444" stroke="#991B1B" strokeWidth="2.5" />
            <ellipse cx="160" cy="225" rx="16" ry="10" fill="#EF4444" stroke="#991B1B" strokeWidth="2.5" />

            {/* Torso Hoodie */}
            <path
              d="M 65,140 Q 100,135 135,140 L 145,210 Q 100,220 55,210 Z"
              fill="url(#hoodieGrad)"
              stroke="#0369A1"
              strokeWidth="4"
            />

            {/* BIG DELIVERED BOX IN HIS LAP */}
            <g transform="translate(50, 135)">
              <rect x="0" y="0" width="100" height="75" rx="8" fill="#D97706" stroke="#78350F" strokeWidth="4" />
              <rect x="42" y="0" width="16" height="75" fill="#EF4444" />
              <rect x="0" y="25" width="100" height="14" fill="#FDE047" opacity="0.9" />
              <circle cx="50" cy="32" r="14" fill="#000" />
              <text x="50" y="37" textAnchor="middle" fill="#F59E0B" fontSize="12" fontWeight="900">⚡R</text>
            </g>

            {/* Arms Wrapped Around Box */}
            <path
              d="M 55,145 Q 35,170 55,190 Q 75,195 90,185"
              fill="none"
              stroke="url(#hoodieGrad)"
              strokeWidth="16"
              strokeLinecap="round"
            />
            <path
              d="M 145,145 Q 165,170 145,190 Q 125,195 110,185"
              fill="none"
              stroke="url(#hoodieGrad)"
              strokeWidth="16"
              strokeLinecap="round"
            />
            {/* Cartoon Hands Hugging */}
            <circle cx="90" cy="182" r="9" fill="url(#skinGrad)" stroke="#B45309" strokeWidth="2" />
            <circle cx="110" cy="182" r="9" fill="url(#skinGrad)" stroke="#B45309" strokeWidth="2" />

            {/* Cartoon Head */}
            <circle cx="100" cy="85" r="42" fill="url(#skinGrad)" stroke="#B45309" strokeWidth="4" />

            {/* Stylized Anime Brown Hair */}
            <path
              d="M 60,80 Q 55,42 95,40 Q 145,38 140,80 Q 135,55 115,50 Q 85,50 60,80 Z"
              fill="#78350F"
              stroke="#451A03"
              strokeWidth="3"
            />
            <path
              d="M 75,55 Q 85,35 105,42 Q 95,50 85,55 Z"
              fill="#92400E"
            />

            {/* Happy Blushing Cheeks */}
            <ellipse cx="76" cy="100" rx="9" ry="5" fill="#F43F5E" opacity="0.6" />
            <ellipse cx="124" cy="100" rx="9" ry="5" fill="#F43F5E" opacity="0.6" />

            {/* Big Joyful Closed Eyes (^ ^) */}
            <path
              d="M 72,85 Q 80,75 88,85"
              fill="none"
              stroke="#451A03"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M 112,85 Q 120,75 128,85"
              fill="none"
              stroke="#451A03"
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* Huge Happy Grin */}
            <path
              d="M 85,100 Q 100,122 115,100 Z"
              fill="#BE123C"
              stroke="#451A03"
              strokeWidth="3"
            />
            <path
              d="M 90,103 Q 100,110 110,103"
              fill="#FFFFFF"
              stroke="none"
            />
          </g>
        ) : (
          /* ================================================================
             LEO WALKING & SCROLLING ON PHONE / LOOKING UP
             ================================================================ */
          <g>
            {/* Walking Legs */}
            <line x1="85" y1="180" x2="72" y2="235" stroke="#1E293B" strokeWidth="14" strokeLinecap="round" />
            <line x1="115" y1="180" x2="130" y2="235" stroke="#1E293B" strokeWidth="14" strokeLinecap="round" />
            {/* Red Sneakers */}
            <ellipse cx="68" cy="242" rx="14" ry="7" fill="#EF4444" stroke="#991B1B" strokeWidth="2.5" />
            <ellipse cx="138" cy="242" rx="14" ry="7" fill="#EF4444" stroke="#991B1B" strokeWidth="2.5" />

            {/* Torso Hoodie */}
            <path
              d="M 70,115 Q 100,110 130,115 L 125,185 Q 100,192 75,185 Z"
              fill="url(#hoodieGrad)"
              stroke="#0369A1"
              strokeWidth="4"
            />
            {/* Hoodie Strings */}
            <line x1="93" y1="120" x2="93" y2="145" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="107" y1="120" x2="107" y2="145" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />

            {/* Left Arm Holding Phone */}
            <path
              d="M 75,125 Q 90,150 115,145"
              fill="none"
              stroke="url(#hoodieGrad)"
              strokeWidth="12"
              strokeLinecap="round"
            />
            {/* Right Arm Tapping Phone */}
            <path
              d="M 125,125 Q 135,145 125,155"
              fill="none"
              stroke="url(#hoodieGrad)"
              strokeWidth="12"
              strokeLinecap="round"
            />

            {/* THE CARTOON SMARTPHONE */}
            <g transform="translate(115, 125) rotate(-10)">
              <rect x="0" y="0" width="24" height="42" rx="5" fill="#0F172A" stroke="#38BDF8" strokeWidth="2.5" />
              <rect x="2" y="4" width="20" height="32" rx="3" fill="#0284C7" />
              {/* Screen Content: R-Mart App Cart */}
              <circle cx="12" cy="14" r="5" fill="#F59E0B" />
              <text x="12" y="17" textAnchor="middle" fill="#000" fontSize="6" fontWeight="900">🛒</text>
              <rect x="5" y="24" width="14" height="6" rx="2" fill="#10B981" />
              <text x="12" y="29" textAnchor="middle" fill="#FFF" fontSize="4.5" fontWeight="900">ORDER</text>
              {/* Tapping Sparkles */}
              {isTapping && (
                <circle cx="12" cy="27" r="8" fill="none" stroke="#FDE047" strokeWidth="2" opacity="0.8">
                  <animate attributeName="r" values="3;12" dur="0.4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;0" dur="0.4s" repeatCount="indefinite" />
                </circle>
              )}
            </g>

            {/* Cartoon Hands */}
            <circle cx="116" cy="148" r="7" fill="url(#skinGrad)" stroke="#B45309" strokeWidth="1.5" />
            <circle cx="126" cy="155" r="7" fill="url(#skinGrad)" stroke="#B45309" strokeWidth="1.5" />

            {/* Cartoon Head */}
            <circle cx="100" cy="70" r="38" fill="url(#skinGrad)" stroke="#B45309" strokeWidth="3.5" />

            {/* Hair */}
            <path
              d="M 64,65 Q 60,30 96,28 Q 140,26 136,65 Q 130,42 112,38 Q 85,38 64,65 Z"
              fill="#78350F"
              stroke="#451A03"
              strokeWidth="3"
            />
            <path d="M 78,40 Q 88,22 108,30 Q 98,36 88,40 Z" fill="#92400E" />

            {/* Big Cartoon Eyes */}
            {isLookingUp ? (
              // Wide Surprised Eyes Looking Up at Banner
              <g>
                <circle cx="88" cy="65" r="9" fill="#FFFFFF" stroke="#000" strokeWidth="2" />
                <circle cx="112" cy="65" r="9" fill="#FFFFFF" stroke="#000" strokeWidth="2" />
                <circle cx="88" cy="60" r="5" fill="#1E293B" />
                <circle cx="112" cy="60" r="5" fill="#1E293B" />
                <circle cx="90" cy="58" r="2" fill="#FFFFFF" />
                <circle cx="114" cy="58" r="2" fill="#FFFFFF" />
                {/* Surprised O-Mouth */}
                <ellipse cx="100" cy="88" rx="6" ry="8" fill="#BE123C" stroke="#451A03" strokeWidth="2" />
              </g>
            ) : (
              // Friendly Eyes Looking Down at Phone
              <g>
                <ellipse cx="88" cy="67" rx="8" ry="10" fill="#FFFFFF" stroke="#000" strokeWidth="2" />
                <ellipse cx="112" cy="67" rx="8" ry="10" fill="#FFFFFF" stroke="#000" strokeWidth="2" />
                <ellipse cx="91" cy="70" rx="5" ry="6" fill="#1E293B" />
                <ellipse cx="115" cy="70" rx="5" ry="6" fill="#1E293B" />
                <circle cx="93" cy="68" r="2" fill="#FFFFFF" />
                <circle cx="117" cy="68" r="2" fill="#FFFFFF" />
                {/* Smile */}
                <path d="M 92,85 Q 100,95 108,85" fill="none" stroke="#451A03" strokeWidth="3" strokeLinecap="round" />
              </g>
            )}
          </g>
        )}
      </svg>
    </div>
  );
}

// 3. CARTOON RUNNING CUSTOMER (GIRL)
function CartoonRunningGirl() {
  return (
    <svg width="120" height="150" viewBox="0 0 120 150">
      {/* Running Speed Dust */}
      <circle cx="15" cy="135" r="6" fill="#FFFFFF" opacity="0.4" />
      <circle cx="28" cy="138" r="4" fill="#FFFFFF" opacity="0.3" />

      {/* Running Legs */}
      <line x1="50" y1="95" x2="25" y2="135" stroke="#4338CA" strokeWidth="9" strokeLinecap="round" />
      <line x1="65" y1="95" x2="90" y2="125" stroke="#4338CA" strokeWidth="9" strokeLinecap="round" />
      {/* Shoes */}
      <ellipse cx="20" cy="138" rx="10" ry="5" fill="#EC4899" />
      <ellipse cx="95" cy="128" rx="10" ry="5" fill="#EC4899" />

      {/* Dress / Shirt */}
      <path d="M 45,60 Q 60,55 75,60 L 80,105 L 40,105 Z" fill="#F43F5E" stroke="#BE123C" strokeWidth="2.5" />

      {/* Carrying Parcel Box */}
      <g transform="translate(60, 65) rotate(10)">
        <rect x="0" y="0" width="38" height="30" rx="4" fill="#D97706" stroke="#78350F" strokeWidth="2" />
        <rect x="15" y="0" width="8" height="30" fill="#EF4444" />
      </g>

      {/* Head */}
      <circle cx="60" cy="38" r="22" fill="#FDE68A" stroke="#B45309" strokeWidth="2" />
      {/* Ponytail Hair */}
      <path d="M 40,35 Q 38,15 60,15 Q 82,15 80,35 Q 75,20 60,20 Q 45,20 40,35 Z" fill="#92400E" />
      <path d="M 42,28 Q 18,25 22,48 Q 28,45 38,36 Z" fill="#92400E" />
      {/* Eye & Smile */}
      <circle cx="68" cy="38" r="3.5" fill="#1E293B" />
      <circle cx="70" cy="36" r="1" fill="#FFF" />
      <path d="M 64,48 Q 70,54 75,48" fill="none" stroke="#451A03" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// 4. CARTOON DELIVERY COURIER (R-MART CAP)
function CartoonDeliveryBoy() {
  return (
    <svg width="120" height="150" viewBox="0 0 120 150">
      {/* Running Speed Dust */}
      <circle cx="105" cy="135" r="6" fill="#FFFFFF" opacity="0.4" />
      <circle cx="92" cy="138" r="4" fill="#FFFFFF" opacity="0.3" />

      {/* Running Legs */}
      <line x1="55" y1="95" x2="30" y2="125" stroke="#1E293B" strokeWidth="9" strokeLinecap="round" />
      <line x1="70" y1="95" x2="95" y2="135" stroke="#1E293B" strokeWidth="9" strokeLinecap="round" />
      {/* Sneakers */}
      <ellipse cx="25" cy="128" rx="10" ry="5" fill="#10B981" />
      <ellipse cx="100" cy="138" rx="10" ry="5" fill="#10B981" />

      {/* Uniform Shirt */}
      <path d="M 45,60 Q 60,55 75,60 L 78,105 L 42,105 Z" fill="#10B981" stroke="#047857" strokeWidth="2.5" />

      {/* Stack of 2 Parcels */}
      <g transform="translate(18, 55)">
        <rect x="0" y="0" width="34" height="22" rx="3" fill="#D97706" stroke="#78350F" strokeWidth="2" />
        <rect x="13" y="0" width="8" height="22" fill="#EF4444" />
        <rect x="4" y="-18" width="28" height="18" rx="3" fill="#F59E0B" stroke="#78350F" strokeWidth="2" />
      </g>

      {/* Head */}
      <circle cx="60" cy="38" r="22" fill="#FDE68A" stroke="#B45309" strokeWidth="2" />
      {/* Green R-Mart Cap */}
      <path d="M 38,32 Q 60,14 82,32 L 95,34 L 80,40 L 40,40 Z" fill="#047857" stroke="#064E3B" strokeWidth="2" />
      <text x="60" y="32" textAnchor="middle" fill="#FDE047" fontSize="8" fontWeight="900">⚡R</text>
      {/* Eye & Grin */}
      <circle cx="52" cy="40" r="3.5" fill="#1E293B" />
      <circle cx="54" cy="38" r="1" fill="#FFF" />
      <path d="M 48,50 Q 55,56 62,50" fill="none" stroke="#451A03" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ============================================================================
// MAIN CINEMATIC CARTOON INTRO COMPONENT
// ============================================================================
export default function CinematicIntro({ onFinish }) {
  // Timeline Stages:
  // 1: "walk_in" (Cartoon Leo enters scrolling phone)
  // 2: "tap_order" (Cartoon Leo taps "Place Order" with pop animation)
  // 3: "banner_launch" (R-Mart super banner drops from top with slide whistle)
  // 4: "mart_transform" (Background smoothly transforms into colorful Cartoon R-Mart)
  // 5: "boxes_drop" (Delivery boxes drop from top on his head with bonk & dizzy stars, sits holding box)
  // 6: "people_enter" (Other cartoon customers/couriers dash in grabbing boxes)
  // 7: "show_dialogues" (Cartoon Comic Bubbles: 100% Trusted - Get Delivered in 24-48 hours)
  // 8: "start_shopping" (Big Bouncy "START SHOPPING" Button)

  const [stage, setStage] = useState("walk_in");
  const [soundOn, setSoundOn] = useState(true);

  const toggleSound = () => {
    sfx.init();
    sfx.isMuted = soundOn;
    setSoundOn(!soundOn);
  };

  useEffect(() => {
    sfx.playCartoonFootsteps();

    const t1 = setTimeout(() => {
      setStage("tap_order");
      sfx.playCartoonTapPop();
    }, 2400);

    const t2 = setTimeout(() => {
      setStage("banner_launch");
      sfx.playSlideWhistle();
    }, 4400);

    const t3 = setTimeout(() => {
      setStage("mart_transform");
    }, 6400);

    const t4 = setTimeout(() => {
      setStage("boxes_drop");
      sfx.playCartoonBonk();
    }, 8500);

    const t5 = setTimeout(() => {
      setStage("people_enter");
    }, 11000);

    const t6 = setTimeout(() => {
      setStage("show_dialogues");
      sfx.playVictoryFanfare();
    }, 13200);

    const t7 = setTimeout(() => {
      setStage("start_shopping");
    }, 15400);

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
        fontFamily: "'Fredoka', 'Comfortaa', 'Inter', system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* ====================================================================
          BACKGROUND: PURE BLACK INITIALLY -> MORPHS TO CARTOON R-MART
          ==================================================================== */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: isMartBg ? 1 : 0,
          transition: "opacity 1.2s ease-in-out",
          background: isMartBg
            ? "radial-gradient(ellipse at 50% 30%, #1E1B4B 0%, #0F172A 70%, #030712 100%)"
            : "#030712",
          zIndex: 1,
        }}
      >
        {isMartBg && (
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            {/* Cartoon Striped Awning at Top */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "50px",
                background:
                  "repeating-linear-gradient(90deg, #EF4444 0px, #EF4444 40px, #FFFFFF 40px, #FFFFFF 80px)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
                borderBottom: "4px solid #B91C1C",
              }}
            />

            {/* Glowing Neon Store Name */}
            <div
              style={{
                position: "absolute",
                top: "70px",
                left: "50%",
                transform: "translateX(-50%)",
                textAlign: "center",
                opacity: 0.8,
              }}
            >
              <div
                style={{
                  fontSize: "44px",
                  fontWeight: "900",
                  color: "#F59E0B",
                  letterSpacing: "4px",
                  textShadow:
                    "0 0 20px #F59E0B, 0 0 40px #EF4444, 2px 2px 0 #000",
                }}
              >
                🏪 R-MART SUPERMARKET 🛒
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: "#38BDF8",
                  fontWeight: "800",
                  letterSpacing: "2px",
                }}
              >
                FASTEST 24H AUTOMATED FULFILLMENT CENTER
              </div>
            </div>

            {/* Cartoon Store Shelves */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "220px",
                background:
                  "linear-gradient(180deg, transparent 0%, rgba(15, 23, 42, 0.9) 100%)",
                display: "flex",
                justifyContent: "space-between",
                padding: "0 60px",
                opacity: 0.35,
              }}
            >
              <div style={{ fontSize: "56px" }}>📦🥫📦</div>
              <div style={{ fontSize: "56px" }}>🎮💻🎧</div>
              <div style={{ fontSize: "56px" }}>📦📱📦</div>
            </div>
          </div>
        )}
      </div>

      {/* Top Header Bar: Sound Toggle & Skip */}
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
            background: "rgba(15, 23, 42, 0.85)",
            border: "2px solid #38BDF8",
            color: soundOn ? "#38BDF8" : "#94A3B8",
            padding: "8px 18px",
            borderRadius: "999px",
            fontSize: "13px",
            fontWeight: "900",
            cursor: "pointer",
            backdropFilter: "blur(12px)",
            boxShadow: "0 4px 12px rgba(56, 189, 248, 0.3)",
          }}
        >
          {soundOn ? "🔊 Cartoon Sound: ON" : "🔇 Sound: OFF"}
        </button>

        <button
          onClick={onFinish}
          style={{
            background: "rgba(245, 158, 11, 0.2)",
            border: "2px solid #F59E0B",
            color: "#F59E0B",
            padding: "8px 24px",
            borderRadius: "999px",
            fontSize: "13px",
            fontWeight: "900",
            cursor: "pointer",
            backdropFilter: "blur(12px)",
            boxShadow: "0 4px 15px rgba(245, 158, 11, 0.4)",
          }}
        >
          Skip Intro ⏩
        </button>
      </div>

      {/* ====================================================================
          SCENE 3: R-MART SUPER BANNER LAUNCHES FROM TOP WITH ELASTIC BOUNCE
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
            top: "40px",
            zIndex: 40,
            animation:
              "cartoonBannerDrop 0.9s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #1E1B4B 0%, #0F172A 100%)",
              border: "4px solid #F59E0B",
              borderRadius: "22px",
              padding: "16px 52px",
              boxShadow:
                "0 15px 40px rgba(245, 158, 11, 0.5), inset 0 0 20px rgba(245, 158, 11, 0.3)",
              textAlign: "center",
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <span
              style={{
                fontSize: "36px",
                filter: "drop-shadow(0 0 10px #F59E0B)",
              }}
            >
              ⚡
            </span>
            <div>
              <div
                style={{
                  fontSize: "40px",
                  fontWeight: "900",
                  color: "#FFFFFF",
                  letterSpacing: "4px",
                  textShadow:
                    "0 0 20px #F59E0B, 2px 2px 0 #D97706, 4px 4px 0 #000",
                }}
              >
                R - M A R T
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "#38BDF8",
                  fontWeight: "900",
                  letterSpacing: "3px",
                }}
              >
                100% TRUSTED SPEED COMMERCE
              </div>
            </div>
            <span
              style={{
                fontSize: "36px",
                filter: "drop-shadow(0 0 10px #F59E0B)",
              }}
            >
              ⚡
            </span>
          </div>
        </div>
      )}

      {/* ====================================================================
          MAIN STAGE: CARTOON LEO WALKING, TAPPING PHONE, BOXES DROPPING
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
        {/* CARTOON LEO (MAIN CHARACTER) */}
        <div
          style={{
            position: "absolute",
            bottom: "35px",
            left: stage === "walk_in" ? "42%" : "50%",
            transform:
              stage === "walk_in"
                ? "translateX(-160px)"
                : "translateX(-50%)",
            transition: "all 1.6s cubic-bezier(0.2, 0.8, 0.2, 1)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            zIndex: 25,
          }}
        >
          {/* FLOATING CARTOON HOLOGRAPHIC ORDER POPUP */}
          {(stage === "walk_in" || stage === "tap_order") && (
            <div
              style={{
                marginBottom: "12px",
                backgroundColor: "rgba(15, 23, 42, 0.95)",
                border: `3px solid ${
                  stage === "tap_order" ? "#10B981" : "#38BDF8"
                }`,
                borderRadius: "16px",
                padding: "10px 20px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                boxShadow:
                  stage === "tap_order"
                    ? "0 0 30px #10B981"
                    : "0 0 18px #38BDF8",
                animation:
                  stage === "tap_order"
                    ? "cartoonTapPop 0.4s ease"
                    : "cartoonFloat 2s infinite ease-in-out",
                backdropFilter: "blur(10px)",
              }}
            >
              <span style={{ fontSize: "24px" }}>🛒</span>
              <div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "#38BDF8",
                    fontWeight: "900",
                    textTransform: "uppercase",
                  }}
                >
                  R-Mart App Cart (2 Items)
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "900",
                    color: "#FFF",
                  }}
                >
                  {stage === "tap_order"
                    ? "🎉 ORDER CONFIRMED!"
                    : "Tap to Place Order"}
                </div>
              </div>

              <div
                style={{
                  backgroundColor:
                    stage === "tap_order" ? "#10B981" : "#F59E0B",
                  color: "#000",
                  fontWeight: "900",
                  fontSize: "12px",
                  padding: "8px 14px",
                  borderRadius: "10px",
                  boxShadow:
                    stage === "tap_order"
                      ? "0 0 15px #10B981"
                      : "0 0 10px #F59E0B",
                }}
              >
                {stage === "tap_order" ? "✔ CONFIRMED" : "PLACE ORDER"}
              </div>
            </div>
          )}

          {/* Leo Cartoon Vector Character */}
          <CartoonLeoCharacter stage={stage} />
        </div>

        {/* ====================================================================
            SCENE 5: CARTOON DELIVERY BOXES DROP SLOWLY FROM TOP ONTO HIS HEAD
            ==================================================================== */}
        {(stage === "boxes_drop" ||
          stage === "people_enter" ||
          stage === "show_dialogues" ||
          stage === "start_shopping") && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              zIndex: 35,
            }}
          >
            {/* Box 1 (Lands directly on his head with cartoon bonk) */}
            <div
              style={{
                position: "absolute",
                left: "48%",
                top: "140px",
                animation:
                  "cartoonDropBonk 0.85s cubic-bezier(0.25, 1, 0.5, 1) forwards",
              }}
            >
              <CartoonDeliveryBox size={75} />
            </div>

            {/* Box 2 (Left falling box) */}
            <div
              style={{
                position: "absolute",
                left: "34%",
                bottom: "35px",
                animation:
                  "cartoonBounceLeft 1s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards",
              }}
            >
              <CartoonDeliveryBox size={65} />
            </div>

            {/* Box 3 (Right falling box) */}
            <div
              style={{
                position: "absolute",
                right: "34%",
                bottom: "35px",
                animation:
                  "cartoonBounceRight 1s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards",
              }}
            >
              <CartoonDeliveryBox size={70} />
            </div>
          </div>
        )}

        {/* ====================================================================
            SCENE 6: OTHER CARTOON PEOPLE ENTER TAKING BOXES
            ==================================================================== */}
        {(stage === "people_enter" ||
          stage === "show_dialogues" ||
          stage === "start_shopping") && (
          <>
            {/* Cartoon Girl entering from left carrying box */}
            <div
              style={{
                position: "absolute",
                bottom: "30px",
                left: "8%",
                animation:
                  "cartoonRunInLeft 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                zIndex: 22,
              }}
            >
              <CartoonRunningGirl />
            </div>

            {/* Cartoon Courier entering from right carrying box */}
            <div
              style={{
                position: "absolute",
                bottom: "30px",
                right: "8%",
                animation:
                  "cartoonRunInRight 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                zIndex: 22,
              }}
            >
              <CartoonDeliveryBoy />
            </div>
          </>
        )}
      </div>

      {/* ====================================================================
          SCENE 7: EXACT REQUESTED DIALOGUES IN CARTOON COMIC BADGES
          "100% Trusted - Get Delivered in 24-48 hours"
          ==================================================================== */}
      {(stage === "show_dialogues" || stage === "start_shopping") && (
        <div
          style={{
            position: "relative",
            zIndex: 45,
            marginTop: "16px",
            textAlign: "center",
            animation: "cartoonPopUp 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
          }}
        >
          {/* Comic Cartoon Dialogue Cards */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "20px",
              flexWrap: "wrap",
              marginBottom: "24px",
            }}
          >
            {/* 100% Trusted */}
            <div
              style={{
                backgroundColor: "#10B981",
                border: "3px solid #FFFFFF",
                color: "#030712",
                padding: "14px 32px",
                borderRadius: "20px",
                fontWeight: "900",
                fontSize: "22px",
                letterSpacing: "1px",
                boxShadow:
                  "0 12px 28px rgba(16, 185, 129, 0.5), 0 0 15px rgba(255,255,255,0.4)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                transform: "rotate(-2deg)",
              }}
            >
              <span style={{ fontSize: "26px" }}>🛡️</span>
              <span>100% Trusted</span>
            </div>

            {/* Get Delivered in 24-48 hours */}
            <div
              style={{
                backgroundColor: "#F59E0B",
                border: "3px solid #FFFFFF",
                color: "#030712",
                padding: "14px 32px",
                borderRadius: "20px",
                fontWeight: "900",
                fontSize: "22px",
                letterSpacing: "1px",
                boxShadow:
                  "0 12px 28px rgba(245, 158, 11, 0.5), 0 0 15px rgba(255,255,255,0.4)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                transform: "rotate(2deg)",
              }}
            >
              <span style={{ fontSize: "26px" }}>⚡</span>
              <span>Get Delivered in 24-48 hours</span>
            </div>
          </div>

          {/* ====================================================================
              SCENE 8: START SHOPPING BUTTON TAKE THEM INTO WEBSITE
              ==================================================================== */}
          <button
            onClick={onFinish}
            style={{
              backgroundColor: "#38BDF8",
              color: "#030712",
              border: "4px solid #FFFFFF",
              padding: "18px 56px",
              borderRadius: "22px",
              fontSize: "22px",
              fontWeight: "900",
              cursor: "pointer",
              boxShadow:
                "0 14px 35px rgba(56, 189, 248, 0.6), 0 0 25px rgba(56, 189, 248, 0.4)",
              display: "inline-flex",
              alignItems: "center",
              gap: "14px",
              animation: "cartoonBounceBtn 1.6s infinite ease-in-out",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "scale(1.08) rotate(1deg)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform = "scale(1)")
            }
          >
            <span>🛍️</span>
            <span>START SHOPPING</span>
            <span>➔</span>
          </button>
        </div>
      )}

      {/* Embedded Cartoon Keyframe Animations */}
      <style>{`
        @keyframes cartoonBannerDrop {
          0% { transform: translateY(-200px) rotate(-4deg); opacity: 0; }
          70% { transform: translateY(10px) rotate(2deg); opacity: 1; }
          85% { transform: translateY(-6px) rotate(-1deg); }
          100% { transform: translateY(0) rotate(0deg); opacity: 1; }
        }

        @keyframes cartoonDropBonk {
          0% { transform: translateY(-340px) rotate(-30deg); opacity: 0; }
          60% { transform: translateY(0px) rotate(10deg); opacity: 1; }
          75% { transform: translateY(-25px) rotate(-5deg); }
          90% { transform: translateY(5px) rotate(2deg); }
          100% { transform: translateY(0px) rotate(0deg); opacity: 1; }
        }

        @keyframes cartoonBounceLeft {
          0% { transform: translateY(-250px) rotate(-40deg); opacity: 0; }
          70% { transform: translateY(0px) rotate(10deg); opacity: 1; }
          85% { transform: translateY(-15px) rotate(-5deg); }
          100% { transform: translateY(0px) rotate(0deg); opacity: 1; }
        }

        @keyframes cartoonBounceRight {
          0% { transform: translateY(-250px) rotate(40deg); opacity: 0; }
          70% { transform: translateY(0px) rotate(-10deg); opacity: 1; }
          85% { transform: translateY(-15px) rotate(5deg); }
          100% { transform: translateY(0px) rotate(0deg); opacity: 1; }
        }

        @keyframes cartoonRunInLeft {
          0% { transform: translateX(-220px) scale(0.9); opacity: 0; }
          100% { transform: translateX(0) scale(1); opacity: 1; }
        }

        @keyframes cartoonRunInRight {
          0% { transform: translateX(220px) scale(0.9); opacity: 0; }
          100% { transform: translateX(0) scale(1); opacity: 1; }
        }

        @keyframes cartoonPopUp {
          0% { opacity: 0; transform: scale(0.6) translateY(30px); }
          70% { opacity: 1; transform: scale(1.08) translateY(-6px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }

        @keyframes cartoonFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }

        @keyframes cartoonTapPop {
          0% { transform: scale(0.9); }
          50% { transform: scale(1.12); }
          100% { transform: scale(1); }
        }

        @keyframes spinStars {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.2); }
          100% { transform: rotate(360deg) scale(1); }
        }

        @keyframes cartoonBounceBtn {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-6px) scale(1.04); }
        }
      `}</style>
    </div>
  );
}
