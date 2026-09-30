import React, { useState, useEffect } from "react";
import { useStore } from "../context/StoreContext";
import { useNavigate } from "react-router-dom";
import OrderTrackerModal from "./OrderTrackerModal";

export default function RightMenuDrawer({ isOpen, onClose, initialTab = "profile" }) {
  const {
    theme,
    toggleTheme,
    user,
    login,
    logout,
    orders,
    updateOrderStatus,
    adminNotifications,
    userNotifications,
    markAdminNotificationsRead,
    markUserNotificationsRead,
    tickets,
    addTicket,
    resolveTicket
  } = useStore();

  const [activeTab, setActiveTab] = useState(initialTab);
  const isDark = theme === "dark";
  const navigate = useNavigate();

  let activeUser = user;
  if (!activeUser) {
    try {
      activeUser = JSON.parse(localStorage.getItem("rmart_user") || "null");
    } catch {}
  }

  const userEmail = (activeUser?.email || "").toLowerCase();
  const isAdmin = Boolean(
    activeUser?.is_admin === true ||
    activeUser?.is_admin === "true" ||
    activeUser?.is_admin === 1 ||
    userEmail.includes("admin") ||
    userEmail.includes("humza")
  );

  const [trackingOrder, setTrackingOrder] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(activeUser?.name || "");
  const [email, setEmail] = useState(activeUser?.email || "");
  const [phone, setPhone] = useState(activeUser?.phone || "+91 98765 43210");
  const [address, setAddress] = useState(activeUser?.address || "Flat 402, Guntur Main Road, Andhra Pradesh");
  const [msgSaved, setMsgSaved] = useState(false);

  const [tckSubject, setTckSubject] = useState("");
  const [tckMsg, setTckMsg] = useState("");
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [adminReplies, setAdminReplies] = useState({});

  useEffect(() => {
    if (activeUser) {
      setName(activeUser.name);
      setEmail(activeUser.email);
      setPhone(activeUser.phone || "+91 98765 43210");
      setAddress(activeUser.address || "Flat 402, Guntur Main Road, Andhra Pradesh");
    }
  }, [activeUser]);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  const c = {
    panelBg: isDark ? "#0D111A" : "#FFFFFF",
    cardBg: isDark ? "#07090F" : "#F8FAFC",
    border: isDark ? "#1E2738" : "#E2E8F0",
    text: isDark ? "#F8FAFC" : "#0F172A",
    subtext: isDark ? "#94A3B8" : "#64748B",
    accent: "#F59E0B",
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    login({ ...activeUser, name, email, phone, address });
    setIsEditing(false);
    setMsgSaved(true);
    setTimeout(() => setMsgSaved(false), 2000);
  };

  const handleSupportSubmit = (e) => {
    e.preventDefault();
    if (!tckSubject || !tckMsg) return;
    addTicket(tckSubject, tckMsg);
    setTckSubject("");
    setTckMsg("");
    setTicketSubmitted(true);
    setTimeout(() => setTicketSubmitted(false), 3000);
  };

  const handleAdminResolve = (ticketId) => {
    const reply = adminReplies[ticketId] || "Your issue has been investigated and resolved by Admin.";
    resolveTicket(ticketId, reply);
    setAdminReplies((prev) => ({ ...prev, [ticketId]: "" }));
  };

  // Split notification list based on role
  const notificationsList = isAdmin ? adminNotifications : userNotifications;
  const unreadCount = notificationsList.filter((n) => n.unread).length;

  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", justifyContent: "flex-end" }}>
        <div onClick={onClose} style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(2px)" }} />

        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "480px",
            height: "100%",
            backgroundColor: c.panelBg,
            borderLeft: `1px solid ${c.border}`,
            boxShadow: "-10px 0 50px rgba(0,0,0,0.8)",
            display: "flex",
            flexDirection: "column",
            padding: "24px",
            boxSizing: "border-box",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "900", color: c.text }}>
                {activeUser?.name || "Account"}
              </h2>
              <span style={{ fontSize: "11px", color: c.subtext }}>
                {activeUser?.email} {isAdmin && "• (Admin Command)"}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                onClick={toggleTheme}
                style={{
                  backgroundColor: isDark ? "#161F30" : "#E2E8F0",
                  color: c.text,
                  border: `1px solid ${c.border}`,
                  padding: "6px 10px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                {isDark ? "Light Mode" : "Dark Mode"}
              </button>
              <button
                onClick={onClose}
                style={{
                  background: "none",
                  border: `1px solid ${c.border}`,
                  borderRadius: "6px",
                  color: c.text,
                  padding: "4px 8px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "18px" }}>
            {[
              { id: "profile", label: "Profile" },
              { id: "inbox", label: `🔔 Inbox ${unreadCount > 0 ? `(${unreadCount})` : ""}` },
              { id: "orders", label: `Orders (${orders.length})` },
              { id: "support", label: isAdmin ? `Resolve Complaints (${tickets.length})` : "Complaints" },
              ...(isAdmin ? [{ id: "admin", label: "Admin Deck" }] : []),
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setActiveTab(t.id);
                  if (t.id === "inbox") {
                    if (isAdmin) markAdminNotificationsRead();
                    else markUserNotificationsRead();
                  }
                }}
                style={{
                  flex: "1 1 auto",
                  backgroundColor: activeTab === t.id ? c.accent : (isDark ? "#161F30" : "#E2E8F0"),
                  color: activeTab === t.id ? "#000" : c.text,
                  fontWeight: "800",
                  fontSize: "11px",
                  padding: "8px 8px",
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

          {/* Tab Contents */}
          <div style={{ flex: 1, overflowY: "auto", paddingRight: "4px" }}>
            {/* TAB 1: PROFILE */}
            {activeTab === "profile" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "800", color: c.subtext }}>ACCOUNT INFORMATION</span>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      style={{
                        backgroundColor: c.accent,
                        color: "#000",
                        border: "none",
                        padding: "5px 12px",
                        borderRadius: "6px",
                        fontWeight: "900",
                        fontSize: "11px",
                        cursor: "pointer",
                      }}
                    >
                      ✏ Edit Profile
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditing(false)}
                      style={{
                        backgroundColor: "transparent",
                        color: c.subtext,
                        border: `1px solid ${c.border}`,
                        padding: "4px 10px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>

                {!isEditing ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ backgroundColor: c.cardBg, border: `1px solid ${c.border}`, borderRadius: "10px", padding: "14px" }}>
                      <span style={{ fontSize: "10px", fontWeight: "800", color: c.subtext, textTransform: "uppercase" }}>Full Name</span>
                      <div style={{ fontSize: "15px", fontWeight: "bold", color: c.text, marginTop: "2px" }}>{activeUser?.name || "Not Set"}</div>
                    </div>

                    <div style={{ backgroundColor: c.cardBg, border: `1px solid ${c.border}`, borderRadius: "10px", padding: "14px" }}>
                      <span style={{ fontSize: "10px", fontWeight: "800", color: c.subtext, textTransform: "uppercase" }}>Email Address</span>
                      <div style={{ fontSize: "15px", fontWeight: "bold", color: c.text, marginTop: "2px" }}>{activeUser?.email || "Not Set"}</div>
                    </div>

                    <div style={{ backgroundColor: c.cardBg, border: `1px solid ${c.border}`, borderRadius: "10px", padding: "14px" }}>
                      <span style={{ fontSize: "10px", fontWeight: "800", color: c.subtext, textTransform: "uppercase" }}>Phone Number</span>
                      <div style={{ fontSize: "15px", fontWeight: "bold", color: c.text, marginTop: "2px" }}>{activeUser?.phone || "+91 98765 43210"}</div>
                    </div>

                    <div style={{ backgroundColor: c.cardBg, border: `1px solid ${c.border}`, borderRadius: "10px", padding: "14px" }}>
                      <span style={{ fontSize: "10px", fontWeight: "800", color: c.subtext, textTransform: "uppercase" }}>Primary Shipping Destination</span>
                      <div style={{ fontSize: "13px", color: c.text, marginTop: "4px", lineHeight: "1.4" }}>
                        {activeUser?.address || "Flat 402, Guntur Main Road, Andhra Pradesh"}
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div>
                      <label style={{ fontSize: "11px", fontWeight: "800", color: c.subtext }}>FULL NAME</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${c.border}`, backgroundColor: c.cardBg, color: c.text, marginTop: "4px", boxSizing: "border-box" }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "11px", fontWeight: "800", color: c.subtext }}>EMAIL ADDRESS</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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
                      <label style={{ fontSize: "11px", fontWeight: "800", color: c.subtext }}>SHIPPING DESTINATION</label>
                      <textarea
                        rows="3"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${c.border}`, backgroundColor: c.cardBg, color: c.text, marginTop: "4px", boxSizing: "border-box" }}
                      />
                    </div>

                    <button
                      type="submit"
                      style={{ backgroundColor: c.accent, color: "#000", fontWeight: "900", padding: "12px", borderRadius: "8px", border: "none", cursor: "pointer", marginTop: "6px" }}
                    >
                      Save Changes
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* TAB 2: ROLE-SPECIFIC NOTIFICATIONS INBOX */}
            {activeTab === "inbox" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "900", color: c.subtext, textTransform: "uppercase" }}>
                    {isAdmin ? "⚡ Admin Real-Time Operations Feed" : "💬 Shopper Activity & Live Updates"}
                  </span>
                  <span style={{ fontSize: "11px", color: c.accent, fontWeight: "bold" }}>
                    {notificationsList.length} updates
                  </span>
                </div>

                {notificationsList.length === 0 ? (
                  <div style={{ textAlign: "center", color: c.subtext, padding: "30px 0" }}>No messages in inbox.</div>
                ) : (
                  notificationsList.map((n) => (
                    <div key={n.id} style={{
                      backgroundColor: c.cardBg,
                      border: `1px solid ${n.unread ? c.accent : c.border}`,
                      borderRadius: "10px",
                      padding: "12px",
                      position: "relative",
                      boxShadow: n.unread ? "0 0 10px rgba(245, 158, 11, 0.2)" : "none",
                    }}>
                      {n.unread && (
                        <span style={{ position: "absolute", top: "10px", right: "10px", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: c.accent }} />
                      )}
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", paddingRight: "16px" }}>
                        <b style={{ color: c.text, fontSize: "13px" }}>{n.title}</b>
                        <span style={{ fontSize: "10px", color: c.subtext }}>{n.timestamp}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: "12px", color: c.subtext, lineHeight: "1.4" }}>{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 3: ORDERS */}
            {activeTab === "orders" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {orders.length === 0 ? (
                  <div style={{ textAlign: "center", color: c.subtext, padding: "30px 0" }}>No orders placed yet.</div>
                ) : (
                  orders.map((ord) => (
                    <div key={ord.id} style={{ backgroundColor: c.cardBg, border: `1px solid ${c.border}`, borderRadius: "10px", padding: "14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                        <span style={{ fontWeight: "900", color: c.accent }}>Order #{ord.id}</span>
                        <span style={{
                          backgroundColor: ord.status.includes("Dispatched") || ord.status.includes("Shipped") ? "#10B981" : ord.status === "Cancelled" ? "#EF4444" : "#F59E0B",
                          color: "#000",
                          fontWeight: "900",
                          fontSize: "10px",
                          padding: "3px 8px",
                          borderRadius: "12px",
                        }}>
                          {ord.status}
                        </span>
                      </div>

                      <div style={{ backgroundColor: isDark ? "#0A0E17" : "#FFFFFF", border: `1px solid ${c.border}`, borderRadius: "6px", padding: "6px 8px", fontSize: "11px", margin: "6px 0", display: "flex", justifyContent: "space-between" }}>
                        <span>Payment: <b>{ord.payment?.method || "UPI"}</b> ({ord.payment?.status || "Paid"})</span>
                        <span style={{ color: "#10B981", fontWeight: "bold" }}>{ord.payment?.transactionId || "TXN-VERIFIED"}</span>
                      </div>

                      <div style={{ fontSize: "12px", color: c.text, margin: "6px 0" }}>
                        {ord.items.map((it, i) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                            <span>{it.quantity || 1}x {it.name || it.title}</span>
                            <span style={{ fontWeight: "bold" }}>${(Number(it.price) * (it.quantity || 1)).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      <div style={{ fontSize: "10px", color: c.subtext, marginTop: "4px" }}>
                        Celery Task: <code style={{ color: "#10B981" }}>{ord.celery_task_id}</code>
                      </div>

                      <div style={{ borderTop: `1px solid ${c.border}`, paddingTop: "10px", marginTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                        <button
                          onClick={() => setTrackingOrder(ord)}
                          style={{
                            flex: 1,
                            backgroundColor: c.accent,
                            color: "#000",
                            fontWeight: "900",
                            border: "none",
                            padding: "8px 12px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "4px",
                          }}
                        >
                          <span>📍</span>
                          <span>Track Order Live</span>
                        </button>

                        {ord.status !== "Cancelled" && (
                          <button
                            onClick={() => updateOrderStatus(ord.id, "Cancelled")}
                            style={{ backgroundColor: "transparent", border: "1px solid #EF4444", color: "#EF4444", padding: "7px 10px", borderRadius: "6px", fontSize: "11px", cursor: "pointer" }}
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

            {/* TAB 4: COMPLAINTS */}
            {activeTab === "support" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {isAdmin ? (
                  <div>
                    <h4 style={{ margin: "0 0 10px 0", color: c.text, fontSize: "14px" }}>
                      Customer Complaints Queue (Admin Desk)
                    </h4>
                    {tickets.length === 0 ? (
                      <div style={{ textAlign: "center", color: c.subtext, padding: "20px 0" }}>No complaints registered.</div>
                    ) : (
                      tickets.map((t) => (
                        <div key={t.id} style={{ backgroundColor: c.cardBg, border: `1px solid ${c.border}`, borderRadius: "10px", padding: "14px", marginBottom: "10px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                            <b style={{ color: c.text, fontSize: "13px" }}>{t.subject}</b>
                            <span style={{
                              backgroundColor: t.status === "Resolved" ? "#10B981" : c.accent,
                              color: "#000",
                              fontWeight: "900",
                              fontSize: "10px",
                              padding: "2px 6px",
                              borderRadius: "6px"
                            }}>
                              {t.status}
                            </span>
                          </div>
                          <div style={{ fontSize: "11px", color: c.accent, marginBottom: "4px" }}>From: {t.user}</div>
                          <p style={{ margin: "0 0 8px 0", fontSize: "12px", color: c.subtext }}>{t.message}</p>

                          {t.status !== "Resolved" ? (
                            <div style={{ borderTop: `1px solid ${c.border}`, paddingTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                              <input
                                type="text"
                                placeholder="Write reply/resolution to user..."
                                value={adminReplies[t.id] || ""}
                                onChange={(e) => setAdminReplies({ ...adminReplies, [t.id]: e.target.value })}
                                style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: `1px solid ${c.border}`, backgroundColor: isDark ? "#0A0D15" : "#FFF", color: c.text, fontSize: "11px", boxSizing: "border-box" }}
                              />
                              <button
                                onClick={() => handleAdminResolve(t.id)}
                                style={{
                                  alignSelf: "flex-end",
                                  backgroundColor: c.accent,
                                  color: "#000",
                                  fontWeight: "900",
                                  border: "none",
                                  padding: "6px 12px",
                                  borderRadius: "6px",
                                  fontSize: "11px",
                                  cursor: "pointer",
                                }}
                              >
                                Resolve & Notify Customer
                              </button>
                            </div>
                          ) : (
                            <div style={{ fontSize: "11px", color: "#10B981", fontWeight: "bold" }}>
                              ✓ Resolved • Reply sent: {t.reply}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div>
                    {ticketSubmitted && (
                      <div style={{ padding: "8px 12px", backgroundColor: "#10B98125", color: "#10B981", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", marginBottom: "10px" }}>
                        Complaint registered! Admin support notified.
                      </div>
                    )}

                    <form onSubmit={handleSupportSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "14px" }}>
                      <input
                        type="text"
                        required
                        placeholder="Subject (e.g. Delivery delay, broken item)"
                        value={tckSubject}
                        onChange={(e) => setTckSubject(e.target.value)}
                        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${c.border}`, backgroundColor: c.cardBg, color: c.text, boxSizing: "border-box" }}
                      />
                      <textarea
                        required
                        rows="3"
                        placeholder="Detail your complaint for the admin desk..."
                        value={tckMsg}
                        onChange={(e) => setTckMsg(e.target.value)}
                        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${c.border}`, backgroundColor: c.cardBg, color: c.text, boxSizing: "border-box" }}
                      />
                      <button
                        type="submit"
                        style={{ backgroundColor: c.accent, color: "#000", fontWeight: "900", padding: "10px", borderRadius: "8px", border: "none", cursor: "pointer" }}
                      >
                        Submit Complaint Ticket
                      </button>
                    </form>

                    <div style={{ borderTop: `1px solid ${c.border}`, paddingTop: "12px" }}>
                      <span style={{ fontSize: "12px", fontWeight: "800", color: c.subtext }}>My Complaint History:</span>
                      {tickets.filter(t => t.user === activeUser?.email).map((t) => (
                        <div key={t.id} style={{ backgroundColor: c.cardBg, padding: "10px", borderRadius: "8px", marginTop: "8px", border: `1px solid ${c.border}` }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                            <span style={{ fontWeight: "bold", color: c.text }}>{t.subject}</span>
                            <span style={{ color: t.status === "Resolved" ? "#10B981" : c.accent, fontWeight: "bold" }}>{t.status}</span>
                          </div>
                          <p style={{ margin: "4px 0 0", fontSize: "11px", color: c.subtext }}>{t.message}</p>
                          {t.reply && (
                            <div style={{ marginTop: "4px", fontSize: "11px", color: "#10B981" }}>
                              ↳ Admin Reply: {t.reply}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: ADMIN SHORTCUT */}
            {activeTab === "admin" && (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <p style={{ color: c.text, fontSize: "14px", margin: "0 0 14px 0" }}>
                  Full access to catalog publishing, stock updating, and Celery dispatch.
                </p>
                <button
                  onClick={() => { onClose(); navigate("/admin"); }}
                  style={{ backgroundColor: c.accent, color: "#000", fontWeight: "900", padding: "12px 20px", borderRadius: "8px", border: "none", cursor: "pointer" }}
                >
                  Go to Admin Command Deck
                </button>
              </div>
            )}
          </div>

          {/* Footer Logout */}
          <div style={{ borderTop: `1px solid ${c.border}`, paddingTop: "14px", marginTop: "14px" }}>
            {activeUser ? (
              <button
                onClick={() => { logout(); onClose(); navigate("/auth"); }}
                style={{ width: "100%", padding: "12px", backgroundColor: "#EF444420", border: "1px solid #EF4444", color: "#EF4444", fontWeight: "900", borderRadius: "8px", cursor: "pointer" }}
              >
                Sign Out of R-Mart
              </button>
            ) : (
              <button
                onClick={() => { onClose(); navigate("/auth"); }}
                style={{ width: "100%", padding: "12px", backgroundColor: c.accent, color: "#000", fontWeight: "900", borderRadius: "8px", border: "none", cursor: "pointer" }}
              >
                Sign In / Register
              </button>
            )}
          </div>
        </div>
      </div>

      <OrderTrackerModal
        order={trackingOrder}
        isOpen={!!trackingOrder}
        onClose={() => setTrackingOrder(null)}
        theme={theme}
      />
    </>
  );
}
