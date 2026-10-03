import React, { useState, useEffect } from "react";
import { useStore } from "../context/StoreContext";
import { useNavigate, useLocation } from "react-router-dom";

export default function RightMenuDrawer({ isOpen, onClose }) {
  const { user, setUser, theme } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isDark = theme === "dark";

  const isAdmin = user?.role === "admin" || localStorage.getItem("user_role") === "admin" || location.pathname.startsWith("/admin");

  const [activeView, setActiveView] = useState("menu");
  const [profileName, setProfileName] = useState(user?.name || (isAdmin ? "Admin" : "Customer"));
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([
    { id: 101, name: "Mechanical RGB Gaming Keyboard", price: 89.99 },
    { id: 102, name: "Nebula Pro Wireless Headset", price: 119.99 }
  ]);

  // Support Tickets / Complaints State
  const [tickets, setTickets] = useState([]);
  const [activeTicketId, setActiveTicketId] = useState(null);
  const [newTicketSubject, setNewTicketSubject] = useState("");
  const [newTicketMsg, setNewTicketMsg] = useState("");
  const [chatInput, setChatInput] = useState("");

  // Sync tickets and orders from localStorage
  const reloadData = () => {
    const storedOrders = JSON.parse(localStorage.getItem("rmart_admin_orders") || "[]");
    setOrders(storedOrders);

    const storedTickets = JSON.parse(localStorage.getItem("rmart_support_tickets") || "[]");
    if (storedTickets.length === 0) {
      const defaultTicket = {
        id: "TCK-1001",
        user: "Kavya R.",
        subject: "Late Dispatch Tracking Inquiry",
        status: "open",
        created: "Today at 11:45 AM",
        messages: [
          { sender: "user", text: "Hi, my order tracking has been stuck on automated dispatch for 30 minutes.", time: "11:45 AM" },
          { sender: "admin", text: "Hello Kavya! Checking with our warehouse dispatch hub right now.", time: "11:47 AM" }
        ]
      };
      localStorage.setItem("rmart_support_tickets", JSON.stringify([defaultTicket]));
      setTickets([defaultTicket]);
    } else {
      setTickets(storedTickets);
    }
  };

  useEffect(() => {
    if (isOpen) {
      reloadData();
      setActiveView("menu");
      setActiveTicketId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_role");
    if (setUser) setUser(null);
    onClose();
    navigate("/auth");
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (setUser) setUser({ ...user, name: profileName });
    alert("Profile saved successfully!");
    setActiveView("menu");
  };

  // User: Raise a new ticket
  const handleCreateTicket = (e) => {
    e.preventDefault();
    if (!newTicketSubject.trim() || !newTicketMsg.trim()) return;

    const newTicket = {
      id: "TCK-" + Math.floor(1000 + Math.random() * 9000),
      user: user?.name || "Customer",
      subject: newTicketSubject,
      status: "open",
      created: "Just now",
      messages: [
        { sender: "user", text: newTicketMsg, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }
      ]
    };

    const updated = [newTicket, ...tickets];
    localStorage.setItem("rmart_support_tickets", JSON.stringify(updated));
    setTickets(updated);
    setNewTicketSubject("");
    setNewTicketMsg("");
    setActiveTicketId(newTicket.id);
  };

  // Both: Send message in active chat thread
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeTicketId) return;

    const updated = tickets.map((t) => {
      if (t.id === activeTicketId) {
        return {
          ...t,
          messages: [
            ...t.messages,
            {
              sender: isAdmin ? "admin" : "user",
              text: chatInput,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            }
          ]
        };
      }
      return t;
    });

    localStorage.setItem("rmart_support_tickets", JSON.stringify(updated));
    setTickets(updated);
    setChatInput("");
  };

  // User: Close ticket -> Notifies Admin
  const handleCloseTicket = (ticketId) => {
    const updated = tickets.map((t) => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: "closed",
          messages: [
            ...t.messages,
            { sender: "system", text: "✅ Ticket was marked as RESOLVED and CLOSED by customer.", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }
          ]
        };
      }
      return t;
    });

    localStorage.setItem("rmart_support_tickets", JSON.stringify(updated));
    setTickets(updated);
    alert(`Ticket #${ticketId} closed! Admin has been notified.`);
  };

  const selectedTicket = tickets.find((t) => t.id === activeTicketId);
  const openCount = tickets.filter((t) => t.status === "open").length;

  const c = {
    bg: isDark ? "#0A0E17" : "#FFFFFF",
    cardBg: isDark ? "#131B2E" : "#F8FAFC",
    border: isDark ? "#1E293B" : "#E2E8F0",
    text: isDark ? "#F8FAFB" : "#0F172A",
    subtext: isDark ? "#94A3B8" : "#64748B",
    primary: "#3B82F6",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        justifyContent: "flex-end",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          height: "100%",
          backgroundColor: c.bg,
          borderLeft: `1px solid ${c.border}`,
          display: "flex",
          flexDirection: "column",
          boxShadow: "-8px 0 28px rgba(0, 0, 0, 0.4)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${c.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {(activeView !== "menu" || activeTicketId) && (
              <button
                onClick={() => {
                  if (activeTicketId) setActiveTicketId(null);
                  else setActiveView("menu");
                }}
                style={{ background: "none", border: "none", color: c.text, cursor: "pointer", fontSize: "16px", fontWeight: "900" }}
              >
                ←
              </button>
            )}
            <span style={{ fontSize: "16px", fontWeight: "900", color: c.text }}>
              {activeTicketId
                ? `Chat: ${selectedTicket?.id}`
                : activeView === "menu"
                ? (isAdmin ? "Admin Controls" : "My Account")
                : activeView === "profile"
                ? "Edit Profile"
                : activeView === "orders"
                ? (isAdmin ? "Orders Placed" : "My Orders")
                : activeView === "complaints"
                ? "User Complaints & Tickets"
                : activeView === "support"
                ? "Customer Support"
                : activeView === "wishlist"
                ? "My Wishlist"
                : "Live Alerts"}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: "18px", color: c.text, cursor: "pointer" }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "18px", display: "flex", flexDirection: "column" }}>
          
          {/* MENU VIEW */}
          {activeView === "menu" && !activeTicketId && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {isAdmin ? (
                <>
                  <button
                    onClick={() => setActiveView("profile")}
                    style={{ padding: "14px", borderRadius: "10px", backgroundColor: c.cardBg, border: `1px solid ${c.border}`, color: c.text, textAlign: "left", fontSize: "14px", fontWeight: "800", cursor: "pointer", display: "flex", justifyContent: "space-between" }}
                  >
                    <span>👤 Edit Profile</span>
                    <span style={{ color: c.subtext }}>→</span>
                  </button>

                  <button
                    onClick={() => setActiveView("inbox")}
                    style={{ padding: "14px", borderRadius: "10px", backgroundColor: c.cardBg, border: `1px solid ${c.border}`, color: c.text, textAlign: "left", fontSize: "14px", fontWeight: "800", cursor: "pointer", display: "flex", justifyContent: "space-between" }}
                  >
                    <span>⚡ Inbox (WebSocket Notifications)</span>
                    <span style={{ color: "#10B981", fontWeight: "900" }}>Live</span>
                  </button>

                  <button
                    onClick={() => setActiveView("orders")}
                    style={{ padding: "14px", borderRadius: "10px", backgroundColor: c.cardBg, border: `1px solid ${c.border}`, color: c.text, textAlign: "left", fontSize: "14px", fontWeight: "800", cursor: "pointer", display: "flex", justifyContent: "space-between" }}
                  >
                    <span>📦 Orders Placed</span>
                    <span style={{ color: c.subtext }}>({orders.length}) →</span>
                  </button>

                  <button
                    onClick={() => setActiveView("complaints")}
                    style={{ padding: "14px", borderRadius: "10px", backgroundColor: c.cardBg, border: `1px solid ${c.border}`, color: c.text, textAlign: "left", fontSize: "14px", fontWeight: "800", cursor: "pointer", display: "flex", justifyContent: "space-between" }}
                  >
                    <span>📢 User Complaints</span>
                    <span style={{ color: openCount > 0 ? "#EF4444" : "#10B981", fontWeight: "900" }}>
                      {openCount > 0 ? `${openCount} Open` : "All Solved"} →
                    </span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setActiveView("profile")}
                    style={{ padding: "14px", borderRadius: "10px", backgroundColor: c.cardBg, border: `1px solid ${c.border}`, color: c.text, textAlign: "left", fontSize: "14px", fontWeight: "800", cursor: "pointer", display: "flex", justifyContent: "space-between" }}
                  >
                    <span>👤 Edit Profile</span>
                    <span style={{ color: c.subtext }}>→</span>
                  </button>

                  <button
                    onClick={() => setActiveView("inbox")}
                    style={{ padding: "14px", borderRadius: "10px", backgroundColor: c.cardBg, border: `1px solid ${c.border}`, color: c.text, textAlign: "left", fontSize: "14px", fontWeight: "800", cursor: "pointer", display: "flex", justifyContent: "space-between" }}
                  >
                    <span>🔔 Inbox</span>
                    <span style={{ color: c.subtext }}>→</span>
                  </button>

                  <button
                    onClick={() => setActiveView("orders")}
                    style={{ padding: "14px", borderRadius: "10px", backgroundColor: c.cardBg, border: `1px solid ${c.border}`, color: c.text, textAlign: "left", fontSize: "14px", fontWeight: "800", cursor: "pointer", display: "flex", justifyContent: "space-between" }}
                  >
                    <span>📦 My Orders</span>
                    <span style={{ color: c.subtext }}>({orders.length}) →</span>
                  </button>

                  <button
                    onClick={() => setActiveView("support")}
                    style={{ padding: "14px", borderRadius: "10px", backgroundColor: c.cardBg, border: `1px solid ${c.border}`, color: c.text, textAlign: "left", fontSize: "14px", fontWeight: "800", cursor: "pointer", display: "flex", justifyContent: "space-between" }}
                  >
                    <span>🎧 Customer Support & Live Tickets</span>
                    <span style={{ color: "#3B82F6", fontWeight: "900" }}>Chat →</span>
                  </button>

                  <button
                    onClick={() => setActiveView("wishlist")}
                    style={{ padding: "14px", borderRadius: "10px", backgroundColor: c.cardBg, border: `1px solid ${c.border}`, color: c.text, textAlign: "left", fontSize: "14px", fontWeight: "800", cursor: "pointer", display: "flex", justifyContent: "space-between" }}
                  >
                    <span>❤️ Wishlist</span>
                    <span style={{ color: c.subtext }}>({wishlist.length}) →</span>
                  </button>
                </>
              )}

              <button
                onClick={handleSignOut}
                style={{
                  marginTop: "20px",
                  padding: "14px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(239, 68, 68, 0.12)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#EF4444",
                  fontSize: "14px",
                  fontWeight: "800",
                  cursor: "pointer",
                }}
              >
                🚪 Sign Out
              </button>
            </div>
          )}

          {/* ACTIVE CHAT THREAD (ACCESSED BY BOTH ADMIN & USER) */}
          {activeTicketId && selectedTicket && (
            <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
              <div>
                {/* Ticket Banner */}
                <div style={{ backgroundColor: c.cardBg, border: `1px solid ${c.border}`, borderRadius: "10px", padding: "12px", marginBottom: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", fontWeight: "900", color: "#F59E0B" }}>{selectedTicket.id}</span>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: "4px",
                        fontSize: "10px",
                        fontWeight: "800",
                        backgroundColor: selectedTicket.status === "open" ? "rgba(16, 185, 129, 0.2)" : "rgba(148, 163, 184, 0.2)",
                        color: selectedTicket.status === "open" ? "#10B981" : "#94A3B8"
                      }}
                    >
                      {selectedTicket.status.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontWeight: "800", color: c.text, fontSize: "13px", marginTop: "4px" }}>
                    {selectedTicket.subject}
                  </div>
                  <div style={{ fontSize: "11px", color: c.subtext, marginTop: "2px" }}>
                    User: {selectedTicket.user} • {selectedTicket.created}
                  </div>
                </div>

                {/* Message Log */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "14px" }}>
                  {selectedTicket.messages.map((m, idx) => {
                    const isSystem = m.sender === "system";
                    const isMe = isAdmin ? m.sender === "admin" : m.sender === "user";

                    if (isSystem) {
                      return (
                        <div key={idx} style={{ textAlign: "center", fontSize: "11px", color: "#10B981", fontWeight: "700", padding: "6px" }}>
                          {m.text}
                        </div>
                      );
                    }

                    return (
                      <div
                        key={idx}
                        style={{
                          alignSelf: isMe ? "flex-end" : "flex-start",
                          maxWidth: "80%",
                          padding: "10px 12px",
                          borderRadius: "10px",
                          backgroundColor: isMe ? "#3B82F6" : c.cardBg,
                          border: isMe ? "none" : `1px solid ${c.border}`,
                          color: isMe ? "#FFF" : c.text,
                        }}
                      >
                        <div style={{ fontSize: "10px", opacity: 0.8, marginBottom: "2px" }}>
                          {m.sender === "admin" ? "Admin Support" : selectedTicket.user} • {m.time}
                        </div>
                        <div style={{ fontSize: "13px", lineHeight: 1.4 }}>{m.text}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chat Actions */}
              <div>
                {selectedTicket.status === "open" ? (
                  <>
                    <form onSubmit={handleSendMessage} style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                      <input
                        type="text"
                        placeholder="Type reply..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        style={{ flex: 1, padding: "10px", borderRadius: "8px", border: `1px solid ${c.border}`, background: c.cardBg, color: c.text, outline: "none", fontSize: "13px" }}
                      />
                      <button
                        type="submit"
                        style={{ backgroundColor: "#3B82F6", color: "#FFF", border: "none", padding: "10px 16px", borderRadius: "8px", fontWeight: "800", cursor: "pointer" }}
                      >
                        Send
                      </button>
                    </form>

                    {/* Customer-side Close Button */}
                    {!isAdmin && (
                      <button
                        onClick={() => handleCloseTicket(selectedTicket.id)}
                        style={{
                          width: "100%",
                          backgroundColor: "rgba(16, 185, 129, 0.15)",
                          border: "1px solid #10B981",
                          color: "#10B981",
                          padding: "10px",
                          borderRadius: "8px",
                          fontWeight: "800",
                          fontSize: "12px",
                          cursor: "pointer",
                        }}
                      >
                        ✅ Problem Solved — Close Ticket
                      </button>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: "center", padding: "10px", color: c.subtext, fontSize: "12px", fontWeight: "700" }}>
                    🔒 This ticket is resolved and closed.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ADMIN: COMPLAINTS / TICKETS LIST */}
          {activeView === "complaints" && !activeTicketId && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ fontSize: "12px", fontWeight: "800", color: c.subtext, marginBottom: "4px" }}>
                CUSTOMER TICKETS & ISSUES ({tickets.length}):
              </div>

              {tickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setActiveTicketId(t.id)}
                  style={{
                    padding: "14px",
                    borderRadius: "10px",
                    backgroundColor: c.cardBg,
                    border: `1px solid ${c.border}`,
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontSize: "11px", fontWeight: "800", color: t.status === "open" ? "#EF4444" : "#10B981" }}>
                      {t.status === "open" ? "🔴 ACTION REQUIRED" : "🟢 RESOLVED"}
                    </span>
                    <span style={{ fontSize: "11px", color: c.subtext }}>{t.created}</span>
                  </div>
                  <div style={{ fontWeight: "800", color: c.text, fontSize: "14px" }}>{t.subject}</div>
                  <div style={{ fontSize: "12px", color: c.subtext, marginTop: "2px" }}>
                    From: {t.user} • {t.messages.length} messages
                  </div>
                  <div style={{ marginTop: "10px", color: "#3B82F6", fontSize: "12px", fontWeight: "800" }}>
                    Open Live Chat →
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* USER: CUSTOMER SUPPORT (TICKETS LIST + RAISE FORM) */}
          {activeView === "support" && !activeTicketId && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Raise New Ticket Form */}
              <form onSubmit={handleCreateTicket} style={{ backgroundColor: c.cardBg, border: `1px solid ${c.border}`, borderRadius: "10px", padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ fontSize: "13px", fontWeight: "900", color: c.text }}>Raise Support Ticket</div>
                <input
                  type="text"
                  required
                  placeholder="Subject (e.g. Delivery Delay / Payment Query)"
                  value={newTicketSubject}
                  onChange={(e) => setNewTicketSubject(e.target.value)}
                  style={{ padding: "10px", borderRadius: "8px", border: `1px solid ${c.border}`, background: c.bg, color: c.text, fontSize: "13px" }}
                />
                <textarea
                  rows="3"
                  required
                  placeholder="Describe your issue in detail..."
                  value={newTicketMsg}
                  onChange={(e) => setNewTicketMsg(e.target.value)}
                  style={{ padding: "10px", borderRadius: "8px", border: `1px solid ${c.border}`, background: c.bg, color: c.text, fontSize: "13px" }}
                />
                <button
                  type="submit"
                  style={{ backgroundColor: "#F59E0B", color: "#000", border: "none", padding: "10px", borderRadius: "8px", fontWeight: "900", cursor: "pointer", fontSize: "13px" }}
                >
                  🚀 Submit Ticket & Start Chat
                </button>
              </form>

              {/* Existing User Tickets */}
              <div>
                <div style={{ fontSize: "12px", fontWeight: "800", color: c.subtext, marginBottom: "8px" }}>YOUR ACTIVE TICKETS:</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {tickets.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setActiveTicketId(t.id)}
                      style={{
                        padding: "12px",
                        borderRadius: "10px",
                        backgroundColor: c.cardBg,
                        border: `1px solid ${c.border}`,
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: "800", color: c.text, fontSize: "13px" }}>{t.subject}</span>
                        <span style={{ fontSize: "10px", fontWeight: "800", color: t.status === "open" ? "#10B981" : c.subtext }}>
                          {t.status.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ fontSize: "11px", color: c.subtext, marginTop: "4px" }}>
                        {t.id} • Click to continue chat →
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* EDIT PROFILE */}
          {activeView === "profile" && !activeTicketId && (
            <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "800", color: c.subtext, display: "block", marginBottom: "6px" }}>Display Name</label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${c.border}`, background: c.cardBg, color: c.text, boxSizing: "border-box" }}
                />
              </div>
              <button
                type="submit"
                style={{ backgroundColor: "#3B82F6", color: "#FFF", border: "none", padding: "12px", borderRadius: "8px", fontWeight: "900", cursor: "pointer" }}
              >
                Save Changes
              </button>
            </form>
          )}

          {/* ORDERS VIEW */}
          {activeView === "orders" && !activeTicketId && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {orders.length === 0 ? (
                <div style={{ textAlign: "center", color: c.subtext, padding: "40px 0" }}>No orders recorded yet.</div>
              ) : (
                orders.map((ord, idx) => (
                  <div key={idx} style={{ padding: "14px", borderRadius: "10px", backgroundColor: c.cardBg, border: `1px solid ${c.border}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <span style={{ fontWeight: "900", color: "#F59E0B", fontSize: "13px" }}>#{ord.orderId}</span>
                      <span style={{ fontSize: "11px", color: c.subtext }}>{ord.timestamp}</span>
                    </div>

                    {isAdmin && (
                      <div style={{ marginBottom: "8px" }}>
                        <div style={{ fontSize: "13px", fontWeight: "800", color: c.text }}>👤 {ord.address?.name || "Customer"}</div>
                        <div style={{ fontSize: "12px", color: c.subtext }}>📞 {ord.address?.phone || "No phone"}</div>
                        <div style={{ fontSize: "12px", color: c.subtext }}>📍 {ord.address?.street}, {ord.address?.city} ({ord.address?.pincode})</div>
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${c.border}`, paddingTop: "6px" }}>
                      <span style={{ fontSize: "12px", color: c.subtext }}>Status: {ord.status || "Processing"}</span>
                      <span style={{ fontSize: "14px", fontWeight: "900", color: "#10B981" }}>${ord.total}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* INBOX VIEW */}
          {activeView === "inbox" && !activeTicketId && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ padding: "12px", borderRadius: "8px", backgroundColor: c.cardBg, border: `1px solid ${c.border}` }}>
                <div style={{ fontSize: "11px", fontWeight: "800", color: "#10B981" }}>CONNECTED TO WS://8000/WS/ALERTS</div>
                <div style={{ fontSize: "13px", fontWeight: "800", color: c.text, marginTop: "4px" }}>
                  {isAdmin ? "Automated Dispatch Channel Active" : "Order tracking & stock alerts subscribed."}
                </div>
              </div>
            </div>
          )}

          {/* WISHLIST VIEW */}
          {activeView === "wishlist" && !activeTicketId && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {wishlist.map((item) => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", borderRadius: "8px", backgroundColor: c.cardBg, border: `1px solid ${c.border}` }}>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "800", color: c.text }}>{item.name}</div>
                    <div style={{ fontSize: "14px", fontWeight: "900", color: "#10B981" }}>${item.price}</div>
                  </div>
                  <button
                    onClick={() => setWishlist(wishlist.filter((w) => w.id !== item.id))}
                    style={{ background: "none", border: "none", color: "#EF4444", fontSize: "12px", fontWeight: "800", cursor: "pointer" }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
