import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../context/StoreContext";

export default function AuthPage() {
  const { setUser, theme } = useStore();
  const navigate = useNavigate();
  const isDark = theme === "dark";

  const [mode, setMode] = useState("login"); // "login" | "register"
  const [name, setName] = useState("");
  const [emailOrUser, setEmailOrUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Pre-configured registered accounts
  const KNOWN_ACCOUNTS = [
    { name: "Humza (Admin)", email: "admin@rmart.com", pass: "admin123", role: "admin", badge: "Admin Console" },
    { name: "Shaik (Admin)", email: "shaik@rmart.com", pass: "admin123", role: "admin", badge: "Admin Console" },
    { name: "Kavya (Shopper)", email: "kavya@gmail.com", pass: "user123", role: "user", badge: "Shopper" },
    { name: "Rahul (Shopper)", email: "rahul@gmail.com", pass: "user123", role: "user", badge: "Shopper" },
  ];

  const handleSelectPreload = (acc) => {
    setEmailOrUser(acc.email);
    setPassword(acc.pass);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const identifier = (emailOrUser || "").toLowerCase().trim();

    // REGISTER MODE
    if (mode === "register") {
      if (password.length < 4) {
        setError("Password must be at least 4 characters long.");
        setLoading(false);
        return;
      }

      const newShopper = {
        name: name.trim() || identifier.split("@")[0].toUpperCase() || "Shopper",
        email: identifier,
        role: "user",
      };

      localStorage.setItem("token", "user-token-" + Date.now());
      localStorage.setItem("user_role", "user");
      localStorage.setItem("rmart_user", JSON.stringify(newShopper));
      if (setUser) setUser(newShopper);

      alert(`Account registered! Welcome to R-MART, ${newShopper.name}!`);
      setLoading(false);
      navigate("/catalog");
      return;
    }

    // LOGIN MODE
    // 1. Check known list first (guaranteed instant login)
    const matched = KNOWN_ACCOUNTS.find(
      (a) => (a.email.toLowerCase() === identifier || a.name.toLowerCase().includes(identifier)) && a.pass === password
    );

    if (matched) {
      const userData = { name: matched.name, email: matched.email, role: matched.role };
      localStorage.setItem("token", `${matched.role}-token-${Date.now()}`);
      localStorage.setItem("user_role", matched.role);
      localStorage.setItem("rmart_user", JSON.stringify(userData));
      if (setUser) setUser(userData);
      setLoading(false);
      navigate(matched.role === "admin" ? "/admin" : "/catalog");
      return;
    }

    // 2. Direct Admin fallback credentials
    if (
      (identifier === "admin" || identifier === "admin@rmart.com" || identifier === "humza" || identifier === "shaik") &&
      (password === "admin123" || password === "admin")
    ) {
      const adminData = { name: "Humza", email: "admin@rmart.com", role: "admin" };
      localStorage.setItem("token", "admin-session-token");
      localStorage.setItem("user_role", "admin");
      localStorage.setItem("rmart_user", JSON.stringify(adminData));
      if (setUser) setUser(adminData);
      setLoading(false);
      navigate("/admin");
      return;
    }

    // 3. Any standard Shopper with password >= 4 chars
    if (password.length >= 4) {
      const shopperData = {
        name: identifier.split("@")[0].toUpperCase() || "Shopper",
        email: identifier,
        role: "user",
      };
      localStorage.setItem("token", "user-session-token");
      localStorage.setItem("user_role", "user");
      localStorage.setItem("rmart_user", JSON.stringify(shopperData));
      if (setUser) setUser(shopperData);
      setLoading(false);
      navigate("/catalog");
      return;
    }

    setLoading(false);
    setError("Invalid credentials. Try selecting one of the profile chips below.");
  };

  const c = {
    bg: isDark ? "#060913" : "#F8FAFC",
    cardBg: isDark ? "#0F172A" : "#FFFFFF",
    border: isDark ? "#1E293B" : "#E2E8F0",
    text: isDark ? "#F8FAFB" : "#0F172A",
    subtext: isDark ? "#94A3B8" : "#64748B",
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: c.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: "440px", backgroundColor: c.cardBg, border: `1px solid ${c.border}`, borderRadius: "16px", padding: "30px", boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}>
        
        <div style={{ textAlign: "center", marginBottom: "22px" }}>
          <div style={{ fontSize: "36px", marginBottom: "6px" }}>⚡</div>
          <h2 style={{ fontSize: "22px", fontWeight: "900", color: c.text, margin: 0 }}>
            {mode === "login" ? "Welcome Back to R-MART" : "Register Customer Account"}
          </h2>
          <p style={{ fontSize: "12px", color: c.subtext, marginTop: "6px" }}>
            Unified live shopping and administrative inventory portal
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: "flex", backgroundColor: isDark ? "#1E293B" : "#E2E8F0", borderRadius: "10px", padding: "4px", marginBottom: "20px" }}>
          <button
            type="button"
            onClick={() => { setMode("login"); setError(""); }}
            style={{
              flex: 1,
              padding: "8px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: mode === "login" ? "#3B82F6" : "transparent",
              color: mode === "login" ? "#FFF" : c.text,
              fontWeight: "800",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode("register"); setError(""); }}
            style={{
              flex: 1,
              padding: "8px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: mode === "register" ? "#3B82F6" : "transparent",
              color: mode === "register" ? "#FFF" : c.text,
              fontWeight: "800",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div style={{ backgroundColor: "rgba(239, 68, 68, 0.15)", border: "1px solid #EF4444", color: "#EF4444", borderRadius: "8px", padding: "10px", fontSize: "12px", fontWeight: "700", marginBottom: "16px", textAlign: "center" }}>
            {error}
          </div>
        )}

        {/* Quick Preload Chips */}
        {mode === "login" && (
          <div style={{ marginBottom: "18px" }}>
            <div style={{ fontSize: "11px", fontWeight: "800", color: c.subtext, marginBottom: "8px", textTransform: "uppercase" }}>
              Quick Fill Known Profiles:
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {KNOWN_ACCOUNTS.map((acc, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectPreload(acc)}
                  style={{
                    padding: "8px",
                    borderRadius: "8px",
                    border: `1px solid ${acc.role === "admin" ? "rgba(245, 158, 11, 0.5)" : c.border}`,
                    backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
                    color: c.text,
                    fontSize: "11px",
                    fontWeight: "800",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div>{acc.name}</div>
                  <div style={{ fontSize: "10px", color: acc.role === "admin" ? "#F59E0B" : "#10B981", fontWeight: "700" }}>
                    {acc.badge}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {mode === "register" && (
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: c.subtext, marginBottom: "6px" }}>Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Shaik Rehana"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", backgroundColor: isDark ? "#1E293B" : "#F1F5F9", border: `1px solid ${c.border}`, color: c.text, fontSize: "13px", outline: "none", boxSizing: "border-box" }}
              />
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: c.subtext, marginBottom: "6px" }}>
              {mode === "register" ? "Email Address *" : "Email or Username *"}
            </label>
            <input
              type="text"
              required
              placeholder={mode === "register" ? "name@example.com" : "admin@rmart.com or user"}
              value={emailOrUser}
              onChange={(e) => setEmailOrUser(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", backgroundColor: isDark ? "#1E293B" : "#F1F5F9", border: `1px solid ${c.border}`, color: c.text, fontSize: "13px", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: c.subtext, marginBottom: "6px" }}>Password *</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", backgroundColor: isDark ? "#1E293B" : "#F1F5F9", border: `1px solid ${c.border}`, color: c.text, fontSize: "13px", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: mode === "login" ? "#3B82F6" : "#10B981",
              color: "#FFFFFF",
              border: "none",
              padding: "12px",
              borderRadius: "8px",
              fontWeight: "900",
              fontSize: "14px",
              cursor: "pointer",
              marginTop: "6px",
            }}
          >
            {loading ? "Verifying..." : mode === "login" ? "Sign In →" : "Register & Start Shopping 🚀"}
          </button>
        </form>
      </div>
    </div>
  );
}
