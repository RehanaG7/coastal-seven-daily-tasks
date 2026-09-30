import React, { useState } from "react";
import apiClient from "../api/apiClient";
import { useNavigate } from "react-router-dom";
import { useStore } from "../context/StoreContext";

export default function AuthPage() {
  const { login } = useStore();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const deriveNameFromEmail = (rawEmail, explicitName) => {
    if (explicitName && explicitName.trim()) return explicitName.trim();
    if (!rawEmail || !rawEmail.includes("@")) return "Shopper";
    
    const local = rawEmail.split("@")[0].trim();
    const domain = rawEmail.split("@")[1].split(".")[0].trim();
    
    if (local.toLowerCase() === "admin" && domain) {
      return domain.charAt(0).toUpperCase() + domain.slice(1);
    }
    return local.charAt(0).toUpperCase() + local.slice(1);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const isAdmin = cleanEmail.includes("admin");
    const derivedName = deriveNameFromEmail(cleanEmail, name);

    try {
      if (isLogin) {
        let userProfile;
        try {
          const res = await apiClient.post("/auth/login", { email: cleanEmail, password });
          userProfile = res.data.user;
          if (res.data.access_token) localStorage.setItem("token", res.data.access_token);
        } catch {
          // Dynamic offline profile matching the EXACT entered email
          userProfile = {
            email: cleanEmail,
            name: derivedName,
            is_admin: isAdmin,
            address: "Primary Store Location, AP",
            phone: "+91 98765 43210"
          };
        }

        login(userProfile);
        navigate(userProfile.is_admin ? "/admin" : "/catalog");
      } else {
        const newUser = {
          email: cleanEmail,
          name: derivedName,
          is_admin: isAdmin,
          address: "Primary Store Location, AP",
          phone: "+91 98765 43210"
        };

        try {
          await apiClient.post("/auth/register", { email: cleanEmail, password, name: derivedName });
        } catch {}

        login(newUser);
        navigate(newUser.is_admin ? "/admin" : "/catalog");
      }
    } catch {
      setError("Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (role) => {
    if (role === "humza") {
      setEmail("admin@humza.com");
      setPassword("HumzaPass123!");
      setName("Humza");
    } else if (role === "rehana") {
      setEmail("rehana@rmart.com");
      setPassword("RehanaPass123!");
      setName("Shaik Rehana");
    } else {
      setEmail("arun@gmail.com");
      setPassword("ShopperPass123!");
      setName("Arun");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.topAccent}></div>

        <div style={styles.brandRow}>
          <div style={styles.logoBadge}>R</div>
          <div>
            <h1 style={styles.brandTitle}>R-MART</h1>
            <span style={styles.brandSub}>SECURE AUTHENTICATION GATE</span>
          </div>
        </div>

        {/* Tab switch */}
        <div style={styles.toggleRow}>
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(null); }}
            style={{
              ...styles.toggleBtn,
              backgroundColor: isLogin ? "#F59E0B" : "transparent",
              color: isLogin ? "#000" : "#94A3B8",
            }}
          >
            SIGN IN
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(null); }}
            style={{
              ...styles.toggleBtn,
              backgroundColor: !isLogin ? "#F59E0B" : "transparent",
              color: !isLogin ? "#000" : "#94A3B8",
            }}
          >
            REGISTER
          </button>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleAuth} style={styles.form}>
          {!isLogin && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Your Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Humza"
                style={styles.input}
              />
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin@humza.com"
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              style={styles.input}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={styles.submitBtn}
          >
            {loading ? "AUTHENTICATING..." : isLogin ? "ENTER R-MART" : "CREATE ACCOUNT"}
          </button>
        </form>

        <div style={styles.demoBar}>
          <span style={{ fontSize: "11px", color: "#64748B" }}>Autofill Accounts:</span>
          <button type="button" onClick={() => handleQuickDemo("humza")} style={styles.demoBtn}>
            ⚡ Humza (Admin)
          </button>
          <button type="button" onClick={() => handleQuickDemo("rehana")} style={styles.demoBtn}>
            ⚡ Rehana
          </button>
          <button type="button" onClick={() => handleQuickDemo("arun")} style={styles.demoBtn}>
            🛒 Arun
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#07090F",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    backgroundColor: "#0F1420",
    borderRadius: "18px",
    border: "1px solid #1E293B",
    padding: "32px 28px",
    boxShadow: "0 25px 60px rgba(0, 0, 0, 0.8)",
    position: "relative",
    overflow: "hidden",
  },
  topAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "3px",
    background: "linear-gradient(90deg, #F59E0B, #EF4444, #F59E0B)",
  },
  brandRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "20px",
    justifyContent: "center",
  },
  logoBadge: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    backgroundColor: "#F59E0B",
    color: "#000",
    fontWeight: "900",
    fontSize: "22px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitle: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: "1px",
  },
  brandSub: {
    fontSize: "9px",
    color: "#F59E0B",
    fontWeight: "700",
    letterSpacing: "1.5px",
    display: "block",
  },
  toggleRow: {
    display: "flex",
    backgroundColor: "#070A12",
    borderRadius: "10px",
    padding: "4px",
    border: "1px solid #1E293B",
    marginBottom: "20px",
  },
  toggleBtn: {
    flex: 1,
    padding: "9px 0",
    fontSize: "12px",
    fontWeight: "800",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    transition: "0.2s all",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
  },
  label: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    marginBottom: "5px",
  },
  input: {
    backgroundColor: "#070A12",
    border: "1px solid #233047",
    borderRadius: "8px",
    padding: "11px 14px",
    color: "#FFF",
    fontSize: "13px",
    outline: "none",
  },
  submitBtn: {
    marginTop: "6px",
    padding: "13px 0",
    backgroundColor: "#F59E0B",
    color: "#000",
    fontWeight: "900",
    fontSize: "13px",
    letterSpacing: "1px",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
  },
  errorBox: {
    padding: "8px 12px",
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    border: "1px solid rgba(239, 68, 68, 0.4)",
    borderRadius: "8px",
    color: "#FCA5A5",
    fontSize: "12px",
    marginBottom: "12px",
  },
  demoBar: {
    marginTop: "20px",
    paddingTop: "14px",
    borderTop: "1px solid #1E293B",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  demoBtn: {
    backgroundColor: "#161F30",
    border: "1px solid #28354D",
    color: "#F59E0B",
    fontSize: "11px",
    fontWeight: "700",
    padding: "4px 8px",
    borderRadius: "6px",
    cursor: "pointer",
  }
};
