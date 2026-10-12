import React, { useState, useEffect } from "react";
import { useUIStore } from "../store/useStore";

export default function BackendHealthBanner() {
  const [status, setStatus] = useState("checking"); // "online" | "offline" | "checking"
  const [latency, setLatency] = useState(null);
  const setBackendHealth = useUIStore((s) => s.setBackendHealth);
  const theme = useUIStore((s) => s.theme);
  const isDark = theme === "dark";

  const checkHealth = async () => {
    setStatus("checking");
    const start = performance.now();
    try {
      const res = await fetch("http://127.0.0.1:8000/", { method: "GET" });
      const elapsed = Math.round(performance.now() - start);
      if (res.ok) {
        setStatus("online");
        setLatency(elapsed);
        setBackendHealth({ status: "online", latencyMs: elapsed, lastChecked: new Date() });
      } else {
        setStatus("offline");
        setBackendHealth({ status: "offline", latencyMs: 0, lastChecked: new Date() });
      }
    } catch (err) {
      setStatus("offline");
      setBackendHealth({ status: "offline", latencyMs: 0, lastChecked: new Date() });
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div
      style={{
        backgroundColor: isDark ? "#060913" : "#F1F5F9",
        borderBottom: `1px solid ${isDark ? "#1E293B" : "#E2E8F0"}`,
        padding: "6px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontSize: "12px",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontWeight: "800",
            color: status === "online" ? "#10B981" : status === "checking" ? "#38BDF8" : "#F59E0B",
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: status === "online" ? "#10B981" : status === "checking" ? "#38BDF8" : "#F59E0B",
              boxShadow: status === "online" ? "0 0 8px #10B981" : "none",
            }}
          />
          {status === "online"
            ? `FastAPI Backend (Day 10): ONLINE (${latency}ms)`
            : status === "checking"
            ? "Pinging Day 10 FastAPI Server..."
            : "Day 10 FastAPI Backend: Offline (Using Local Fallback Cache)"}
        </span>

        {status === "offline" && (
          <span style={{ color: "#94A3B8", fontSize: "11px" }}>
            (To launch backend: <code>cd Day-10 && uvicorn main:app --reload</code>)
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button
          onClick={checkHealth}
          style={{
            background: "transparent",
            border: `1px solid ${isDark ? "#334155" : "#CBD5E1"}`,
            color: isDark ? "#94A3B8" : "#475569",
            padding: "2px 8px",
            borderRadius: "6px",
            fontSize: "11px",
            cursor: "pointer",
            fontWeight: "700",
          }}
        >
          🔄 Re-test Ping
        </button>
      </div>
    </div>
  );
}
