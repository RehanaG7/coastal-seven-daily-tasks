import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore, useUIStore } from "../store/useStore";

export default function RightMenuDrawer({ isOpen, onClose }) {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const switchRole = useAuthStore((s) => s.switchRole);
  const logout = useAuthStore((s) => s.logout);

  const theme = useUIStore((s) => s.theme);
  const isRightMenuOpen = useUIStore((s) => s.isRightMenuOpen);
  const closeRightMenu = useUIStore((s) => s.closeRightMenu);
  const newsBannerText = useUIStore((s) => s.newsBannerText);
  const setNewsBannerText = useUIStore((s) => s.setNewsBannerText);

  const navigate = useNavigate();
  const effectiveIsOpen = isOpen !== undefined ? isOpen : isRightMenuOpen;
  const handleClose = onClose || closeRightMenu;

  const isDark = theme === "dark";
  const isAdmin = user?.role === "admin";

  // Active view inside modal: "main" | "edit-profile-address" | "edit-admin-profile" | "add-news-offers"
  const [activeSubView, setActiveSubView] = useState("main");

  // Profile & Address edit state
  const [name, setName] = useState(user?.name || (isAdmin ? "Boss Administrator" : "Valued Shopper"));
  const [email, setEmail] = useState(user?.email || (isAdmin ? "admin@rmart.com" : "customer@rmart.com"));
  const [phone, setPhone] = useState(
    localStorage.getItem("rmart_user_phone") || user?.phone || "+91 98765 43210"
  );
  const [address, setAddress] = useState(
    localStorage.getItem("rmart_user_address") || user?.address || "Flat 402, Guntur Main Road, Andhra Pradesh"
  );
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  // News banner offers editor state
  const [bannerInput, setBannerInput] = useState(
    newsBannerText ||
      "⚡ Flash Sale: 50% OFF with code FLASH50 • 🛡️ 100% Genuine Tech • 🚀 Express Delivery in 24 Hours • 24/7 Live Support Active"
  );

  if (!effectiveIsOpen) return null;

  const handleRoleToggle = () => {
    const nextRole = isAdmin ? "customer" : "admin";
    switchRole(nextRole);
    setActiveSubView("main");
    if (nextRole === "admin") {
      navigate("/admin");
    } else {
      navigate("/catalog");
    }
  };

  const handleNavigate = (path) => {
    handleClose();
    navigate(path);
  };

  const handleSaveCustomerProfile = (e) => {
    e.preventDefault();
    const updatedUser = {
      ...(user || {}),
      name,
      email,
      phone,
      address,
      role: "customer"
    };
    setUser(updatedUser);
    localStorage.setItem("rmart_user", JSON.stringify(updatedUser));
    localStorage.setItem("rmart_user_phone", phone);
    localStorage.setItem("rmart_user_address", address);

    setSaveSuccessMsg("✅ Profile & Delivery Address saved successfully!");
    setTimeout(() => {
      setSaveSuccessMsg("");
      setActiveSubView("main");
    }, 1500);
  };

  const handleSaveAdminProfile = (e) => {
    e.preventDefault();
    const updatedUser = {
      ...(user || {}),
      name,
      email,
      role: "admin"
    };
    setUser(updatedUser);
    localStorage.setItem("rmart_user", JSON.stringify(updatedUser));

    setSaveSuccessMsg("✅ Admin Profile updated successfully!");
    setTimeout(() => {
      setSaveSuccessMsg("");
      setActiveSubView("main");
    }, 1500);
  };

  const handleUpdateNewsBanner = (e) => {
    e.preventDefault();
    if (!bannerInput.trim()) return;
    setNewsBannerText(bannerInput.trim());
    setSaveSuccessMsg("📢 Live Store News Banner updated!");
    setTimeout(() => {
      setSaveSuccessMsg("");
      setActiveSubView("main");
    }, 1500);
  };

  const handleInsertOfferTemplate = (template) => {
    setBannerInput((prev) => `${prev} • ${template}`);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Navigation Command Center"
      onClick={handleClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        animation: "fadeInModal 0.25s ease-out",
      }}
    >
      {/* Full-Screen Floating Transparent Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "580px",
          backgroundColor: isDark ? "rgba(11, 15, 25, 0.85)" : "rgba(255, 255, 255, 0.88)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          border: `1px solid ${isAdmin ? "rgba(245, 158, 11, 0.35)" : isDark ? "rgba(56, 189, 248, 0.3)" : "rgba(255, 255, 255, 0.6)"}`,
          borderRadius: "24px",
          padding: "30px",
          boxShadow: isDark
            ? "0 24px 60px rgba(0, 0, 0, 0.9), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
            : "0 24px 60px rgba(15, 23, 42, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
          color: isDark ? "#FFFFFF" : "#0F172A",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          position: "relative",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Header with Title and Close Button */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`, paddingBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "28px" }}>{isAdmin ? "🛡️" : "👤"}</span>
            <div>
              <h2 style={{ margin: 0, fontSize: "21px", fontWeight: "900", letterSpacing: "-0.5px" }}>
                {isAdmin ? "Admin Console" : "My Account"}
              </h2>
              <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: isDark ? "#94A3B8" : "#64748B" }}>
                {isAdmin ? "Store Operations & Live Banner Offers" : "Personal Profile & Order Tracking"}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            aria-label="Close menu"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "#CBD5E1"}`,
              backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
              color: isDark ? "#FFFFFF" : "#0F172A",
              fontSize: "17px",
              fontWeight: "900",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* User Identity / Role Switch Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: isDark ? "rgba(30, 41, 59, 0.5)" : "rgba(241, 245, 249, 0.7)",
            padding: "14px 18px",
            borderRadius: "16px",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                backgroundColor: isAdmin ? "#F59E0B" : "#38BDF8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                boxShadow: isAdmin
                  ? "0 4px 12px rgba(245, 158, 11, 0.4)"
                  : "0 4px 12px rgba(56, 189, 248, 0.4)",
              }}
            >
              {isAdmin ? "🛡️" : "👤"}
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: "800" }}>
                {user?.name || (isAdmin ? "Boss Administrator" : "Valued Shopper")}
              </div>
              <div style={{ fontSize: "12px", color: isDark ? "#94A3B8" : "#64748B" }}>
                {user?.email || (isAdmin ? "admin@rmart.com" : "customer@rmart.com")}
              </div>
            </div>
          </div>

          <button
            onClick={handleRoleToggle}
            title="Toggle between Shopper and Admin"
            style={{
              padding: "6px 14px",
              borderRadius: "10px",
              border: `1px solid ${isAdmin ? "#38BDF8" : "#F59E0B"}`,
              backgroundColor: isDark ? "rgba(0,0,0,0.3)" : "#FFFFFF",
              color: isAdmin ? "#38BDF8" : "#F59E0B",
              fontSize: "12px",
              fontWeight: "900",
              cursor: "pointer",
            }}
          >
            {isAdmin ? "Switch to Shopper 👤" : "Switch to Admin 🛡️"}
          </button>
        </div>

        {/* FEEDBACK ALERT MESSAGE */}
        {saveSuccessMsg && (
          <div
            style={{
              padding: "12px 16px",
              backgroundColor: "rgba(16, 185, 129, 0.15)",
              border: "1px solid #10B981",
              borderRadius: "12px",
              color: "#10B981",
              fontSize: "13px",
              fontWeight: "800",
              textAlign: "center",
            }}
          >
            {saveSuccessMsg}
          </div>
        )}

        {/* ==================================================================== */}
        {/* VIEW 1: MAIN MENU (STRICT SPECIFIED OPTIONS ONLY) */}
        {/* ==================================================================== */}
        {activeSubView === "main" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* ----------------- FOR USER (CUSTOMER) TOGGLE ----------------- */}
            {!isAdmin ? (
              <>
                {/* 1. Edit Profile & Address */}
                <button
                  onClick={() => setActiveSubView("edit-profile-address")}
                  style={{
                    padding: "18px 20px",
                    borderRadius: "16px",
                    border: `1px solid ${isDark ? "rgba(56, 189, 248, 0.2)" : "rgba(56, 189, 248, 0.3)"}`,
                    backgroundColor: isDark ? "rgba(15, 23, 42, 0.7)" : "rgba(255, 255, 255, 0.9)",
                    color: isDark ? "#FFFFFF" : "#0F172A",
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    transition: "transform 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ fontSize: "28px" }}>📝</div>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: "900" }}>Edit Profile & Address</div>
                      <div style={{ fontSize: "12px", color: isDark ? "#94A3B8" : "#64748B" }}>
                        Update your name, contact phone & delivery shipping address
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: "18px", color: isDark ? "#38BDF8" : "#0284C7" }}>➔</span>
                </button>

                {/* 2. My Orders */}
                <button
                  onClick={() => handleNavigate("/orders")}
                  style={{
                    padding: "18px 20px",
                    borderRadius: "16px",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
                    backgroundColor: isDark ? "rgba(15, 23, 42, 0.7)" : "rgba(255, 255, 255, 0.9)",
                    color: isDark ? "#FFFFFF" : "#0F172A",
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    transition: "transform 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ fontSize: "28px" }}>📦</div>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: "900" }}>My Orders</div>
                      <div style={{ fontSize: "12px", color: isDark ? "#94A3B8" : "#64748B" }}>
                        View recent purchases, tracking numbers & order history
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: "18px", color: isDark ? "#38BDF8" : "#0284C7" }}>➔</span>
                </button>
              </>
            ) : (
              /* ----------------- FOR ADMIN TOGGLE ----------------- */
              <>
                {/* 1. Edit Profile */}
                <button
                  onClick={() => setActiveSubView("edit-admin-profile")}
                  style={{
                    padding: "18px 20px",
                    borderRadius: "16px",
                    border: "1px solid rgba(245, 158, 11, 0.3)",
                    backgroundColor: isDark ? "rgba(15, 23, 42, 0.7)" : "rgba(255, 255, 255, 0.9)",
                    color: isDark ? "#FFFFFF" : "#0F172A",
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ fontSize: "28px" }}>👤</div>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: "900" }}>Edit Profile</div>
                      <div style={{ fontSize: "12px", color: isDark ? "#94A3B8" : "#64748B" }}>
                        Update admin credentials, display name & security contact
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: "18px", color: "#F59E0B" }}>➔</span>
                </button>

                {/* 2. Customers Orders */}
                <button
                  onClick={() => handleNavigate("/admin")}
                  style={{
                    padding: "18px 20px",
                    borderRadius: "16px",
                    border: "1px solid rgba(245, 158, 11, 0.3)",
                    backgroundColor: isDark ? "rgba(15, 23, 42, 0.7)" : "rgba(255, 255, 255, 0.9)",
                    color: isDark ? "#FFFFFF" : "#0F172A",
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ fontSize: "28px" }}>📦</div>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: "900" }}>Customers Orders</div>
                      <div style={{ fontSize: "12px", color: isDark ? "#94A3B8" : "#64748B" }}>
                        Review live customer shipments, statuses & invoice downloads
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: "18px", color: "#F59E0B" }}>➔</span>
                </button>

                {/* 3. Add Offers in News Banner */}
                <button
                  onClick={() => setActiveSubView("add-news-offers")}
                  style={{
                    padding: "18px 20px",
                    borderRadius: "16px",
                    border: "1px solid rgba(245, 158, 11, 0.3)",
                    backgroundColor: isDark ? "rgba(15, 23, 42, 0.7)" : "rgba(255, 255, 255, 0.9)",
                    color: isDark ? "#FFFFFF" : "#0F172A",
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ fontSize: "28px" }}>📢</div>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: "900" }}>Add Offers in News Banner</div>
                      <div style={{ fontSize: "12px", color: isDark ? "#94A3B8" : "#64748B" }}>
                        Publish discount codes (FLASH50) to the scrolling store marquee
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: "18px", color: "#F59E0B" }}>➔</span>
                </button>
              </>
            )}
          </div>
        )}

        {/* ==================================================================== */}
        {/* VIEW 2: CUSTOMER - EDIT PROFILE & ADDRESS */}
        {/* ==================================================================== */}
        {activeSubView === "edit-profile-address" && (
          <form onSubmit={handleSaveCustomerProfile} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: "16px", fontWeight: "900" }}>📝 Edit Profile & Delivery Address</div>
              <button
                type="button"
                onClick={() => setActiveSubView("main")}
                style={{ background: "none", border: "none", color: isDark ? "#38BDF8" : "#0284C7", cursor: "pointer", fontSize: "13px", fontWeight: "800" }}
              >
                ← Back
              </button>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "800", marginBottom: "4px", color: isDark ? "#94A3B8" : "#64748B" }}>
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: `1px solid ${isDark ? "#334155" : "#CBD5E1"}`,
                  backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                  color: isDark ? "#FFFFFF" : "#0F172A",
                  fontSize: "14px",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "800", marginBottom: "4px", color: isDark ? "#94A3B8" : "#64748B" }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: `1px solid ${isDark ? "#334155" : "#CBD5E1"}`,
                  backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                  color: isDark ? "#FFFFFF" : "#0F172A",
                  fontSize: "14px",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "800", marginBottom: "4px", color: isDark ? "#94A3B8" : "#64748B" }}>
                Contact Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: `1px solid ${isDark ? "#334155" : "#CBD5E1"}`,
                  backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                  color: isDark ? "#FFFFFF" : "#0F172A",
                  fontSize: "14px",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "800", marginBottom: "4px", color: isDark ? "#94A3B8" : "#64748B" }}>
                Delivery Address (Street, Flat, City, PIN)
              </label>
              <textarea
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: `1px solid ${isDark ? "#334155" : "#CBD5E1"}`,
                  backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                  color: isDark ? "#FFFFFF" : "#0F172A",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  fontFamily: "inherit"
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                marginTop: "6px",
                padding: "12px",
                borderRadius: "12px",
                border: "none",
                backgroundColor: "#38BDF8",
                color: "#0F172A",
                fontSize: "14px",
                fontWeight: "900",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(56, 189, 248, 0.4)",
              }}
            >
              💾 Save Profile & Address
            </button>
          </form>
        )}

        {/* ==================================================================== */}
        {/* VIEW 3: ADMIN - EDIT PROFILE */}
        {/* ==================================================================== */}
        {activeSubView === "edit-admin-profile" && (
          <form onSubmit={handleSaveAdminProfile} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: "16px", fontWeight: "900" }}>👤 Edit Admin Profile</div>
              <button
                type="button"
                onClick={() => setActiveSubView("main")}
                style={{ background: "none", border: "none", color: "#F59E0B", cursor: "pointer", fontSize: "13px", fontWeight: "800" }}
              >
                ← Back
              </button>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "800", marginBottom: "4px", color: isDark ? "#94A3B8" : "#64748B" }}>
                Admin Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: `1px solid ${isDark ? "#334155" : "#CBD5E1"}`,
                  backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                  color: isDark ? "#FFFFFF" : "#0F172A",
                  fontSize: "14px",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "800", marginBottom: "4px", color: isDark ? "#94A3B8" : "#64748B" }}>
                Admin Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: `1px solid ${isDark ? "#334155" : "#CBD5E1"}`,
                  backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                  color: isDark ? "#FFFFFF" : "#0F172A",
                  fontSize: "14px",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ padding: "12px", borderRadius: "10px", backgroundColor: isDark ? "rgba(245, 158, 11, 0.1)" : "#FEF3C7", fontSize: "12px", color: "#F59E0B" }}>
              🛡️ Role Designation: <strong>Store Administrator (Master Access)</strong>
            </div>

            <button
              type="submit"
              style={{
                marginTop: "6px",
                padding: "12px",
                borderRadius: "12px",
                border: "none",
                backgroundColor: "#F59E0B",
                color: "#000000",
                fontSize: "14px",
                fontWeight: "900",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(245, 158, 11, 0.4)",
              }}
            >
              💾 Save Admin Profile
            </button>
          </form>
        )}

        {/* ==================================================================== */}
        {/* VIEW 4: ADMIN - ADD OFFERS IN NEWS BANNER */}
        {/* ==================================================================== */}
        {activeSubView === "add-news-offers" && (
          <form onSubmit={handleUpdateNewsBanner} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: "16px", fontWeight: "900" }}>📢 Add Offers in News Banner</div>
              <button
                type="button"
                onClick={() => setActiveSubView("main")}
                style={{ background: "none", border: "none", color: "#F59E0B", cursor: "pointer", fontSize: "13px", fontWeight: "800" }}
              >
                ← Back
              </button>
            </div>

            {/* Quick Template Chips */}
            <div>
              <span style={{ fontSize: "11px", fontWeight: "800", color: isDark ? "#94A3B8" : "#64748B" }}>
                Quick Offer Presets (Click to insert):
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                {[
                  "⚡ 50% OFF FLASH SALE with code FLASH50",
                  "🚚 Zero-Cost Express Shipping (Code FREESHIP)",
                  "🎁 Weekend Gadget Bonanza - Extra 15% Cashback",
                  "🔥 Exclusive S24 Ultra & iPhone 15 Drops Available"
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleInsertOfferTemplate(preset)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: "8px",
                      border: "1px solid rgba(245, 158, 11, 0.3)",
                      backgroundColor: isDark ? "rgba(245, 158, 11, 0.1)" : "#FEF3C7",
                      color: isDark ? "#FDE68A" : "#B45309",
                      fontSize: "11px",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    + {preset.split(" ")[0]} {preset.split(" ")[1]}
                  </button>
                ))}
              </div>
            </div>

            {/* Banner Text Area */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "800", marginBottom: "4px", color: isDark ? "#94A3B8" : "#64748B" }}>
                Live Marquee News Banner Content
              </label>
              <textarea
                rows={3}
                value={bannerInput}
                onChange={(e) => setBannerInput(e.target.value)}
                required
                placeholder="Type new offer text to broadcast across the top of R-Mart..."
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: `1px solid ${isDark ? "#334155" : "#CBD5E1"}`,
                  backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                  color: isDark ? "#FFFFFF" : "#0F172A",
                  fontSize: "13px",
                  boxSizing: "border-box",
                  fontFamily: "inherit"
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                marginTop: "6px",
                padding: "12px",
                borderRadius: "12px",
                border: "none",
                backgroundColor: "#F59E0B",
                color: "#000000",
                fontSize: "14px",
                fontWeight: "900",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(245, 158, 11, 0.4)",
              }}
            >
              📢 Publish to Live News Banner
            </button>
          </form>
        )}

        {/* Footer with Sign Out and Close */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "14px", borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}` }}>
          <button
            onClick={() => {
              logout();
              handleClose();
              navigate("/catalog");
            }}
            style={{
              background: "none",
              border: "none",
              color: "#EF4444",
              fontSize: "13px",
              fontWeight: "800",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>🚪</span>
            <span>Sign Out</span>
          </button>

          <button
            onClick={handleClose}
            style={{
              backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
              color: isDark ? "#FFFFFF" : "#0F172A",
              border: "none",
              padding: "8px 18px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: "800",
              cursor: "pointer",
            }}
          >
            Back to Store
          </button>
        </div>
      </div>
    </div>
  );
}
