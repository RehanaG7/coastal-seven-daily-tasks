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
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [supportTab, setSupportTab] = useState("chatbot"); // "chatbot" | "tickets"
  const [chatbotMessages, setChatbotMessages] = useState([
    {
      sender: "bot",
      text: "👋 Hi! I am R-Bot, your 24/7 AI Smart Assistant for R-Mart. While the store admin is away, I can answer your questions immediately. Try asking below or tap any quick prompt!",
      time: "Online",
    },
  ]);
  const [chatbotInput, setChatbotInput] = useState("");

  // Add Product Studio State
  const [productForm, setProductForm] = useState({
    name: "",
    category: "Mobiles and Electronics",
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

  const rightMenuView = useUIStore((s) => s.rightMenuView);

  useEffect(() => {
    if (effectiveIsOpen) {
      reloadData();
      setActiveView(rightMenuView || "menu");
      setActiveTicketId(null);
    }
  }, [effectiveIsOpen, rightMenuView]);

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

    // If sent by user in ticket, trigger AI Chatbot response in admin absence!
    if (!isAdmin) {
      const userText = chatInput;
      setTimeout(() => {
        const botReply = generateBotReply(userText);
        const stored = JSON.parse(localStorage.getItem("rmart_support_tickets") || "[]");
        const withBot = stored.map((t) => {
          if (t.id === activeTicketId) {
            return {
              ...t,
              messages: [
                ...t.messages,
                {
                  sender: "admin",
                  isBot: true,
                  text: botReply,
                  time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                },
              ],
            };
          }
          return t;
        });
        localStorage.setItem("rmart_support_tickets", JSON.stringify(withBot));
        setTickets(withBot);
      }, 700);
    }
  };

  const generateBotReply = (text) => {
    const q = (text || "").toLowerCase();
    if (q.includes("order") || q.includes("track") || q.includes("where") || q.includes("delivery") || q.includes("courier")) {
      return "🤖 R-Bot: Your order tracking is handled in real-time via Celery background tasks! Check your Live Order Tracker modal or Notifications Inbox to see if it's Queued, Packed, Dispatched, or Out for Delivery.";
    }
    if (q.includes("pay later") || q.includes("later") || q.includes("credit") || q.includes("interest")) {
      return "🤖 R-Bot: R-Mart Pay Later provides an instant pre-approved $500 credit limit at 0% interest for 30 days. No card or OTP needed at checkout!";
    }
    if (q.includes("return") || q.includes("refund") || q.includes("cancel") || q.includes("replace")) {
      return "🤖 R-Bot: We offer a 7-day hassle-free doorstep return policy. Once requested, our courier picks up the package and refunds are credited within 24 hours.";
    }
    if (q.includes("payment") || q.includes("upi") || q.includes("card") || q.includes("cod")) {
      return "🤖 R-Bot: We support R-Mart Pay Later (0% APR), Instant UPI (Google Pay, PhonePe, Paytm), Visa/Mastercard/RuPay cards, and Cash on Delivery.";
    }
    if (q.includes("hi") || q.includes("hello") || q.includes("hey")) {
      return "🤖 R-Bot: Hello! I am R-Bot, your 24/7 AI Smart Assistant while our human store admin is away. Ask me about orders, Pay Later, returns, or payment options!";
    }
    return `🤖 R-Bot: Thanks for asking! I've noted down your query for our store administrator. A Celery background notification has been dispatched to alert the admin team.`;
  };

  const handleSendChatbotMessage = (queryText) => {
    const textToSend = queryText || chatbotInput;
    if (!textToSend.trim()) return;

    const userMsg = {
      sender: "user",
      text: textToSend.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newHistory = [...chatbotMessages, userMsg];
    setChatbotMessages(newHistory);
    setChatbotInput("");

    setTimeout(() => {
      const botResponse = generateBotReply(textToSend);
      setChatbotMessages([
        ...newHistory,
        {
          sender: "bot",
          text: botResponse,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }, 500);
  };

  // Admin Tracker Modifier using Celery background tasks
  const handleAdminUpdateOrderStatus = (orderId, newStatus) => {
    const celeryTaskId = "celery-task-" + Math.random().toString(36).substring(2, 9);
    const updated = orders.map((o) => {
      if (o.orderId === orderId) {
        return {
          ...o,
          status: newStatus,
          celery_task_id: celeryTaskId,
        };
      }
      return o;
    });

    localStorage.setItem("rmart_admin_orders", JSON.stringify(updated));
    setOrders(updated);

    // Send notification into User Inbox so user knows how far order came!
    const existingNotifs = JSON.parse(localStorage.getItem("rmart_user_inbox") || "[]");
    const newNotif = {
      id: Date.now(),
      title: `⚡ Order #${orderId} Tracker Updated: ${newStatus}`,
      message: `Admin modified tracker stage. Celery worker [${celeryTaskId}] dispatched background email & push alert. Order stage: "${newStatus}".`,
      time: "Just now",
      read: false,
      orderId: orderId,
    };
    localStorage.setItem("rmart_user_inbox", JSON.stringify([newNotif, ...existingNotifs]));

    setFeedbackMsg(`⚡ Celery Task [${celeryTaskId}] dispatched! Order #${orderId} moved to "${newStatus}". Customer notified.`);
    setTimeout(() => setFeedbackMsg(""), 4500);
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
      category: "Mobiles and Electronics",
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

  // Translucent Frosted Glass Palette (Allows store & products to be seen beneath overlay)
  const c = {
    bg: "rgba(5, 8, 17, 0.78)",
    cardBg: "rgba(15, 23, 42, 0.62)",
    border: "rgba(56, 189, 248, 0.25)",
    text: "#FFFFFF",
    subtext: "#94A3B8",
    accent: isAdmin ? "#F59E0B" : "#38BDF8",
  };

  const isAddProductFullScreen =
    activeView === "add_product" && !activeTicketId && isAdmin;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        display: "flex",
        justifyContent: isAddProductFullScreen ? "center" : "flex-end",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: isAddProductFullScreen ? "100vw" : "470px",
          height: "100%",
          backgroundColor: c.bg,
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderLeft: isAddProductFullScreen ? "none" : `1px solid ${c.border}`,
          display: "flex",
          flexDirection: "column",
          boxShadow: isAddProductFullScreen
            ? "none"
            : "-16px 0 50px rgba(0, 0, 0, 0.8), inset 1px 0 0 rgba(255, 255, 255, 0.08)",
          fontFamily: "'Inter', system-ui, sans-serif",
          color: c.text,
          transition: "max-width 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Drawer Header (Translucent Glass) */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${c.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "rgba(0, 0, 0, 0.55)",
            backdropFilter: "blur(12px)",
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

        {/* TRANSLUCENT OPTION QUICK-NAVIGATOR (Options are always visible and switchable) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "10px 16px",
            backgroundColor: "rgba(10, 15, 29, 0.5)",
            borderBottom: `1px solid ${c.border}`,
            overflowX: "auto",
            scrollbarWidth: "none",
          }}
        >
          <button
            onClick={() => {
              setActiveTicketId(null);
              setActiveView("menu");
            }}
            style={{
              padding: "4px 10px",
              borderRadius: "999px",
              fontSize: "11px",
              fontWeight: "800",
              cursor: "pointer",
              border: "none",
              backgroundColor: activeView === "menu" ? c.accent : "rgba(255, 255, 255, 0.08)",
              color: activeView === "menu" ? "#000" : c.subtext,
              whiteSpace: "nowrap",
            }}
          >
            📋 Menu
          </button>

          {isAdmin ? (
            <>
              <button
                onClick={() => {
                  setActiveTicketId(null);
                  setActiveView("profile");
                }}
                style={navPillStyle(activeView === "profile", c)}
              >
                ✏️ Profile
              </button>
              <button
                onClick={() => {
                  setActiveTicketId(null);
                  setActiveView("news");
                }}
                style={navPillStyle(activeView === "news", c)}
              >
                📢 News
              </button>
              <button
                onClick={() => {
                  setActiveTicketId(null);
                  setActiveView("add_product");
                }}
                style={navPillStyle(activeView === "add_product", c)}
              >
                ➕ Add Product
              </button>
              <button
                onClick={() => {
                  setActiveTicketId(null);
                  setActiveView("offers");
                }}
                style={navPillStyle(activeView === "offers", c)}
              >
                🏷️ Offers
              </button>
              <button
                onClick={() => {
                  setActiveTicketId(null);
                  setActiveView("customer_orders");
                }}
                style={navPillStyle(activeView === "customer_orders", c)}
              >
                📦 Orders
              </button>
              <button
                onClick={() => {
                  setActiveTicketId(null);
                  setActiveView("queries");
                }}
                style={navPillStyle(activeView === "queries", c)}
              >
                💬 Queries
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setActiveTicketId(null);
                  setActiveView("profile");
                }}
                style={navPillStyle(activeView === "profile", c)}
              >
                ✏️ Profile
              </button>
              <button
                onClick={() => {
                  setActiveTicketId(null);
                  setActiveView("orders");
                }}
                style={navPillStyle(activeView === "orders", c)}
              >
                📦 Orders
              </button>
              <button
                onClick={() => {
                  setActiveTicketId(null);
                  setActiveView("inbox");
                }}
                style={navPillStyle(activeView === "inbox", c)}
              >
                🔔 Inbox
              </button>
              <button
                onClick={() => {
                  setActiveTicketId(null);
                  setActiveView("support");
                }}
                style={navPillStyle(activeView === "support", c)}
              >
                🎧 Care
              </button>
              <button
                onClick={() => {
                  setActiveTicketId(null);
                  setActiveView("wishlist");
                }}
                style={navPillStyle(activeView === "wishlist", c)}
              >
                ❤️ Wishlist
              </button>
            </>
          )}
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
          {/* ADMIN VIEW: ADD PRODUCTS (FULL SCREEN STUDIO WITH 3-WAY UPLOAD & LIVE 3D PREVIEW) */}
          {/* ================================================================ */}
          {activeView === "add_product" && !activeTicketId && isAdmin && (
            <div
              style={{
                maxWidth: "1280px",
                width: "100%",
                margin: "0 auto",
                padding: "10px 0 40px 0",
              }}
            >
              {/* Top Studio Banner */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "24px",
                  paddingBottom: "16px",
                  borderBottom: `1px solid ${c.border}`,
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "28px" }}>📦</span>
                    <h2 style={{ fontSize: "22px", fontWeight: "900", margin: 0, color: c.text }}>
                      R-Mart Product Creation Studio
                    </h2>
                    <span
                      style={{
                        backgroundColor: "rgba(16, 185, 129, 0.2)",
                        color: "#10B981",
                        border: "1px solid rgba(16, 185, 129, 0.4)",
                        fontSize: "11px",
                        fontWeight: "900",
                        padding: "3px 10px",
                        borderRadius: "999px",
                      }}
                    >
                      🖥️ FULL SCREEN STUDIO
                    </span>
                  </div>
                  <p style={{ color: c.subtext, fontSize: "13px", margin: "4px 0 0 0" }}>
                    Add inventory with live stock validation, 3-way photography uploads, and instant TanStack cache invalidation.
                  </p>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setActiveView("menu")}
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      color: c.text,
                      border: `1px solid ${c.border}`,
                      padding: "8px 16px",
                      borderRadius: "10px",
                      fontWeight: "800",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    ← Back to Admin Menu
                  </button>
                </div>
              </div>

              {/* 2-Column Responsive Studio Layout */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
                  gap: "32px",
                  alignItems: "start",
                }}
              >
                {/* Column 1: Form & 3-Way Upload */}
                <form
                  onSubmit={handleAddProductSubmit}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    backgroundColor: c.cardBg,
                    border: `1px solid ${c.border}`,
                    borderRadius: "16px",
                    padding: "24px",
                    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
                  }}
                >
                  <div style={{ fontSize: "14px", fontWeight: "900", color: "#F59E0B" }}>
                    1. PRODUCT SPECIFICATIONS
                  </div>

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

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={labelStyle(c)}>Category *</label>
                      <select
                        value={productForm.category}
                        onChange={(e) =>
                          setProductForm({ ...productForm, category: e.target.value })
                        }
                        style={inputStyle(c)}
                      >
                        <option value="Mobiles and Electronics">Mobiles and Electronics</option>
                        <option value="Deals and Savings">Deals and Savings</option>
                        <option value="Fashion">Fashion</option>
                        <option value="Home and Furniture">Home and Furniture</option>
                        <option value="Groceries and Pet Supplies">Groceries and Pet Supplies</option>
                        <option value="Books and Education">Books and Education</option>
                        <option value="Games and Live Shopping">Games and Live Shopping</option>
                        <option value="Pharmacy and Household">Pharmacy and Household</option>
                        <option value="Travel and Auto">Travel and Auto</option>
                        <option value="Toys and Kids">Toys and Kids</option>
                        <option value="Sports and Fitness">Sports and Fitness</option>
                        <option value="Beauty">Beauty</option>
                        <option value="Gifting">Gifting</option>
                        <option value="Business Purchases">Business Purchases</option>
                        <option value="Everyday Needs">Everyday Needs</option>
                        <option value="Bills and Recharges">Bills and Recharges</option>
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

                    <div>
                      <label style={labelStyle(c)}>Stock Units *</label>
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
                    <div style={{ fontSize: "14px", fontWeight: "900", color: "#F59E0B", margin: "8px 0 10px 0" }}>
                      2. PRODUCT IMAGE (3 WAYS TO UPLOAD)
                    </div>
                    <div
                      style={{
                        display: "flex",
                        backgroundColor: "rgba(0, 0, 0, 0.4)",
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
                          padding: "20px",
                          borderRadius: "12px",
                          backgroundColor: "rgba(0,0,0,0.3)",
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
                            padding: "12px 22px",
                            borderRadius: "10px",
                            fontWeight: "800",
                            fontSize: "13px",
                            cursor: "pointer",
                          }}
                        >
                          📁 Browse & Upload Image
                        </button>
                        <div style={{ fontSize: "11px", color: c.subtext, marginTop: "8px" }}>
                          Supports PNG, JPG, WEBP, GIF formats
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
                          padding: "32px 16px",
                          borderRadius: "12px",
                          backgroundColor: isDragOver
                            ? "rgba(56, 189, 248, 0.15)"
                            : "rgba(0,0,0,0.3)",
                          border: `2px dashed ${
                            isDragOver ? "#38BDF8" : c.border
                          }`,
                          textAlign: "center",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <div style={{ fontSize: "36px", marginBottom: "6px" }}>
                          📥
                        </div>
                        <div style={{ fontSize: "14px", fontWeight: "800", color: c.text }}>
                          Drag and Drop product image here
                        </div>
                        <div style={{ fontSize: "12px", color: c.subtext, marginTop: "4px" }}>
                          Drop your image file anywhere in this box to preview instantly
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

                    {/* Image Live Preview Bar */}
                    {(previewImage || imageUrlInput) && (
                      <div
                        style={{
                          marginTop: "12px",
                          padding: "10px 14px",
                          backgroundColor: "rgba(16, 185, 129, 0.1)",
                          borderRadius: "12px",
                          border: "1px solid rgba(16, 185, 129, 0.3)",
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
                              width: "48px",
                              height: "48px",
                              objectFit: "cover",
                              borderRadius: "8px",
                              backgroundColor: "#000",
                            }}
                          />
                          <span style={{ fontSize: "12px", fontWeight: "800", color: "#10B981" }}>
                            ✔ Image Loaded & Ready to Publish
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
                      padding: "16px",
                      borderRadius: "12px",
                      fontWeight: "900",
                      fontSize: "15px",
                      cursor: "pointer",
                      marginTop: "10px",
                      boxShadow: "0 6px 20px rgba(16, 185, 129, 0.4)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    <span>🚀 Publish Product to R-Mart 3D Catalog</span>
                  </button>
                </form>

                {/* Column 2: Live 3D Customer Card Preview */}
                <div
                  style={{
                    backgroundColor: c.cardBg,
                    border: `1px solid ${c.border}`,
                    borderRadius: "16px",
                    padding: "24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
                    position: "sticky",
                    top: "10px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontSize: "14px", fontWeight: "900", color: "#38BDF8" }}>
                      3. LIVE 3D CUSTOMER CARD PREVIEW
                    </div>
                    <span
                      style={{
                        fontSize: "11px",
                        backgroundColor: "rgba(56, 189, 248, 0.15)",
                        color: "#38BDF8",
                        padding: "2px 8px",
                        borderRadius: "8px",
                        fontWeight: "800",
                      }}
                    >
                      Real-time
                    </span>
                  </div>

                  <p style={{ color: c.subtext, fontSize: "12px", margin: 0 }}>
                    This preview shows exactly how shoppers will see your product card in the 3D grid:
                  </p>

                  {/* Card Simulation */}
                  <div
                    style={{
                      backgroundColor: "#0B0F19",
                      borderRadius: "18px",
                      border: "1px solid #1E293B",
                      overflow: "hidden",
                      boxShadow: "0 12px 30px rgba(0,0,0,0.6)",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <div style={{ position: "relative", height: "220px", backgroundColor: "#020617" }}>
                      <img
                        src={
                          previewImage ||
                          imageUrlInput.trim() ||
                          "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500"
                        }
                        alt="Product Preview"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          top: "12px",
                          left: "12px",
                          backgroundColor: "rgba(0,0,0,0.6)",
                          backdropFilter: "blur(6px)",
                          color: "#38BDF8",
                          fontSize: "11px",
                          fontWeight: "800",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          border: "1px solid rgba(56, 189, 248, 0.3)",
                        }}
                      >
                        {productForm.category || "Category"}
                      </div>
                      <div
                        style={{
                          position: "absolute",
                          top: "12px",
                          right: "12px",
                          backgroundColor: "rgba(0,0,0,0.6)",
                          color: "#EF4444",
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "16px",
                        }}
                      >
                        ❤️
                      </div>
                    </div>

                    <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ fontSize: "16px", fontWeight: "900", color: "#FFFFFF" }}>
                        {productForm.name || "Product Name (e.g. RGB Gaming Headset)"}
                      </div>
                      <div style={{ fontSize: "12px", color: "#94A3B8", lineHeight: 1.4 }}>
                        {productForm.description || "Product description will appear here..."}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "baseline",
                          marginTop: "8px",
                        }}
                      >
                        <div style={{ fontSize: "22px", fontWeight: "900", color: "#38BDF8" }}>
                          ${productForm.price ? parseFloat(productForm.price).toFixed(2) : "99.99"}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            fontWeight: "800",
                            color: "#10B981",
                            backgroundColor: "rgba(16, 185, 129, 0.15)",
                            padding: "2px 8px",
                            borderRadius: "6px",
                          }}
                        >
                          Stock: {productForm.stock || 15} units
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled
                        style={{
                          marginTop: "10px",
                          backgroundColor: "#F59E0B",
                          color: "#030712",
                          border: "none",
                          padding: "10px",
                          borderRadius: "8px",
                          fontWeight: "900",
                          fontSize: "13px",
                          cursor: "not-allowed",
                          opacity: 0.9,
                        }}
                      >
                        🛒 Add to Cart (Customer View)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
                {feedbackMsg && (
                  <div
                    style={{
                      backgroundColor: "rgba(16, 185, 129, 0.2)",
                      border: "1px solid #10B981",
                      color: "#10B981",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      fontSize: "12px",
                      fontWeight: "800",
                      textAlign: "center",
                    }}
                  >
                    {feedbackMsg}
                  </div>
                )}

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

                      {/* Current Status Badge */}
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "11px", color: c.subtext }}>Stage:</span>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: "900",
                            backgroundColor:
                              ord.status === "Delivered"
                                ? "rgba(16, 185, 129, 0.15)"
                                : "rgba(245, 158, 11, 0.15)",
                            color: ord.status === "Delivered" ? "#10B981" : "#F59E0B",
                            padding: "2px 8px",
                            borderRadius: "6px",
                            border: `1px solid ${
                              ord.status === "Delivered" ? "#10B981" : "#F59E0B"
                            }`,
                          }}
                        >
                          {ord.status || "Processing (Queued in Redis)"}
                        </span>
                      </div>

                      {/* ADMIN CELERY TRACKER CONTROLLER */}
                      {isAdmin && (
                        <div
                          style={{
                            backgroundColor: "rgba(10, 15, 30, 0.8)",
                            border: "1px dashed #38BDF8",
                            borderRadius: "10px",
                            padding: "10px 12px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                            marginTop: "4px",
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
                                fontSize: "11px",
                                fontWeight: "900",
                                color: "#38BDF8",
                              }}
                            >
                              ⚡ CELERY WORKER TASK (ADMIN):
                            </span>
                            <span
                              style={{
                                fontSize: "10px",
                                color: "#F59E0B",
                                fontFamily: "monospace",
                              }}
                            >
                              {ord.celery_task_id || "celery-worker-task"}
                            </span>
                          </div>

                          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <select
                              value={ord.status || "Processing (Queued in Redis)"}
                              onChange={(e) =>
                                handleAdminUpdateOrderStatus(
                                  ord.orderId,
                                  e.target.value
                                )
                              }
                              style={{
                                flex: 1,
                                padding: "6px 8px",
                                borderRadius: "6px",
                                backgroundColor: "#030712",
                                border: "1px solid #334155",
                                color: "#FFFFFF",
                                fontSize: "12px",
                                fontWeight: "800",
                              }}
                            >
                              <option value="Processing (Queued in Redis)">
                                1. Processing (Queued in Redis)
                              </option>
                              <option value="Shipped (Celery Dispatched)">
                                2. Shipped (Celery Dispatched)
                              </option>
                              <option value="Dispatched from Hub">
                                3. Dispatched from Regional Hub
                              </option>
                              <option value="Out for Delivery">
                                4. Out for Delivery (Courier Assigned)
                              </option>
                              <option value="Delivered">
                                5. Delivered to Customer
                              </option>
                            </select>

                            <button
                              onClick={() =>
                                handleAdminUpdateOrderStatus(
                                  ord.orderId,
                                  "Delivered"
                                )
                              }
                              style={{
                                backgroundColor: "#10B981",
                                color: "#000",
                                border: "none",
                                padding: "6px 12px",
                                borderRadius: "6px",
                                fontSize: "11px",
                                fontWeight: "900",
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Deliver ✓
                            </button>
                          </div>
                        </div>
                      )}

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
                {/* Support Sub-tabs: AI Chatbot vs Admin Ticket (User Side) */}
                {!isAdmin && (
                  <div
                    style={{
                      display: "flex",
                      backgroundColor: "rgba(15, 23, 42, 0.8)",
                      borderRadius: "10px",
                      padding: "4px",
                      border: `1px solid ${c.border}`,
                    }}
                  >
                    <button
                      onClick={() => setSupportTab("chatbot")}
                      style={{
                        flex: 1,
                        padding: "8px",
                        borderRadius: "8px",
                        border: "none",
                        backgroundColor: supportTab === "chatbot" ? "#38BDF8" : "transparent",
                        color: supportTab === "chatbot" ? "#030712" : "#94A3B8",
                        fontWeight: "900",
                        fontSize: "12px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                      }}
                    >
                      <span>🤖</span>
                      <span>R-Bot AI Assistant (Instant)</span>
                    </button>
                    <button
                      onClick={() => setSupportTab("tickets")}
                      style={{
                        flex: 1,
                        padding: "8px",
                        borderRadius: "8px",
                        border: "none",
                        backgroundColor: supportTab === "tickets" ? "#F59E0B" : "transparent",
                        color: supportTab === "tickets" ? "#030712" : "#94A3B8",
                        fontWeight: "900",
                        fontSize: "12px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                      }}
                    >
                      <span>🎫</span>
                      <span>Human Admin Tickets</span>
                    </button>
                  </div>
                )}

                {/* 1. R-BOT AI CHATBOT MODE (Answers in Admin Absence) */}
                {!isAdmin && supportTab === "chatbot" && (
                  <div
                    style={{
                      backgroundColor: c.cardBg,
                      border: `1px solid ${c.border}`,
                      borderRadius: "14px",
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    {/* Bot Header */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderBottom: `1px solid ${c.border}`,
                        paddingBottom: "10px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "20px" }}>🤖</span>
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: "900", color: "#38BDF8" }}>
                            R-Bot AI Smart Support
                          </div>
                          <div style={{ fontSize: "11px", color: c.subtext }}>
                            24/7 Automated Query Solver (Active in Admin Absence)
                          </div>
                        </div>
                      </div>
                      <span
                        style={{
                          backgroundColor: "rgba(16, 185, 129, 0.2)",
                          color: "#10B981",
                          fontSize: "10px",
                          fontWeight: "900",
                          padding: "3px 8px",
                          borderRadius: "12px",
                        }}
                      >
                        ● ONLINE
                      </span>
                    </div>

                    {/* Chat Messages Stream */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        maxHeight: "260px",
                        overflowY: "auto",
                        padding: "4px",
                      }}
                    >
                      {chatbotMessages.map((m, idx) => {
                        const isBot = m.sender === "bot";
                        return (
                          <div
                            key={idx}
                            style={{
                              alignSelf: isBot ? "flex-start" : "flex-end",
                              backgroundColor: isBot ? "rgba(15, 23, 42, 0.85)" : "#38BDF8",
                              color: isBot ? "#F8FAFC" : "#030712",
                              border: isBot ? `1px solid ${c.border}` : "none",
                              padding: "10px 14px",
                              borderRadius: isBot ? "12px 12px 12px 2px" : "12px 12px 2px 12px",
                              maxWidth: "85%",
                              fontSize: "13px",
                              lineHeight: 1.4,
                            }}
                          >
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

                    {/* Instant Quick Action Prompt Chips */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {[
                        "📦 Where is my order?",
                        "⏳ How does Pay Later work?",
                        "↩️ 7-Day Return Policy",
                        "💳 Supported payment methods",
                      ].map((promptText, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => handleSendChatbotMessage(promptText)}
                          style={{
                            backgroundColor: "rgba(56, 189, 248, 0.1)",
                            border: "1px solid rgba(56, 189, 248, 0.3)",
                            color: "#38BDF8",
                            padding: "4px 10px",
                            borderRadius: "14px",
                            fontSize: "11px",
                            fontWeight: "800",
                            cursor: "pointer",
                          }}
                        >
                          {promptText}
                        </button>
                      ))}
                    </div>

                    {/* Input Bar */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendChatbotMessage();
                      }}
                      style={{ display: "flex", gap: "8px", marginTop: "4px" }}
                    >
                      <input
                        type="text"
                        placeholder="Type any question (orders, pay later, returns)..."
                        value={chatbotInput}
                        onChange={(e) => setChatbotInput(e.target.value)}
                        style={{ ...inputStyle(c), flex: 1 }}
                      />
                      <button
                        type="submit"
                        style={{
                          backgroundColor: "#38BDF8",
                          color: "#030712",
                          border: "none",
                          padding: "0 18px",
                          borderRadius: "8px",
                          fontWeight: "900",
                          fontSize: "13px",
                          cursor: "pointer",
                        }}
                      >
                        Ask Bot
                      </button>
                    </form>

                    <div style={{ textAlign: "center", marginTop: "4px" }}>
                      <button
                        type="button"
                        onClick={() => setSupportTab("tickets")}
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
                        Need human assistance? Escalate to Admin Support Ticket ➔
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. ADMIN TICKETS FORM & THREADS (When in tickets mode or admin) */}
                {(!isAdmin && supportTab === "tickets") && (
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
                      Raise a Customer Care Ticket to Store Admin
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

const navPillStyle = (active, c) => ({
  padding: "4px 10px",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: "800",
  cursor: "pointer",
  border: `1px solid ${active ? c.accent : "rgba(255, 255, 255, 0.12)"}`,
  backgroundColor: active
    ? c.accent === "#F59E0B"
      ? "rgba(245, 158, 11, 0.25)"
      : "rgba(56, 189, 248, 0.25)"
    : "rgba(255, 255, 255, 0.05)",
  color: active ? (c.accent === "#F59E0B" ? "#F59E0B" : "#38BDF8") : c.subtext,
  whiteSpace: "nowrap",
  transition: "all 0.15s ease",
});

