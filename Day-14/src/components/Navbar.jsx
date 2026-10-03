import React from "react";
import { Link } from "react-router-dom";
import { useCartStore, useAuthStore, useUIStore } from "../store/useStore";

export default function Navbar() {
  const getCartCount = useCartStore((state) => state.getCartCount);
  const openCart = useCartStore((state) => state.openCart);

  const user = useAuthStore((state) => state.user);
  const newsBannerText = useUIStore((state) => state.newsBannerText);
  const openRightMenu = useUIStore((state) => state.openRightMenu);

  const isAdmin = user?.role === "admin";
  const cartCount = getCartCount();

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 24px",
        backgroundColor: "#000000",
        borderBottom: "1px solid #1E293B",
        position: "sticky",
        top: 0,
        zIndex: 50,
        backdropFilter: "blur(14px)",
        boxShadow: "0 4px 24px rgba(0, 0, 0, 0.8)",
        gap: "18px",
      }}
    >
      {/* 1. Brand Logo: R-Mart */}
      <Link
        to="/catalog"
        style={{
          textDecoration: "none",
          color: "#FFFFFF",
          fontSize: "20px",
          fontWeight: "900",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          letterSpacing: "-0.5px",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            color: "#F59E0B",
            fontSize: "22px",
            filter: "drop-shadow(0 0 8px rgba(245, 158, 11, 0.6))",
          }}
        >
          ⚡
        </span>
        <span style={{ letterSpacing: "1px" }}>
          <strong style={{ color: "#F59E0B" }}>R</strong>-MART
        </span>
      </Link>

      {/* 2. Admin-Controlled News Banner Scrolling in Human Readable Speed */}
      <div
        style={{
          flex: 1,
          overflow: "hidden",
          position: "relative",
          backgroundColor: "#0B0F19",
          borderRadius: "999px",
          border: "1px solid #1E293B",
          padding: "6px 14px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          maxWidth: "760px",
          boxShadow: "inset 0 1px 4px rgba(0,0,0,0.6)",
        }}
        title="Admin announcement banner (hover to pause reading)"
      >
        {/* News Badge */}
        <div
          style={{
            backgroundColor: "#F59E0B",
            color: "#000000",
            fontSize: "10px",
            fontWeight: "900",
            padding: "3px 8px",
            borderRadius: "999px",
            letterSpacing: "0.8px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            flexShrink: 0,
            boxShadow: "0 0 8px rgba(245, 158, 11, 0.4)",
          }}
        >
          <span>📢</span>
          <span>NEWS</span>
        </div>

        {/* Scrolling Ticker Track */}
        <div
          style={{
            flex: 1,
            overflow: "hidden",
            whiteSpace: "nowrap",
            position: "relative",
            maskImage:
              "linear-gradient(to right, transparent, black 15px, black 95%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent, black 15px, black 95%, transparent)",
          }}
        >
          <div
            className="scrolling-news-track"
            style={{
              display: "inline-block",
              color: "#F1F5F9",
              fontSize: "13px",
              fontWeight: "600",
              letterSpacing: "0.3px",
              cursor: "pointer",
            }}
          >
            {newsBannerText} • {newsBannerText}
          </div>
        </div>
      </div>

      {/* 3. Right Controls: Role Based Toggle and Cart */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexShrink: 0,
        }}
      >
        {/* FOR ADMIN: Welcome Admin Badge (NO CART OPTION!) */}
        {isAdmin && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: "rgba(245, 158, 11, 0.12)",
              border: "1px solid rgba(245, 158, 11, 0.4)",
              color: "#F59E0B",
              padding: "6px 12px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: "800",
            }}
          >
            <span>🛡️</span>
            <span>Welcome Admin</span>
          </div>
        )}

        {/* FOR USERS ONLY: Cart Button with Dynamic Badge */}
        {!isAdmin && (
          <button
            onClick={openCart}
            style={{
              backgroundColor: "#F59E0B",
              color: "#030712",
              border: "none",
              borderRadius: "10px",
              padding: "8px 16px",
              fontWeight: "900",
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 14px rgba(245, 158, 11, 0.35)",
              transition: "transform 0.15s ease",
            }}
          >
            <span>🛒</span>
            <span>Cart</span>
            <span
              style={{
                backgroundColor: "#030712",
                color: "#FFFFFF",
                borderRadius: "999px",
                padding: "2px 7px",
                fontSize: "11px",
                fontWeight: "900",
              }}
            >
              {cartCount}
            </span>
          </button>
        )}

        {/* Collapsible Toggle Menu Button (User Side / Admin Side) */}
        <button
          onClick={openRightMenu}
          style={{
            backgroundColor: "#0F172A",
            color: isAdmin ? "#F59E0B" : "#38BDF8",
            border: `1px solid ${
              isAdmin ? "rgba(245, 158, 11, 0.4)" : "rgba(56, 189, 248, 0.4)"
            }`,
            borderRadius: "10px",
            padding: "8px 14px",
            fontWeight: "800",
            fontSize: "13px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
          }}
          title={isAdmin ? "Open Admin Console Toggle" : "Open User Hub Toggle"}
        >
          <span>☰</span>
          <span>{isAdmin ? "Admin Toggle" : user?.name ? user.name.split(" ")[0] : "Account"}</span>
        </button>
      </div>
    </header>
  );
}
