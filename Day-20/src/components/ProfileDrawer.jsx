import React, { useState } from "react";
import { useStore } from "../context/StoreContext";
import { useNavigate } from "react-router-dom";

export default function ProfileDrawer({ isOpen, onClose }) {
  const { theme, user, login, logout, orders, updateOrderStatus, tickets, addTicket } = useStore();
  const [activeTab, setActiveTab] = useState("details"); // details | address | orders | support
  const isDark = theme === "dark";
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || "Shopper");
  const [phone, setPhone] = useState(user?.phone || "+91 98765 43210");
  const [address, setAddress] = useState(user?.address || "Flat 402, Guntur Main Road, Andhra Pradesh");
  const [msgSaved, setMsgSaved] = useState(false);

  const [tckSubject, setTckSubject] = useState("");
  const [tckMsg, setTckMsg] = useState("");

  if (!isOpen) return null;

  const c = {
    panelBg: isDark ? "#0D111A" : "#FFFFFF",
    cardBg: isDark ? "#07090F" : "#F1F5F9",
    border: isDark ? "#1E2738" : "#E2E8F0",
    text: isDark ? "#F8FAFC" : "#0F172A",
    subtext: isDark ? "#94A3B8" : "#64748B",
    accent: "#F59E0B",
  };

  const saveProfile = (e) => {
    e.preventDefault();
    login({ ...user, name, phone, address });
    setMsgSaved(true);
    setTimeout(() => setMsgSaved(false), 2500);
  };

  const handleSupportSubmit = (e) => {
    e.preventDefault();
    if (!tckSubject || !tckMsg) return;
    addTicket(tckSubject, tckMsg);
    setTckSubject("");
    setTckMsg("");
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.6)" }} />

      <div style={{
        position: "relative",
        width: "100%",
        maxWidth: "460px",
        height: "100%",
        backgroundColor: c.panelBg,
        borderLeft: `1px solid ${c.border}`,
        boxShadow: "-10px 0 50px rgba(0,0,0,0.8)",
        display: "flex",
        flexDirection: "column",
        padding: "24px",
        boxSizing: "border-box",
        fontFamily: "system-ui, sans-serif",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "900", color: c.text }}>Shopper Profile</h2>
            <span style={{ fontSize: "12px", color: c.subtext }}>{user?.email}</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: `1px solid ${c.border}`, borderRadius: "6px", color: c.text, padding: "4px 8px", cursor: "pointer" }}>
            ?
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "6px", marginBottom: "20px" }}>
          {[
            { id: "details", label: "Profile" },
            { id: "address", label: "Address" },
            { id: "orders", label: `Orders (${orders.length})` },
            { id: "support", label: "Support" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                backgroundColor: activeTab === t.id ? c.accent : (isDark ? "#161F30" : "#E2E8F0"),
                color: activeTab === t.id ? "#000" : c.text,
                fontWeight: "800",
                fontSize: "11px",
                padding: "8px 4px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {msgSaved && (
          <div style={{ padding: "8px 12px", backgroundColor: "#10B98125", color: "#10B981", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", marginBottom: "12px" }}>
            Profile details updated successfully!
          </div>
        )}

        <div style={{ flex: 1, overflowY: "auto", paddingRight: "4px" }}>
          {activeTab === "details" && (
            <form onSubmit={saveProfile} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: "800", color: c.subtext }}>FULL NAME</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${c.border}`, backgroundColor: c.cardBg, color: c.text, marginTop: "4px", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "11px", fontWeight: "800", color: c.subtext }}>PHONE NUMBER</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${c.border}`, backgroundColor: c.cardBg, color: c.text, marginTop: "4px", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "11px", fontWeight: "800", color: c.subtext }}>ACCOUNT ROLE</label>
                <input
                  type="text"
                  disabled
                  value={user?.is_admin ? "Administrator (Full Access)" : "Verified Shopper"}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${c.border}`, backgroundColor: c.cardBg, color: c.subtext, marginTop: "4px", boxSizing: "border-box" }}
                />
              </div>

              <button
                type="submit"
                style={{ backgroundColor: c.accent, color: "#000", fontWeight: "900", padding: "12px", borderRadius: "8px", border: "none", cursor: "pointer", marginTop: "10px" }}
              >
                Save Details
              </button>
            </form>
          )}

          {activeTab === "address" && (
            <form onSubmit={saveProfile} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <label style={{ fontSize: "11px", fontWeight: "800", color: c.subtext }}>DEFAULT DELIVERY ADDRESS</label>
              <textarea
                rows="4"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${c.border}`, backgroundColor: c.cardBg, color: c.text, boxSizing: "border-box" }}
              />
              <button
                type="submit"
                style={{ backgroundColor: c.accent, color: "#000", fontWeight: "900", padding: "12px", borderRadius: "8px", border: "none", cursor: "pointer" }}
              >
                Update Shipping Address
              </button>
            </form>
          )}

          {activeTab === "orders" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {orders.length === 0 ? (
                <div style={{ textAlign: "center", color: c.subtext, padding: "30px 0" }}>No orders placed yet.</div>
              ) : (
                orders.map((ord) => (
                  <div key={ord.id} style={{ backgroundColor: c.cardBg, border: `1px solid ${c.border}`, borderRadius: "10px", padding: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontWeight: "900", color: c.accent }}>#{ord.id}</span>
                      <span style={{
                        backgroundColor: ord.status.includes("Shipped") ? "#10B981" : ord.status === "Cancelled" ? "#EF4444" : "#F59E0B",
                        color: "#000",
                        fontWeight: "900",
                        fontSize: "10px",
                        padding: "3px 8px",
                        borderRadius: "12px",
                      }}>
                        {ord.status}
                      </span>
                    </div>

                    <div style={{ fontSize: "12px", color: c.text, margin: "6px 0" }}>
                      {ord.items.map((it, i) => (
                        <div key={i}>{it.quantity || 1}x {it.name || it.title}</div>
                      ))}
                    </div>

                    <div style={{ fontSize: "11px", color: c.subtext, borderTop: `1px solid ${c.border}`, paddingTop: "8px", marginTop: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>Total: <b>${Number(ord.total).toFixed(2)}</b></span>
                      {ord.status !== "Cancelled" && (
                        <button
                          onClick={() => updateOrderStatus(ord.id, "Cancelled")}
                          style={{ backgroundColor: "transparent", border: "1px solid #EF4444", color: "#EF4444", padding: "3px 8px", borderRadius: "4px", fontSize: "11px", cursor: "pointer" }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "support" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <form onSubmit={handleSupportSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <input
                  type="text"
                  required
                  placeholder="Ticket Subject"
                  value={tckSubject}
                  onChange={(e) => setTckSubject(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${c.border}`, backgroundColor: c.cardBg, color: c.text, boxSizing: "border-box" }}
                />
                <textarea
                  required
                  rows="3"
                  placeholder="How can our admin support team help you?"
                  value={tckMsg}
                  onChange={(e) => setTckMsg(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${c.border}`, backgroundColor: c.cardBg, color: c.text, boxSizing: "border-box" }}
                />
                <button
                  type="submit"
                  style={{ backgroundColor: c.accent, color: "#000", fontWeight: "900", padding: "10px", borderRadius: "8px", border: "none", cursor: "pointer" }}
                >
                  Raise Ticket
                </button>
              </form>

              <div style={{ borderTop: `1px solid ${c.border}`, paddingTop: "12px" }}>
                <span style={{ fontSize: "12px", fontWeight: "800", color: c.subtext }}>Active Tickets:</span>
                {tickets.map((t) => (
                  <div key={t.id} style={{ backgroundColor: c.cardBg, padding: "10px", borderRadius: "8px", marginTop: "8px", border: `1px solid ${c.border}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                      <span style={{ fontWeight: "bold", color: c.text }}>{t.subject}</span>
                      <span style={{ color: c.accent, fontWeight: "bold" }}>{t.status}</span>
                    </div>
                    <p style={{ margin: "4px 0 0", fontSize: "11px", color: c.subtext }}>{t.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ borderTop: `1px solid ${c.border}`, paddingTop: "14px", marginTop: "14px" }}>
          <button
            onClick={() => { logout(); onClose(); navigate("/auth"); }}
            style={{ width: "100%", padding: "12px", backgroundColor: "#EF444420", border: "1px solid #EF4444", color: "#EF4444", fontWeight: "900", borderRadius: "8px", cursor: "pointer" }}
          >
            Sign Out of R-Mart
          </button>
        </div>
      </div>
    </div>
  );
}
