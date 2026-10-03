import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore, useUIStore } from "../store/useStore";

export default function AuthPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const triggerIntro = useUIStore((s) => s.triggerIntro);
  const theme = useUIStore((s) => s.theme);
  const isDark = theme === "dark";

  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState("user"); // "user" | "admin"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [autoFilled, setAutoFilled] = useState(false);

  // Auto-enter details if once registered
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("rmart_registered_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.password) setPassword(parsed.password);
        if (parsed.name) setName(parsed.name);
        if (parsed.role) setRole(parsed.role);
        setIsRegister(false); // default to login mode
        setAutoFilled(true);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please fill in both email and password.");
      return;
    }

    if (isRegister && !name.trim()) {
      setError("Please provide your name to register.");
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const finalName = name.trim() || cleanEmail.split("@")[0];

    const authenticatedUser = {
      name: finalName,
      email: cleanEmail,
      role: role,
    };

    // Auto-save registered credentials to localStorage so user never has to retype
    try {
      localStorage.setItem(
        "rmart_registered_user",
        JSON.stringify({
          name: finalName,
          email: cleanEmail,
          password: password,
          role: role,
        })
      );
    } catch (err) {}

    const token = `rmart_jwt_${role}_${Date.now()}`;
    setUser(authenticatedUser, token);

    // Flow Routing:
    // If Admin -> Enters Products Page directly ("welcome admin - as usual products page same like users but no cart option")
    // If User -> Launch Full-Screen Cinematic Animation and go to Products page!
    if (role === "admin") {
      navigate("/catalog");
    } else {
      triggerIntro();
      navigate("/catalog");
    }
  };

  const c = {
    bg: isDark ? "#030712" : "#F8FAFC",
    card: isDark ? "#0F172A" : "#FFFFFF",
    border: isDark ? "#1E293B" : "#CBD5E1",
    text: isDark ? "#F8FAFC" : "#0F172A",
    subtext: isDark ? "#94A3B8" : "#64748B",
    inputBg: isDark ? "#1E293B" : "#F1F5F9",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: c.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          backgroundColor: c.card,
          border: `1px solid ${c.border}`,
          borderRadius: "20px",
          padding: "36px 30px",
          boxShadow: isDark
            ? "0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 25px rgba(56, 189, 248, 0.15)"
            : "0 20px 40px -15px rgba(0, 0, 0, 0.1)",
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ fontSize: "36px", marginBottom: "6px" }}>⚡</div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "900",
              color: c.text,
              margin: 0,
              letterSpacing: "-0.5px",
            }}
          >
            R - M A R T
          </h1>
          <p style={{ color: c.subtext, fontSize: "13px", marginTop: "4px" }}>
            {isRegister ? "Create a new account" : "Welcome back! Sign in to continue"}
          </p>
        </div>

        {/* Tab Toggle: Login vs Register */}
        <div
          style={{
            display: "flex",
            backgroundColor: c.inputBg,
            borderRadius: "12px",
            padding: "4px",
            marginBottom: "24px",
          }}
        >
          <button
            type="button"
            onClick={() => setIsRegister(false)}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: !isRegister ? "#38BDF8" : "transparent",
              color: !isRegister ? "#030712" : c.subtext,
              fontWeight: "800",
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setIsRegister(true)}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: isRegister ? "#38BDF8" : "transparent",
              color: isRegister ? "#030712" : c.subtext,
              fontWeight: "800",
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            Register
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              backgroundColor: "rgba(220, 38, 38, 0.15)",
              border: "1px solid #DC2626",
              color: "#EF4444",
              padding: "10px 14px",
              borderRadius: "10px",
              fontSize: "12px",
              fontWeight: "700",
              marginBottom: "20px",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        {/* Auto-Filled Registered Credentials Notice */}
        {autoFilled && (
          <div
            style={{
              backgroundColor: "rgba(16, 185, 129, 0.12)",
              border: "1px solid #10B981",
              borderRadius: "12px",
              padding: "12px 14px",
              marginBottom: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ color: "#10B981", fontSize: "12px", fontWeight: "900" }}>
                ✨ Details Auto-Entered!
              </div>
              <div style={{ color: c.subtext, fontSize: "11px", marginTop: "2px" }}>
                Welcome back, <strong>{name || email}</strong>. No need to type again.
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setName("");
                setEmail("");
                setPassword("");
                setAutoFilled(false);
                try {
                  localStorage.removeItem("rmart_registered_user");
                } catch (e) {}
              }}
              style={{
                background: "none",
                border: "none",
                color: "#94A3B8",
                fontSize: "11px",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Clear
            </button>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {autoFilled && (
            <button
              type="button"
              onClick={handleSubmit}
              style={{
                backgroundColor: "#10B981",
                color: "#FFFFFF",
                border: "none",
                padding: "12px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: "900",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginBottom: "4px",
              }}
            >
              <span>⚡</span>
              <span>One-Click Sign In as {name || email.split("@")[0]}</span>
            </button>
          )}
          {/* Name Field (if registering) */}
          {isRegister && (
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: c.text, marginBottom: "6px" }}>
                Full Name
              </label>
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: `1px solid ${c.border}`,
                  backgroundColor: c.inputBg,
                  color: c.text,
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          )}

          {/* Email */}
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: c.text, marginBottom: "6px" }}>
              Email Address
            </label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "10px",
                border: `1px solid ${c.border}`,
                backgroundColor: c.inputBg,
                color: c.text,
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Password */}
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: c.text, marginBottom: "6px" }}>
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "10px",
                border: `1px solid ${c.border}`,
                backgroundColor: c.inputBg,
                color: c.text,
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Role Selection: User or Admin */}
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: c.text, marginBottom: "8px" }}>
              Account Type / Role
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "12px 8px",
                  borderRadius: "10px",
                  backgroundColor: role === "user" ? "rgba(56, 189, 248, 0.15)" : c.inputBg,
                  border: `2px solid ${role === "user" ? "#38BDF8" : c.border}`,
                  cursor: "pointer",
                  fontWeight: "800",
                  fontSize: "13px",
                  color: role === "user" ? "#38BDF8" : c.subtext,
                }}
              >
                <input
                  type="radio"
                  name="role"
                  value="user"
                  checked={role === "user"}
                  onChange={() => setRole("user")}
                  style={{ display: "none" }}
                />
                <span>👤 Customer</span>
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "12px 8px",
                  borderRadius: "10px",
                  backgroundColor: role === "admin" ? "rgba(245, 158, 11, 0.15)" : c.inputBg,
                  border: `2px solid ${role === "admin" ? "#F59E0B" : c.border}`,
                  cursor: "pointer",
                  fontWeight: "800",
                  fontSize: "13px",
                  color: role === "admin" ? "#F59E0B" : c.subtext,
                }}
              >
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={role === "admin"}
                  onChange={() => setRole("admin")}
                  style={{ display: "none" }}
                />
                <span>🛡️ Admin</span>
              </label>
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            style={{
              marginTop: "8px",
              backgroundColor: "#F59E0B",
              color: "#030712",
              border: "none",
              padding: "14px",
              borderRadius: "12px",
              fontSize: "15px",
              fontWeight: "900",
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(245, 158, 11, 0.4)",
              transition: "transform 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            {isRegister ? "Register & Continue →" : "Sign In →"}
          </button>
        </form>

        {/* Quick Demo Pre-fill */}
        <div style={{ marginTop: "24px", paddingTop: "18px", borderTop: `1px solid ${c.border}`, textAlign: "center" }}>
          <span style={{ fontSize: "11px", color: c.subtext, fontWeight: "700" }}>Quick Demo Test: </span>
          <button
            type="button"
            onClick={() => {
              setEmail("shopper@rmart.com");
              setPassword("pass123");
              setName("Rehana Shaik");
              setRole("user");
            }}
            style={{
              background: "none",
              border: "none",
              color: "#38BDF8",
              fontSize: "11px",
              fontWeight: "800",
              cursor: "pointer",
              textDecoration: "underline",
              marginRight: "10px",
            }}
          >
            Fill Customer
          </button>
          <button
            type="button"
            onClick={() => {
              setEmail("admin@rmart.com");
              setPassword("admin123");
              setName("Store Manager");
              setRole("admin");
            }}
            style={{
              background: "none",
              border: "none",
              color: "#F59E0B",
              fontSize: "11px",
              fontWeight: "800",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Fill Admin
          </button>
        </div>
      </div>
    </div>
  );
}
