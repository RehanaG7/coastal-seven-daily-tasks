import React, { useState, useEffect, useRef } from "react";
import { useAuthStore, useUIStore, useCartStore } from "../store/useStore";
import { queryClient } from "../lib/queryClient";
import { useNavigate, useLocation } from "react-router-dom";

export default function RightMenuDrawer({ isOpen, onClose }) {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);

  const theme = useUIStore((s) => s.theme);
  const isRightMenuOpen = useUIStore((s) => s.isRightMenuOpen);
  const closeRightMenu = useUIStore((s) => s.closeRightMenu);
  const openTracker = useUIStore((s) => s.openTracker);

  const newsBannerText = useUIStore((s) => s.newsBannerText);
  const setNewsBannerText = useUIStore((s) => s.setNewsBannerText);

  const storeWishlist = useCartStore((s) => s.wishlist);
  const toggleWishlist = useCartStore((s) => s.toggleWishlist);
  const offers = useCartStore((s) => s.offers);
  const addOffer = useCartStore((s) => s.addOffer);
  const removeOffer = useCartStore((s) => s.removeOffer);

  const navigate = useNavigate();
  const location = useLocation();

  const effectiveIsOpen = isOpen !== undefined ? isOpen : isRightMenuOpen;
  const handleClose = onClose || closeRightMenu;

  const isAdmin =
    user?.role === "admin" ||
    localStorage.getItem("user_role") === "admin" ||
    location.pathname.startsWith("/admin");

  // Navigation views inside drawer
  const [activeView, setActiveView] = useState("menu");
  // Views:
  // User: "menu" | "profile" | "orders" | "inbox" | "support" | "wishlist"
  // Admin: "menu" | "profile" | "news" | "add_product" | "offers" | "customer_orders" | "queries"

  const [profileName, setProfileName] = useState(
    user?.name || (isAdmin ? "Admin" : "Customer")
  );
  const [orders, setOrders] = useState([]);

  // News banner edit state
  const [newsInput, setNewsInput] = useState(newsBannerText);

  // Support Tickets / Complaints State
  const [tickets, setTickets] = useState([]);
  const [activeTicketId, setActiveTicketId] = useState(null);
  const [newTicketSubject, setNewTicketSubject] = useState("");
  const [newTicketMsg, setNewTicketMsg] = useState("");
  const [chatInput, setChatInput] = useState("");

  // Add Product Studio State
  const [productForm, setProductForm] = useState({
    name: "",
    category: "Peripherals",
    price: "",
    stock: "15",
    description: "",
  });
  const [imageUploadMethod, setImageUploadMethod] = useState("browse"); // "browse" | "dragdrop" | "url"
  const [previewImage, setPreviewImage] = useState("");
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Add Offers State
  const [offerCode, setOfferCode] = useState("");
  const [offerDiscount, setOfferDiscount] = useState("");
  const [offerDesc, setOfferDesc] = useState("");

  // Sync state from localStorage
  const reloadData = () => {
    const storedOrders = JSON.parse(
      localStorage.getItem("rmart_admin_orders") || "[]"
    );
    setOrders(storedOrders);

    const storedTickets = JSON.parse(
      localStorage.getItem("rmart_support_tickets") || "[]"
    );
    if (storedTickets.length === 0) {
      const defaultTicket = {
        id: "TCK-1001",
        user: user?.name || "Customer",
        subject: "Delivery Speed & Tracking Inquiry",
        status: "open",
        created: "Today at 10:30 AM",
        messages: [
          {
            sender: "user",
            text: "Hello! Will my order arrive within the 24-48 hour guarantee?",
            time: "10:30 AM",
          },
          {
            sender: "admin",
            text: "Hi! Yes, our express automated fulfillment hub dispatches all orders within 24 hours.",
            time: "10:32 AM",
          },
        ],
      };
      localStorage.setItem(
        "rmart_support_tickets",
        JSON.stringify([defaultTicket])
      );
      setTickets([defaultTicket]);
    } else {
      setTickets(storedTickets);
    }

    setNewsInput(newsBannerText);
  };

  useEffect(() => {
    if (effectiveIsOpen) {
      reloadData();
      setActiveView("menu");
      setActiveTicketId(null);
    }
  }, [effectiveIsOpen]);

  if (!effectiveIsOpen) return null;

  // Sign out handler
  const handleSignOut = () => {
    logout();
    handleClose();
    navigate("/auth");
  };

  // Profile save
  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (setUser) setUser({ ...user, name: profileName });
    alert("Profile saved successfully!");
    setActiveView("menu");
  };

  // Update News Banner
  const handleSaveNewsBanner = (e) => {
    e.preventDefault();
    if (!newsInput.trim()) return;
    setNewsBannerText(newsInput.trim());
    alert("Scrolling News Banner updated successfully!");
    setActiveView("menu");
  };

  // Create Ticket (User Side)
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
        {
          sender: "user",
          text: newTicketMsg,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ],
    };

    const updated = [newTicket, ...tickets];
    localStorage.setItem("rmart_support_tickets", JSON.stringify(updated));
    setTickets(updated);
    setNewTicketSubject("");
    setNewTicketMsg("");
    setActiveTicketId(newTicket.id);
  };

  // Send message in active chat thread
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
              time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            },
          ],
        };
      }
      return t;
    });

    localStorage.setItem("rmart_support_tickets", JSON.stringify(updated));
    setTickets(updated);
    setChatInput("");
  };

  // Resolve Ticket: "if issue solved click resolved both users and admin can close ticket"
  const handleToggleResolveTicket = (ticketId) => {
    const updated = tickets.map((t) => {
      if (t.id === ticketId) {
        const nextStatus = t.status === "resolved" ? "open" : "resolved";
        return {
          ...t,
          status: nextStatus,
          messages: [
            ...t.messages,
            {
              sender: "system",
              text: `Status updated to ${nextStatus.toUpperCase()} by ${
                isAdmin ? "Admin" : user?.name || "Customer"
              }.`,
              time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            },
          ],
        };
      }
      return t;
    });

    localStorage.setItem("rmart_support_tickets", JSON.stringify(updated));
    setTickets(updated);
  };

  // Image Upload Handlers
  const handleFileChosen = (file) => {
    if (!file || !file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChosen(e.dataTransfer.files[0]);
    }
  };

  // Add Product Submission
  const handleAddProductSubmit = (e) => {
    e.preventDefault();
    if (!productForm.name.trim()) {
      alert("Please enter a product name.");
      return;
    }
    if (!productForm.price || isNaN(productForm.price)) {
      alert("Please enter a valid numeric price.");
      return;
    }

    const finalImage =
      previewImage ||
      imageUrlInput.trim() ||
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500";

    const newProd = {
      id: "prod_" + Date.now(),
      name: productForm.name.trim(),
      category: productForm.category,
      price: parseFloat(productForm.price),
      stock: parseInt(productForm.stock) || 10,
      description:
        productForm.description.trim() ||
        "Premium verified product from R-Mart official warehouse.",
      image: finalImage,
    };

    const existing = JSON.parse(
      localStorage.getItem("rmart_custom_products") || "[]"
    );
    const updated = [newProd, ...existing];
    localStorage.setItem("rmart_custom_products", JSON.stringify(updated));

    // Invalidate TanStack query
    queryClient.invalidateQueries({ queryKey: ["products"] });

    alert(`Product "${newProd.name}" uploaded successfully!`);
    setProductForm({
      name: "",
      category: "Peripherals",
      price: "",
      stock: "15",
      description: "",
    });
    setPreviewImage("");
    setImageUrlInput("");
    setActiveView("menu");
  };

  // Add Offer Submission
  const handleAddOfferSubmit = (e) => {
    e.preventDefault();
    if (!offerCode.trim() || !offerDiscount.trim()) return;

    addOffer({
      code: offerCode.trim().toUpperCase(),
      discount: offerDiscount.trim(),
      desc: offerDesc.trim() || "Exclusive R-Mart limited discount code",
    });

    alert(`Offer "${offerCode.toUpperCase()}" added!`);
    setOfferCode("");
    setOfferDiscount("");
    setOfferDesc("");
  };

  const selectedTicket = tickets.find((t) => t.id === activeTicketId);

  // Pure black and dark slate palette
  const c = {
    bg: "#050811",
    cardBg: "#0B0F19",
    border: "#1E293B",
    text: "#FFFFFF",
    subtext: "#94A3B8",
    accent: isAdmin ? "#F59E0B" : "#38BDF8",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        display: "flex",
        justifyContent: "flex-end",
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          height: "100%",
          backgroundColor: c.bg,
          borderLeft: `1px solid ${c.border}`,
          display: "flex",
          flexDirection: "column",
          boxShadow: "-12px 0 40px rgba(0, 0, 0, 0.9)",
          fontFamily: "'Inter', system-ui, sans-serif",
          color: c.text,
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${c.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#000000",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {(activeView !== "menu" || activeTicketId) && (
              <button
                onClick={() => {
                  if (activeTicketId) setActiveTicketId(null);
                  else setActiveView("menu");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: c.text,
                  cursor: "pointer",
                  fontSize: "18px",
                  fontWeight: "900",
                }}
              >
                ←
              </button>
            )}
            <span
              style={{ fontSize: "16px", fontWeight: "900", color: c.text }}
            >
              {activeTicketId
                ? `Live Chat: ${selectedTicket?.id}`
                : activeView === "menu"
                ? isAdmin
                  ? "Admin Studio & Controls"
                  : "User Hub"
                : activeView === "profile"
                ? "Edit Profile"
                : activeView === "news"
                ? "Update Scrolling News Banner"
                : activeView === "add_product"
                ? "Add Product (3-Way Upload)"
                : activeView === "offers"
                ? "Add & Manage Offers"
                : activeView === "customer_orders"
                ? "Customer Orders"
                : activeView === "queries" || activeView === "support"
                ? "Customer Care & Live Chat"
                : activeView === "orders"
                ? "My Orders"
                : activeView === "wishlist"
                ? "My Wishlist"
                : "Live Notifications & Inbox"}
            </span>
          </div>

          <button
            onClick={handleClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "18px",
              color: c.subtext,
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        {/* Drawer Scrollable Body */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* ================================================================ */}
          {/* 1. MENU VIEW: ADMIN SIDE */}
          {/* ================================================================ */}
          {activeView === "menu" && !activeTicketId && isAdmin && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {/* Admin Profile Summary Card */}
              <div
                style={{
                  padding: "16px",
                  borderRadius: "14px",
                  backgroundColor: "rgba(245, 158, 11, 0.08)",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  marginBottom: "6px",
                }}
              >
                <div style={{ fontSize: "36px" }}>🛡️</div>
                <div>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: "900",
                      color: "#F59E0B",
                    }}
                  >
                    {user?.name || "Administrator"}
                  </div>
                  <div style={{ fontSize: "12px", color: c.subtext }}>
                    {user?.email || "admin@rmart.com"}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#10B981",
                      fontWeight: "800",
                      marginTop: "2px",
                    }}
                  >
                    ● Administrator Console Active
                  </div>
                </div>
              </div>

              {/* 1. Edit Profile */}
              <button
                onClick={() => setActiveView("profile")}
                style={drawerButtonStyle(c)}
              >
                <span>✏️ Edit Profile</span>
                <span style={{ color: c.subtext }}>→</span>
              </button>

              {/* 2. Update News Banner */}
              <button
                onClick={() => setActiveView("news")}
                style={drawerButtonStyle(c)}
              >
                <span>📢 Update News Banner (Top Ticker)</span>
                <span style={{ color: "#F59E0B", fontWeight: "900" }}>Live</span>
              </button>

              {/* 3. Add Products (3-Way Upload) */}
              <button
                onClick={() => setActiveView("add_product")}
                style={drawerButtonStyle(c)}
              >
                <span>➕ Add Products (Browse / Drag & Drop / URL)</span>
                <span style={{ color: "#10B981", fontWeight: "900" }}>+ New</span>
              </button>

              {/* 4. Add Offers */}
              <button
                onClick={() => setActiveView("offers")}
                style={drawerButtonStyle(c)}
              >
                <span>🏷️ Add Offers ({offers.length} active)</span>
                <span style={{ color: c.subtext }}>→</span>
              </button>

              {/* 5. Customer Orders */}
              <button
                onClick={() => setActiveView("customer_orders")}
                style={drawerButtonStyle(c)}
              >
                <span>📦 Customer Orders ({orders.length})</span>
                <span style={{ color: c.subtext }}>→</span>
              </button>

              {/* 6. Customer Queries - Live Chat with Customer Care */}
              <button
                onClick={() => setActiveView("queries")}
                style={drawerButtonStyle(c)}
              >
                <span>💬 Customer Queries & Live Chat</span>
                <span style={{ color: "#38BDF8", fontWeight: "900" }}>
                  {tickets.filter((t) => t.status === "open").length} Open
                </span>
              </button>

              {/* 7. Sign Out */}
              <button onClick={handleSignOut} style={signOutButtonStyle}>
                🚪 Sign Out
              </button>
            </div>
          )}

          {/* ================================================================ */}
          {/* 2. MENU VIEW: USER SIDE */}
          {/* ================================================================ */}
          {activeView === "menu" && !activeTicketId && !isAdmin && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {/* User Profile Card */}
              <div
                style={{
                  padding: "16px",
                  borderRadius: "14px",
                  backgroundColor: c.cardBg,
                  border: `1px solid ${c.border}`,
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  marginBottom: "6px",
                }}
              >
                <div style={{ fontSize: "36px" }}>👤</div>
                <div>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: "900",
                      color: c.text,
                    }}
                  >
                    {user?.name || "Customer"}
                  </div>
                  <div style={{ fontSize: "12px", color: c.subtext }}>
                    {user?.email || "customer@rmart.com"}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#10B981",
                      fontWeight: "800",
                      marginTop: "2px",
                    }}
                  >
                    ● Verified Buyer Account
                  </div>
                </div>
              </div>

              {/* 1. Edit Profile */}
              <button
                onClick={() => setActiveView("profile")}
                style={drawerButtonStyle(c)}
              >
                <span>✏️ Edit Profile</span>
                <span style={{ color: c.subtext }}>→</span>
              </button>

              {/* 2. My Orders */}
              <button
                onClick={() => setActiveView("orders")}
                style={drawerButtonStyle(c)}
              >
                <span>📦 My Orders ({orders.length})</span>
                <span style={{ color: c.subtext }}>→</span>
              </button>

              {/* 3. Inbox for Live Notifications */}
              <button
                onClick={() => setActiveView("inbox")}
                style={drawerButtonStyle(c)}
              >
                <span>🔔 Inbox (Live Notifications)</span>
                <span style={{ color: "#38BDF8", fontWeight: "900" }}>3</span>
              </button>

              {/* 4. Customer Care & Live Chat */}
              <button
                onClick={() => setActiveView("support")}
                style={drawerButtonStyle(c)}
              >
                <span>🎧 Customer Care & Live Chat with Admin</span>
                <span style={{ color: "#10B981", fontWeight: "900" }}>Live</span>
              </button>

              {/* 5. My Wishlist */}
              <button
                onClick={() => setActiveView("wishlist")}
                style={drawerButtonStyle(c)}
              >
                <span>❤️ My Wishlist ({storeWishlist.length})</span>
                <span style={{ color: c.subtext }}>→</span>
              </button>

              {/* 6. Sign Out */}
              <button onClick={handleSignOut} style={signOutButtonStyle}>
                🚪 Sign Out
              </button>
            </div>
          )}

          {/* ================================================================ */}
          {/* VIEW: EDIT PROFILE */}
          {/* ================================================================ */}
          {activeView === "profile" && !activeTicketId && (
            <form
              onSubmit={handleSaveProfile}
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <div>
                <label style={labelStyle(c)}>Full Name</label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  style={inputStyle(c)}
                />
              </div>

              <div>
                <label style={labelStyle(c)}>Email Address</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || "account@rmart.com"}
                  style={{ ...inputStyle(c), opacity: 0.6 }}
                />
              </div>

              {!isAdmin && (
                <div>
                  <label style={labelStyle(c)}>Saved Delivery Address</label>
                  <div
                    style={{
                      padding: "12px",
                      borderRadius: "10px",
                      backgroundColor: c.cardBg,
                      border: `1px solid ${c.border}`,
                      fontSize: "13px",
                      color: c.subtext,
                    }}
                  >
                    {localStorage.getItem("rmart_saved_address") ? (
                      <div>
                        {
                          JSON.parse(localStorage.getItem("rmart_saved_address"))
                            .street
                        }
                        ,{" "}
                        {
                          JSON.parse(localStorage.getItem("rmart_saved_address"))
                            .city
                        }{" "}
                        -{" "}
                        {
                          JSON.parse(localStorage.getItem("rmart_saved_address"))
                            .pincode
                        }
                      </div>
                    ) : (
                      "No saved address yet. Address will be saved automatically upon checkout!"
                    )}
                  </div>
                </div>
              )}

              <button
                type="submit"
                style={{
                  backgroundColor: c.accent,
                  color: "#030712",
                  border: "none",
                  padding: "12px",
                  borderRadius: "10px",
                  fontWeight: "900",
                  cursor: "pointer",
                  marginTop: "8px",
                }}
              >
                Save Profile Changes
              </button>
            </form>
          )}

          {/* ================================================================ */}
          {/* ADMIN VIEW: UPDATE NEWS BANNER */}
          {/* ================================================================ */}
          {activeView === "news" && !activeTicketId && isAdmin && (
            <form
              onSubmit={handleSaveNewsBanner}
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <div
                style={{
                  backgroundColor: "rgba(245, 158, 11, 0.1)",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                  padding: "14px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  color: "#F59E0B",
                }}
              >
                📢 <strong>Human-Readable Scrolling Ticker:</strong>
                <div style={{ marginTop: "4px", color: c.subtext }}>
                  Whatever you enter here will immediately scroll across the top
                  news banner on the website in human-readable speed!
                </div>
              </div>

              <div>
                <label style={labelStyle(c)}>News Announcement Text</label>
                <textarea
                  rows="4"
                  required
                  value={newsInput}
                  onChange={(e) => setNewsInput(e.target.value)}
                  placeholder="e.g. ⚡ Flash Sale: 20% OFF with code RMART20 • 🛡️ 100% Trusted Genuine Hardware • 🚀 Express Delivery in 24-48 Hours"
                  style={textareaStyle(c)}
                />
              </div>

              <button
                type="submit"
                style={{
                  backgroundColor: "#F59E0B",
                  color: "#000000",
                  border: "none",
                  padding: "12px",
                  borderRadius: "10px",
                  fontWeight: "900",
                  cursor: "pointer",
                }}
              >
                🚀 Update News Banner Live
              </button>
            </form>
          )}

          {/* ================================================================ */}
          {/* ADMIN VIEW: ADD PRODUCTS (3 WAYS TO UPLOAD IMAGES) */}
          {/* ================================================================ */}
          {activeView === "add_product" && !activeTicketId && isAdmin && (
            <form
              onSubmit={handleAddProductSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "14px" }}
            >
              <div>
                <label style={labelStyle(c)}>Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RGB Wireless Pro Gaming Headset"
                  value={productForm.name}
                  onChange={(e) =>
                    setProductForm({ ...productForm, name: e.target.value })
                  }
                  style={inputStyle(c)}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={labelStyle(c)}>Category *</label>
                  <select
                    value={productForm.category}
                    onChange={(e) =>
                      setProductForm({ ...productForm, category: e.target.value })
                    }
                    style={inputStyle(c)}
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Peripherals">Peripherals</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle(c)}>Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="99.99"
                    value={productForm.price}
                    onChange={(e) =>
                      setProductForm({ ...productForm, price: e.target.value })
                    }
                    style={inputStyle(c)}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle(c)}>Initial Stock Units</label>
                <input
                  type="number"
                  required
                  value={productForm.stock}
                  onChange={(e) =>
                    setProductForm({ ...productForm, stock: e.target.value })
                  }
                  style={inputStyle(c)}
                />
              </div>

              <div>
                <label style={labelStyle(c)}>Description</label>
                <textarea
                  rows="3"
                  placeholder="Details, specs, and features of the product..."
                  value={productForm.description}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      description: e.target.value,
                    })
                  }
                  style={textareaStyle(c)}
                />
              </div>

              {/* 3 WAYS TO UPLOAD IMAGES */}
              <div>
                <label style={labelStyle(c)}>
                  Upload Product Image (3 Ways):
                </label>
                <div
                  style={{
                    display: "flex",
                    backgroundColor: c.cardBg,
                    border: `1px solid ${c.border}`,
                    borderRadius: "10px",
                    padding: "4px",
                    marginBottom: "12px",
                    gap: "4px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setImageUploadMethod("browse")}
                    style={uploadTabStyle(imageUploadMethod === "browse")}
                  >
                    1. Browse File
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageUploadMethod("dragdrop")}
                    style={uploadTabStyle(imageUploadMethod === "dragdrop")}
                  >
                    2. Drag & Drop
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageUploadMethod("url")}
                    style={uploadTabStyle(imageUploadMethod === "url")}
                  >
                    3. Image URL
                  </button>
                </div>

                {/* Way 1: Browse File */}
                {imageUploadMethod === "browse" && (
                  <div
                    style={{
                      padding: "16px",
                      borderRadius: "12px",
                      backgroundColor: c.cardBg,
                      border: `1px dashed ${c.border}`,
                      textAlign: "center",
                    }}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileChosen(e.target.files[0]);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        backgroundColor: "#1E293B",
                        color: "#38BDF8",
                        border: "1px solid rgba(56, 189, 248, 0.4)",
                        padding: "10px 18px",
                        borderRadius: "8px",
                        fontWeight: "800",
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      📁 Browse and Upload from Computer
                    </button>
                    <div style={{ fontSize: "11px", color: c.subtext, marginTop: "6px" }}>
                      Supports PNG, JPG, WEBP formats
                    </div>
                  </div>
                )}

                {/* Way 2: Drag & Drop */}
                {imageUploadMethod === "dragdrop" && (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    style={{
                      padding: "24px 16px",
                      borderRadius: "12px",
                      backgroundColor: isDragOver
                        ? "rgba(56, 189, 248, 0.15)"
                        : c.cardBg,
                      border: `2px dashed ${
                        isDragOver ? "#38BDF8" : c.border
                      }`,
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div style={{ fontSize: "28px", marginBottom: "4px" }}>
                      📥
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: "800", color: c.text }}>
                      Drag and Drop product image here
                    </div>
                    <div style={{ fontSize: "11px", color: c.subtext, marginTop: "4px" }}>
                      Release file to instantly preview
                    </div>
                  </div>
                )}

                {/* Way 3: Direct URL */}
                {imageUploadMethod === "url" && (
                  <div>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/... or direct image link"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      style={inputStyle(c)}
                    />
                  </div>
                )}

                {/* Image Live Preview */}
                {(previewImage || imageUrlInput) && (
                  <div
                    style={{
                      marginTop: "12px",
                      padding: "10px",
                      backgroundColor: c.cardBg,
                      borderRadius: "12px",
                      border: `1px solid ${c.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <img
                        src={previewImage || imageUrlInput}
                        alt="Preview"
                        style={{
                          width: "50px",
                          height: "50px",
                          objectFit: "cover",
                          borderRadius: "8px",
                          backgroundColor: "#000",
                        }}
                      />
                      <span style={{ fontSize: "12px", fontWeight: "800", color: "#10B981" }}>
                        ✔ Image Ready for Upload
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewImage("");
                        setImageUrlInput("");
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#EF4444",
                        fontSize: "12px",
                        fontWeight: "800",
                        cursor: "pointer",
                      }}
                    >
                      Remove ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Upload Product Button */}
              <button
                type="submit"
                style={{
                  backgroundColor: "#10B981",
                  color: "#030712",
                  border: "none",
                  padding: "14px",
                  borderRadius: "10px",
                  fontWeight: "900",
                  fontSize: "14px",
                  cursor: "pointer",
                  marginTop: "6px",
                  boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)",
                }}
              >
                🚀 Click on Upload Product
              </button>
            </form>
          )}

          {/* ================================================================ */}
          {/* ADMIN VIEW: ADD OFFERS */}
          {/* ================================================================ */}
          {activeView === "offers" && !activeTicketId && isAdmin && (
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <form
                onSubmit={handleAddOfferSubmit}
                style={{
                  backgroundColor: c.cardBg,
                  border: `1px solid ${c.border}`,
                  padding: "16px",
                  borderRadius: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div style={{ fontSize: "14px", fontWeight: "900", color: "#F59E0B" }}>
                  Create New Offer Promo
                </div>

                <div>
                  <label style={labelStyle(c)}>Promo Code (e.g. MEGA50)</label>
                  <input
                    type="text"
                    required
                    placeholder="RMART30"
                    value={offerCode}
                    onChange={(e) => setOfferCode(e.target.value)}
                    style={inputStyle(c)}
                  />
                </div>

                <div>
                  <label style={labelStyle(c)}>Discount Text</label>
                  <input
                    type="text"
                    required
                    placeholder="30% OFF or $25 CASHBACK"
                    value={offerDiscount}
                    onChange={(e) => setOfferDiscount(e.target.value)}
                    style={inputStyle(c)}
                  />
                </div>

                <div>
                  <label style={labelStyle(c)}>Terms / Description</label>
                  <input
                    type="text"
                    placeholder="Valid on all gaming accessories"
                    value={offerDesc}
                    onChange={(e) => setOfferDesc(e.target.value)}
                    style={inputStyle(c)}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    backgroundColor: "#F59E0B",
                    color: "#030712",
                    border: "none",
                    padding: "12px",
                    borderRadius: "8px",
                    fontWeight: "900",
                    cursor: "pointer",
                  }}
                >
                  + Add Active Offer
                </button>
              </form>

              {/* Active Offers List */}
              <div>
                <div style={{ fontSize: "12px", fontWeight: "900", color: c.subtext, marginBottom: "10px" }}>
                  CURRENT ACTIVE OFFERS:
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {offers.map((o) => (
                    <div
                      key={o.id}
                      style={{
                        padding: "14px",
                        borderRadius: "12px",
                        backgroundColor: c.cardBg,
                        border: `1px solid ${c.border}`,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontWeight: "900", color: "#F59E0B", fontSize: "14px" }}>
                            {o.code}
                          </span>
                          <span style={{ fontSize: "11px", backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#10B981", padding: "2px 6px", borderRadius: "4px", fontWeight: "800" }}>
                            {o.discount}
                          </span>
                        </div>
                        <div style={{ fontSize: "11px", color: c.subtext, marginTop: "4px" }}>
                          {o.desc}
                        </div>
                      </div>

                      <button
                        onClick={() => removeOffer(o.id)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#EF4444",
                          fontSize: "12px",
                          fontWeight: "800",
                          cursor: "pointer",
                        }}
                      >
                        Delete ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* VIEW: CUSTOMER ORDERS (ADMIN) / MY ORDERS (USER) */}
          {/* ================================================================ */}
          {(activeView === "customer_orders" || activeView === "orders") &&
            !activeTicketId && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {orders.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      color: c.subtext,
                      padding: "50px 0",
                    }}
                  >
                    <div style={{ fontSize: "40px", marginBottom: "8px" }}>📦</div>
                    <div>No customer orders placed yet.</div>
                  </div>
                ) : (
                  orders.map((ord, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "16px",
                        borderRadius: "14px",
                        backgroundColor: c.cardBg,
                        border: `1px solid ${c.border}`,
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: "900",
                            color: "#F59E0B",
                            fontSize: "14px",
                          }}
                        >
                          #{ord.orderId}
                        </span>
                        <span style={{ fontSize: "11px", color: c.subtext }}>
                          {ord.timestamp}
                        </span>
                      </div>

                      <div style={{ fontSize: "13px", color: c.text }}>
                        Recipient: <strong>{ord.address?.name || "Customer"}</strong> (
                        {ord.address?.phone || "N/A"})
                      </div>

                      <div style={{ fontSize: "12px", color: c.subtext }}>
                        📍 {ord.address?.street}, {ord.address?.city}
                      </div>

                      <div style={{ fontSize: "12px", color: c.subtext }}>
                        Items: {ord.items?.length || 1} product(s) • Payment:{" "}
                        <strong style={{ color: "#38BDF8" }}>
                          {ord.paymentMethod?.toUpperCase()}
                        </strong>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          borderTop: `1px solid ${c.border}`,
                          paddingTop: "8px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "16px",
                            fontWeight: "900",
                            color: "#10B981",
                          }}
                        >
                          ${ord.total}
                        </span>

                        {/* Track Order Live Button */}
                        <button
                          onClick={() => {
                            openTracker(ord);
                            handleClose();
                          }}
                          style={{
                            backgroundColor: "#10B981",
                            color: "#FFF",
                            border: "none",
                            padding: "6px 14px",
                            borderRadius: "8px",
                            fontWeight: "800",
                            fontSize: "12px",
                            cursor: "pointer",
                          }}
                        >
                          🚚 Track Order
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

          {/* ================================================================ */}
          {/* VIEW: CUSTOMER CARE / CUSTOMER QUERIES */}
          {/* ================================================================ */}
          {(activeView === "support" || activeView === "queries") &&
            !activeTicketId && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* User side: Raise new ticket */}
                {!isAdmin && (
                  <form
                    onSubmit={handleCreateTicket}
                    style={{
                      backgroundColor: c.cardBg,
                      border: `1px solid ${c.border}`,
                      borderRadius: "12px",
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    <div style={{ fontSize: "14px", fontWeight: "900", color: c.text }}>
                      Raise a Customer Care Ticket
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Subject (e.g. Delivery Delay / Payment Query)"
                      value={newTicketSubject}
                      onChange={(e) => setNewTicketSubject(e.target.value)}
                      style={inputStyle(c)}
                    />
                    <textarea
                      rows="3"
                      required
                      placeholder="Describe your issue in detail for our support team..."
                      value={newTicketMsg}
                      onChange={(e) => setNewTicketMsg(e.target.value)}
                      style={textareaStyle(c)}
                    />
                    <button
                      type="submit"
                      style={{
                        backgroundColor: "#F59E0B",
                        color: "#000",
                        border: "none",
                        padding: "12px",
                        borderRadius: "8px",
                        fontWeight: "900",
                        cursor: "pointer",
                        fontSize: "13px",
                      }}
                    >
                      🚀 Submit Ticket & Start Live Chat
                    </button>
                  </form>
                )}

                {/* Ticket Threads List */}
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: "800",
                      color: c.subtext,
                      marginBottom: "10px",
                    }}
                  >
                    {isAdmin ? "CUSTOMER QUERIES IN QUEUE:" : "YOUR SUPPORT THREADS:"}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {tickets.map((t) => {
                      const isResolved = t.status === "resolved";
                      return (
                        <div
                          key={t.id}
                          style={{
                            padding: "14px",
                            borderRadius: "12px",
                            backgroundColor: c.cardBg,
                            border: `1px solid ${c.border}`,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                          onClick={() => setActiveTicketId(t.id)}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <span
                              style={{
                                fontWeight: "800",
                                color: c.text,
                                fontSize: "14px",
                              }}
                            >
                              {t.subject}
                            </span>
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: "900",
                                color: isResolved ? "#10B981" : "#F59E0B",
                                backgroundColor: isResolved
                                  ? "rgba(16, 185, 129, 0.15)"
                                  : "rgba(245, 158, 11, 0.15)",
                                padding: "2px 8px",
                                borderRadius: "999px",
                              }}
                            >
                              {isResolved ? "RESOLVED" : "OPEN"}
                            </span>
                          </div>

                          <div
                            style={{
                              fontSize: "11px",
                              color: c.subtext,
                              marginTop: "6px",
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <span>Customer: {t.user} ({t.id})</span>
                            <span style={{ color: "#38BDF8" }}>Open Chat →</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

          {/* ================================================================ */}
          {/* ACTIVE LIVE CHAT THREAD WITH MARK RESOLVED BUTTON */}
          {/* ================================================================ */}
          {activeTicketId && selectedTicket && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                justifyContent: "space-between",
              }}
            >
              <div>
                {/* Chat Top Banner */}
                <div
                  style={{
                    backgroundColor: c.cardBg,
                    border: `1px solid ${c.border}`,
                    borderRadius: "12px",
                    padding: "14px",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: "900",
                          color: "#F59E0B",
                        }}
                      >
                        {selectedTicket.id}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          marginLeft: "8px",
                          color: c.subtext,
                        }}
                      >
                        • {selectedTicket.user}
                      </span>
                    </div>

                    {/* MARK RESOLVED BUTTON: BOTH USER & ADMIN CAN RESOLVE / REOPEN TICKET */}
                    <button
                      onClick={() => handleToggleResolveTicket(selectedTicket.id)}
                      style={{
                        backgroundColor:
                          selectedTicket.status === "resolved"
                            ? "#1E293B"
                            : "#10B981",
                        color:
                          selectedTicket.status === "resolved"
                            ? "#38BDF8"
                            : "#030712",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: "8px",
                        fontSize: "11px",
                        fontWeight: "900",
                        cursor: "pointer",
                      }}
                      title="Both user and admin can close or reopen ticket"
                    >
                      {selectedTicket.status === "resolved"
                        ? "↺ Reopen Ticket"
                        : "✔ Mark Resolved"}
                    </button>
                  </div>

                  <div
                    style={{
                      fontWeight: "800",
                      color: c.text,
                      fontSize: "14px",
                      marginTop: "6px",
                    }}
                  >
                    {selectedTicket.subject}
                  </div>
                </div>

                {/* Messages Stream */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    marginBottom: "16px",
                    maxHeight: "360px",
                    overflowY: "auto",
                  }}
                >
                  {selectedTicket.messages.map((m, idx) => {
                    const isSystem = m.sender === "system";
                    const isMe =
                      (isAdmin && m.sender === "admin") ||
                      (!isAdmin && m.sender === "user");

                    if (isSystem) {
                      return (
                        <div
                          key={idx}
                          style={{
                            alignSelf: "center",
                            fontSize: "11px",
                            color: "#10B981",
                            backgroundColor: "rgba(16, 185, 129, 0.1)",
                            padding: "4px 10px",
                            borderRadius: "999px",
                          }}
                        >
                          {m.text}
                        </div>
                      );
                    }

                    return (
                      <div
                        key={idx}
                        style={{
                          alignSelf: isMe ? "flex-end" : "flex-start",
                          maxWidth: "85%",
                          padding: "10px 14px",
                          borderRadius: "12px",
                          backgroundColor: isMe
                            ? isAdmin
                              ? "#F59E0B"
                              : "#38BDF8"
                            : c.cardBg,
                          color: isMe ? "#030712" : c.text,
                          border: isMe ? "none" : `1px solid ${c.border}`,
                          fontSize: "13px",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: "800",
                            fontSize: "10px",
                            marginBottom: "2px",
                          }}
                        >
                          {isMe
                            ? "You"
                            : m.sender === "admin"
                            ? "Admin Support"
                            : selectedTicket.user}
                        </div>
                        <div>{m.text}</div>
                        <div
                          style={{
                            fontSize: "10px",
                            opacity: 0.7,
                            textAlign: "right",
                            marginTop: "4px",
                          }}
                        >
                          {m.time}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={handleSendMessage}
                style={{ display: "flex", gap: "8px", marginTop: "auto" }}
              >
                <input
                  type="text"
                  placeholder={
                    isAdmin
                      ? "Type admin response to customer..."
                      : "Type message to support team..."
                  }
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "10px",
                    border: `1px solid ${c.border}`,
                    background: c.cardBg,
                    color: c.text,
                    fontSize: "13px",
                    outline: "none",
                  }}
                />
                <button
                  type="submit"
                  style={{
                    backgroundColor: isAdmin ? "#F59E0B" : "#38BDF8",
                    color: "#030712",
                    border: "none",
                    padding: "0 18px",
                    borderRadius: "10px",
                    fontWeight: "900",
                    cursor: "pointer",
                  }}
                >
                  Send
                </button>
              </form>
            </div>
          )}

          {/* ================================================================ */}
          {/* VIEW: INBOX (LIVE NOTIFICATIONS) */}
          {/* ================================================================ */}
          {activeView === "inbox" && !activeTicketId && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div
                style={{
                  padding: "14px",
                  borderRadius: "12px",
                  backgroundColor: c.cardBg,
                  border: `1px solid ${c.border}`,
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: "900",
                    color: "#10B981",
                  }}
                >
                  🟢 CELERY BACKGROUND WORKER
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: "800",
                    color: c.text,
                    marginTop: "4px",
                  }}
                >
                  Order dispatch notification emails processed asynchronously
                  via Redis message broker.
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: c.subtext,
                    marginTop: "4px",
                  }}
                >
                  Just now
                </div>
              </div>

              <div
                style={{
                  padding: "14px",
                  borderRadius: "12px",
                  backgroundColor: c.cardBg,
                  border: `1px solid ${c.border}`,
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: "900",
                    color: "#38BDF8",
                  }}
                >
                  ⚡ REDIS CACHE SYSTEM
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: "800",
                    color: c.text,
                    marginTop: "4px",
                  }}
                >
                  High-speed cache synchronization confirmed with FastAPI backend.
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: c.subtext,
                    marginTop: "4px",
                  }}
                >
                  8 mins ago
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* VIEW: WISHLIST */}
          {/* ================================================================ */}
          {activeView === "wishlist" && !activeTicketId && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {storeWishlist.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    color: c.subtext,
                    padding: "40px 0",
                  }}
                >
                  <div style={{ fontSize: "40px", marginBottom: "8px" }}>🤍</div>
                  <div>
                    Your wishlist is empty. Tap the heart on any product to save
                    it here!
                  </div>
                </div>
              ) : (
                storeWishlist.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "14px",
                      borderRadius: "12px",
                      backgroundColor: c.cardBg,
                      border: `1px solid ${c.border}`,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: "800",
                          color: c.text,
                        }}
                      >
                        {item.name || item.title}
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: "900",
                          color: "#10B981",
                        }}
                      >
                        ${Number(item.price).toFixed(2)}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleWishlist(item)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#EF4444",
                        fontSize: "13px",
                        fontWeight: "800",
                        cursor: "pointer",
                      }}
                    >
                      Remove ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Reusable micro-styles
const drawerButtonStyle = (c) => ({
  padding: "14px 16px",
  borderRadius: "12px",
  backgroundColor: c.cardBg,
  border: `1px solid ${c.border}`,
  color: c.text,
  textAlign: "left",
  fontSize: "14px",
  fontWeight: "800",
  cursor: "pointer",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  transition: "all 0.15s ease",
});

const signOutButtonStyle = {
  marginTop: "16px",
  padding: "14px",
  borderRadius: "12px",
  backgroundColor: "rgba(239, 68, 68, 0.12)",
  border: "1px solid rgba(239, 68, 68, 0.3)",
  color: "#EF4444",
  fontSize: "14px",
  fontWeight: "900",
  cursor: "pointer",
};

const labelStyle = (c) => ({
  fontSize: "12px",
  fontWeight: "800",
  color: c.subtext,
  display: "block",
  marginBottom: "6px",
});

const inputStyle = (c) => ({
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: `1px solid ${c.border}`,
  background: c.cardBg,
  color: c.text,
  fontSize: "13px",
  outline: "none",
  boxSizing: "border-box",
});

const textareaStyle = (c) => ({
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: `1px solid ${c.border}`,
  background: c.cardBg,
  color: c.text,
  fontSize: "13px",
  outline: "none",
  boxSizing: "border-box",
  resize: "vertical",
});

const uploadTabStyle = (active) => ({
  flex: 1,
  padding: "8px 4px",
  borderRadius: "8px",
  border: "none",
  backgroundColor: active ? "#38BDF8" : "transparent",
  color: active ? "#030712" : "#94A3B8",
  fontWeight: "800",
  fontSize: "11px",
  cursor: "pointer",
  transition: "all 0.2s ease",
});
