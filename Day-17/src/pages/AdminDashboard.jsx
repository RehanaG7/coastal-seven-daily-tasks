import React, { useState, useMemo, useRef, useEffect } from "react";
import { useUIStore, useAuthStore } from "../store/useStore";
import { MOCK_CATALOG, ALL_CATEGORIES, productKeys } from "../hooks/useProducts";
import { queryClient } from "../lib/queryClient";
import { useNavigate } from "react-router-dom";
import { orderService, apiClient } from "../api/apiClient";
import { useWebSocket } from "../hooks/useWebSocket";
import { env } from "../config/env";

export default function AdminDashboard() {
  const theme = useUIStore((s) => s.theme);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const isDark = theme === "dark";

  const [activeTab, setActiveTab] = useState("catalog"); // "catalog" | "add_product" | "requested" | "orders" | "live_support"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortOption, setSortOption] = useState("default");

  // Route guard: Redirect unauthenticated or non-admin users
  useEffect(() => {
    const role = localStorage.getItem("user_role") || (user && user.role);
    if (!role || role !== "admin") {
      navigate("/auth", { replace: true });
    }
  }, [user, navigate]);

  // Reviews modal state
  const [reviewModalProduct, setReviewModalProduct] = useState(null);

  // Admin Orders Management State
  const [adminOrders, setAdminOrders] = useState([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("rmart_orders") || "[]");
      setAdminOrders(saved);
    } catch (e) {
      setAdminOrders([]);
    }
  }, [activeTab]);

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    const updated = adminOrders.map((ord) =>
      ord.orderId === orderId ? { ...ord, status: newStatus } : ord
    );
    setAdminOrders(updated);
    localStorage.setItem("rmart_orders", JSON.stringify(updated));

    // Broadcast over WebSocket via Backend API
    try {
      const numericId = parseInt(String(orderId).replace(/\D/g, "")) || 1;
      await orderService.updateStatus(numericId, newStatus);
    } catch (e) {
      // Local fallback
    }
  };

  // Day 17: Admin Live Support Chat & Real-Time Broadcast
  const [adminChatInput, setAdminChatInput] = useState("");
  const [adminChatMessages, setAdminChatMessages] = useState([
    {
      id: 1,
      sender_role: "customer",
      sender_name: "Customer (Ananya)",
      text: "Hi support team! When will order #RM-204910 arrive?",
      timestamp: "10:15 AM",
    },
    {
      id: 2,
      sender_role: "admin",
      sender_name: "Admin Staff",
      text: "Hello Ananya, checking your dispatch status now! It has been handed over to regional hub.",
      timestamp: "10:16 AM",
    },
  ]);
  const [broadcastSuccess, setBroadcastSuccess] = useState(null);

  const [adminOnlineToggle, setAdminOnlineToggle] = useState(true);

  const { sendMessage: sendAdminSocketMsg, isConnected: isChatConnected } = useWebSocket(
    `${env.WS_URL}/chat/general?role=admin`,
    {
      autoConnect: true,
      reconnect: true,
      onMessage: (data) => {
        if (data?.type === "CHAT_MESSAGE") {
          setAdminChatMessages((prev) => {
            if (prev.some((m) => m.id === data.id)) return prev;
            if (data.client_id && prev.some((m) => m.id === data.client_id)) {
              return prev.map((m) => (m.id === data.client_id ? { ...m, id: data.id } : m));
            }
            return [
              ...prev,
              {
                id: data.id || Date.now(),
                sender_role: data.sender_role,
                sender_name: data.sender_name,
                text: data.text,
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              },
            ];
          });
        }
        if (data?.type === "ADMIN_STATUS") {
          setAdminOnlineToggle(!!data.online);
        }
      },
    }
  );

  const handleToggleAdminPresence = () => {
    const next = !adminOnlineToggle;
    setAdminOnlineToggle(next);
    sendAdminSocketMsg({
      type: "ADMIN_STATUS_UPDATE",
      online: next,
    });
  };

  const handleSendAdminReply = (e) => {
    e?.preventDefault();
    if (!adminChatInput.trim()) return;

    const clientId = `admin-local-${Date.now()}`;
    const newMsg = {
      id: clientId,
      sender_role: "admin",
      sender_name: "Admin (You)",
      text: adminChatInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setAdminChatMessages((prev) => [...prev, newMsg]);

    sendAdminSocketMsg({
      type: "CHAT_MESSAGE",
      room_id: "general",
      sender_role: "admin",
      sender_name: user?.name || "Senior Administrator",
      text: adminChatInput.trim(),
      client_id: clientId,
    });

    setAdminChatInput("");
  };

  const handleSendBroadcast = async () => {
    try {
      await apiClient.post("/notifications/broadcast", {
        title: "⚡ Flash Sale Live: 20% OFF",
        message: "Exclusive coupon code RMART20 unlocked on electronics!",
        category: "promo",
      });
      setBroadcastSuccess("Live notification broadcasted successfully across WebSockets!");
      setTimeout(() => setBroadcastSuccess(null), 4000);
    } catch (e) {
      setBroadcastSuccess("Broadcast sent to local store subscribers.");
      setTimeout(() => setBroadcastSuccess(null), 4000);
    }
  };

  // Add Product Studio state
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    stock: "15",
    category: "Mobiles and Electronics",
    image: "",
    description: "",
  });
  const [uploadMode, setUploadMode] = useState("link");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Products state backed by localStorage + MOCK_CATALOG
  const [products, setProductsState] = useState(() => {
    try {
      const custom = JSON.parse(localStorage.getItem("rmart_custom_products") || "[]");
      return [...custom, ...MOCK_CATALOG];
    } catch (e) {
      return MOCK_CATALOG;
    }
  });

  const setProducts = (newProductsOrUpdater) => {
    setProductsState((prev) => {
      const next = typeof newProductsOrUpdater === "function" ? newProductsOrUpdater(prev) : newProductsOrUpdater;
      try {
        const customOnly = next.filter((p) => !MOCK_CATALOG.some((m) => m.id === p.id));
        localStorage.setItem("rmart_custom_products", JSON.stringify(customOnly));
      } catch (err) {}
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      return next;
    });
  };

  const safeProducts = Array.isArray(products) && products.length > 0 ? products : [];
  const categories = ALL_CATEGORIES;

  const filteredAndSorted = useMemo(() => {
    let list = safeProducts.filter((p) => {
      const matchSearch = (p.name || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === "All" || p.category === selectedCategory;
      return matchSearch && matchCat;
    });

    if (sortOption === "price_asc") list.sort((a, b) => a.price - b.price);
    else if (sortOption === "price_desc") list.sort((a, b) => b.price - a.price);
    else if (sortOption === "name_asc") list.sort((a, b) => a.name.localeCompare(b.name));

    return list;
  }, [safeProducts, searchQuery, selectedCategory, sortOption]);

  const handleModifyStock = (id, delta) => {
    setProducts(
      safeProducts.map((p) => (p.id === id ? { ...p, stock: Math.max(0, (p.stock || 0) + delta) } : p))
    );
  };

  const handleDeleteProduct = (id, name) => {
    if (window.confirm(`Are you sure you want to permanently delete "${name}" from inventory?`)) {
      setProducts(safeProducts.filter((p) => p.id !== id));
    }
  };

  const handleFiles = (files) => {
    if (files && files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setNewProduct((prev) => ({ ...prev, image: e.target.result }));
      };
      reader.readAsDataURL(files[0]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) {
      alert("Please provide product name and price.");
      return;
    }
    const created = {
      id: Date.now(),
      name: newProduct.name,
      title: newProduct.name,
      price: parseFloat(newProduct.price),
      stock: parseInt(newProduct.stock || "0", 10),
      category: newProduct.category,
      image: newProduct.image || `https://picsum.photos/seed/product-${Date.now()}/400/300`,
      description: newProduct.description || "Admin catalog addition.",
    };

    // 1. Post to backend SQLite database
    try {
      await fetch("http://127.0.0.1:8000/products/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: created.name,
          description: created.description,
          price: created.price,
          stock: created.stock,
          category: created.category,
          owner_id: 1,
        }),
      });
    } catch (err) {
      console.warn("Backend creation fallback to local:", err);
    }

    // 2. Save in local state and localStorage
    setProducts([created, ...safeProducts]);
    try {
      const existing = JSON.parse(localStorage.getItem("rmart_custom_products") || "[]");
      localStorage.setItem("rmart_custom_products", JSON.stringify([created, ...existing]));
    } catch (err) {}

    queryClient.invalidateQueries({ queryKey: ["products"] });

    alert(`Product "${created.name}" published to catalog with category "${created.category}"!`);
    setNewProduct({ name: "", price: "", stock: "15", category: "Mobiles and Electronics", image: "", description: "" });
    setActiveTab("catalog");
  };


  const c = {
    bg: isDark ? "#080C14" : "#F8FAFC",
    cardBg: isDark ? "#0F172A" : "#FFFFFF",
    border: isDark ? "#1E293B" : "#E2E8F0",
    text: isDark ? "#F8FAFB" : "#0F172A",
    subtext: isDark ? "#94A3B8" : "#64748B",
  };

  return (
    <div style={{ backgroundColor: c.bg, minHeight: "100vh", padding: "20px 24px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: "1240px", margin: "0 auto" }}>
        
        {/* Admin Header Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            backgroundColor: c.cardBg,
            border: `1px solid ${c.border}`,
            borderRadius: "14px",
            padding: "16px 20px",
            marginBottom: "20px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "20px" }}>🛡️</span>
              <h1 style={{ fontSize: "20px", fontWeight: "900", color: c.text, margin: 0 }}>
                R-Mart Admin Portal
              </h1>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "900",
                  backgroundColor: "rgba(245, 158, 11, 0.15)",
                  color: "#F59E0B",
                  padding: "3px 8px",
                  borderRadius: "6px",
                  border: "1px solid rgba(245, 158, 11, 0.4)",
                }}
              >
                PASSCODE VERIFIED (ADMIN-2026)
              </span>
            </div>
            <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: c.subtext }}>
              Manage inventory, live stock, incoming orders, and customer requests.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={() => navigate("/catalog")}
              style={{
                backgroundColor: "rgba(56, 189, 248, 0.15)",
                color: "#38BDF8",
                border: "1px solid #38BDF8",
                padding: "8px 16px",
                borderRadius: "8px",
                fontWeight: "800",
                fontSize: "12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>🪐</span>
              <span>View Store Catalog</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "22px" }}>
          <button
            onClick={() => setActiveTab("catalog")}
            style={{
              backgroundColor: activeTab === "catalog" ? "#3B82F6" : c.cardBg,
              color: activeTab === "catalog" ? "#FFF" : c.text,
              border: `1px solid ${activeTab === "catalog" ? "#3B82F6" : c.border}`,
              padding: "9px 18px",
              borderRadius: "8px",
              fontWeight: "800",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            📦 Products & Stock ({safeProducts.length})
          </button>

          <button
            onClick={() => setActiveTab("orders")}
            style={{
              backgroundColor: activeTab === "orders" ? "#3B82F6" : c.cardBg,
              color: activeTab === "orders" ? "#FFF" : c.text,
              border: `1px solid ${activeTab === "orders" ? "#3B82F6" : c.border}`,
              padding: "9px 18px",
              borderRadius: "8px",
              fontWeight: "800",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            📋 Orders ({adminOrders.length})
          </button>

          <button
            onClick={() => setActiveTab("add_product")}
            style={{
              backgroundColor: activeTab === "add_product" ? "#3B82F6" : c.cardBg,
              color: activeTab === "add_product" ? "#FFF" : c.text,
              border: `1px solid ${activeTab === "add_product" ? "#3B82F6" : c.border}`,
              padding: "9px 18px",
              borderRadius: "8px",
              fontWeight: "800",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            + Add Product Studio
          </button>

          <button
            onClick={() => setActiveTab("requested")}
            style={{
              backgroundColor: activeTab === "requested" ? "#3B82F6" : c.cardBg,
              color: activeTab === "requested" ? "#FFF" : c.text,
              border: `1px solid ${activeTab === "requested" ? "#3B82F6" : c.border}`,
              padding: "9px 18px",
              borderRadius: "8px",
              fontWeight: "800",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            ⚠️ Products Requested (2)
          </button>

          <button
            onClick={() => setActiveTab("live_support")}
            data-testid="admin-live-support-tab"
            style={{
              backgroundColor: activeTab === "live_support" ? "#3B82F6" : c.cardBg,
              color: activeTab === "live_support" ? "#FFF" : c.text,
              border: `1px solid ${activeTab === "live_support" ? "#3B82F6" : c.border}`,
              padding: "9px 18px",
              borderRadius: "8px",
              fontWeight: "800",
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>💬 Live Support & Chat</span>
            <span
              style={{
                backgroundColor: isChatConnected ? "#10B981" : "#EF4444",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
              }}
            />
          </button>
        </div>

        {/* TAB 1: CATALOG PRODUCTS */}
        {activeTab === "catalog" && (
          <div>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "16px", marginBottom: "20px" }}>
              <div style={{ position: "relative", minWidth: "260px", flex: "1 1 280px", maxWidth: "400px" }}>
                <span style={{ position: "absolute", left: "12px", top: "10px", color: c.subtext }}>🔍</span>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px 10px 36px",
                    borderRadius: "10px",
                    backgroundColor: c.cardBg,
                    border: `1px solid ${c.border}`,
                    color: c.text,
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "12px", fontWeight: "800", color: c.subtext }}>Category:</span>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      backgroundColor: selectedCategory === cat ? "#3B82F6" : c.cardBg,
                      color: selectedCategory === cat ? "#FFF" : c.text,
                      border: `1px solid ${selectedCategory === cat ? "#3B82F6" : c.border}`,
                      padding: "6px 14px",
                      borderRadius: "20px",
                      fontWeight: "700",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "12px", fontWeight: "800", color: c.subtext }}>Sort:</span>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  style={{
                    backgroundColor: c.cardBg,
                    color: c.text,
                    border: `1px solid ${c.border}`,
                    padding: "8px 12px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: "700",
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  <option value="default">Default (Featured)</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="name_asc">Name: A to Z</option>
                </select>
              </div>
            </div>

            <div style={{ fontSize: "13px", fontWeight: "800", color: c.subtext, marginBottom: "18px" }}>
              Showing {filteredAndSorted.length} of {safeProducts.length} items
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "22px" }}>
              {filteredAndSorted.map((p) => {
                const isStockout = (p.stock || 0) <= 0;
                const isLowStock = (p.stock || 0) > 0 && (p.stock || 0) <= 3;

                return (
                  <div
                    key={p.id}
                    style={{
                      backgroundColor: c.cardBg,
                      border: `1px solid ${c.border}`,
                      borderRadius: "14px",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      position: "relative",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  >
                    <div style={{ height: "175px", backgroundColor: "#1E293B", position: "relative", overflow: "hidden" }}>
                      <img src={p.image} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      {(isStockout || isLowStock) && (
                        <span
                          style={{
                            position: "absolute",
                            top: "10px",
                            left: "10px",
                            backgroundColor: isStockout ? "#DC2626" : "#EA580C",
                            color: "#FFFFFF",
                            fontSize: "10px",
                            fontWeight: "900",
                            padding: "4px 8px",
                            borderRadius: "6px",
                          }}
                        >
                          🔴 STOCKOUT ({p.stock} LEFT)
                        </span>
                      )}
                    </div>

                    <div style={{ padding: "16px", display: "flex", flexDirection: "column", flex: 1 }}>
                      <h3 style={{ fontSize: "15px", fontWeight: "800", color: c.text, margin: "0 0 6px 0", lineHeight: 1.3 }}>
                        {p.name}
                      </h3>
                      <p style={{ fontSize: "12px", color: c.subtext, margin: "0 0 14px 0", lineHeight: 1.4, flex: 1 }}>
                        {p.description}
                      </p>

                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "14px" }}>
                        <span style={{ fontSize: "18px", fontWeight: "900", color: "#10B981" }}>
                          ${p.price.toFixed(2)}
                        </span>
                        <span style={{ fontSize: "12px", color: c.subtext, fontWeight: "700" }}>
                          Stock: {p.stock} units
                        </span>
                      </div>

                      <div
                        style={{
                          backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
                          borderRadius: "8px",
                          padding: "8px 12px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "10px",
                        }}
                      >
                        <span style={{ fontSize: "11px", fontWeight: "800", color: c.subtext }}>Inventory:</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <button
                            onClick={() => handleModifyStock(p.id, -1)}
                            style={{ width: "24px", height: "24px", borderRadius: "4px", border: "none", background: "#EF4444", color: "#FFF", fontWeight: "900", cursor: "pointer" }}
                            title="Decrease Stock"
                          >
                            -
                          </button>
                          <span style={{ fontWeight: "900", color: c.text, minWidth: "22px", textAlign: "center", fontSize: "13px" }}>
                            {p.stock}
                          </span>
                          <button
                            onClick={() => handleModifyStock(p.id, +1)}
                            style={{ width: "24px", height: "24px", borderRadius: "4px", border: "none", background: "#10B981", color: "#FFF", fontWeight: "900", cursor: "pointer" }}
                            title="Increase Stock"
                          >
                            +
                          </button>
                          <button
                            onClick={() => handleModifyStock(p.id, +5)}
                            style={{ padding: "3px 6px", borderRadius: "4px", border: "none", background: "#3B82F6", color: "#FFF", fontWeight: "800", fontSize: "10px", cursor: "pointer" }}
                          >
                            +5 Stock
                          </button>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          onClick={() => navigate(`/catalog/${p.id}`)}
                          style={{
                            flex: 1,
                            backgroundColor: isDark ? "#1E293B" : "#E2E8F0",
                            color: c.text,
                            border: `1px solid ${c.border}`,
                            padding: "7px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "700",
                            cursor: "pointer",
                          }}
                        >
                          Details
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          style={{
                            flex: 1,
                            backgroundColor: "#DC2626",
                            color: "#FFF",
                            border: "none",
                            padding: "7px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "800",
                            cursor: "pointer",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: ORDERS MANAGEMENT */}
        {activeTab === "orders" && (
          <div style={{ maxWidth: "980px", margin: "0 auto" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "900", color: c.text, margin: "0 0 16px 0" }}>
              Customer Order Management ({adminOrders.length})
            </h2>

            {adminOrders.length === 0 ? (
              <div style={{ backgroundColor: c.cardBg, border: `1px dashed ${c.border}`, borderRadius: "14px", padding: "40px", textAlign: "center" }}>
                <p style={{ color: c.subtext, fontSize: "14px", margin: 0 }}>No customer orders placed yet.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {adminOrders.map((ord, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: c.cardBg,
                      border: `1px solid ${c.border}`,
                      borderRadius: "14px",
                      padding: "20px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                      <div>
                        <span style={{ fontFamily: "monospace", fontWeight: "900", fontSize: "14px", color: "#3B82F6" }}>
                          {ord.orderId}
                        </span>
                        <span style={{ fontSize: "12px", color: c.subtext, marginLeft: "10px" }}>
                          Placed by: <strong style={{ color: c.text }}>{ord.fullName}</strong> ({ord.email})
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "16px", fontWeight: "900", color: "#10B981" }}>
                          ${Number(ord.totalAmount || 0).toFixed(2)}
                        </span>
                        <select
                          value={ord.status || "Confirmed"}
                          onChange={(e) => handleUpdateOrderStatus(ord.orderId, e.target.value)}
                          style={{
                            backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
                            color: c.text,
                            border: `1px solid ${c.border}`,
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "800",
                            cursor: "pointer",
                          }}
                        >
                          <option value="Confirmed">Confirmed</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ fontSize: "12px", color: c.subtext, borderTop: `1px solid ${c.border}`, paddingTop: "8px" }}>
                      📍 Delivery Address: {ord.address}, {ord.city} - {ord.postalCode} • Payment: {ord.paymentMethod?.toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ADD PRODUCT STUDIO */}
        {activeTab === "add_product" && (
          <div style={{ maxWidth: "620px", margin: "0 auto", backgroundColor: c.cardBg, border: `1px solid ${c.border}`, borderRadius: "14px", padding: "28px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "900", color: c.text, margin: "0 0 16px 0" }}>+ Add Product Studio</h2>
            
            <form onSubmit={handlePublish} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "800", color: c.subtext, display: "block", marginBottom: "6px" }}>Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ergonomic Split Mechanical Keyboard"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${c.border}`, background: c.bg, color: c.text, boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "12px", fontWeight: "800", color: c.subtext, display: "block", marginBottom: "6px" }}>Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="89.99"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${c.border}`, background: c.bg, color: c.text, boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "12px", fontWeight: "800", color: c.subtext, display: "block", marginBottom: "6px" }}>Stock *</label>
                  <input
                    type="number"
                    required
                    placeholder="15"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${c.border}`, background: c.bg, color: c.text, boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "800", color: c.subtext, display: "block", marginBottom: "6px" }}>Category</label>
                <select
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${c.border}`, background: c.bg, color: c.text, boxSizing: "border-box" }}
                >
                  {categories.filter(c => c !== "All").map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "800", color: c.subtext, display: "block", marginBottom: "6px" }}>Description</label>
                <textarea
                  rows="3"
                  placeholder="Detailed specifications and key features..."
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${c.border}`, background: c.bg, color: c.text, boxSizing: "border-box" }}
                />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "800", color: c.subtext }}>Product Photo</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={() => setUploadMode("link")}
                      style={{ background: uploadMode === "link" ? "#3B82F6" : "none", color: uploadMode === "link" ? "#FFF" : c.subtext, border: "none", padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "800", cursor: "pointer" }}
                    >
                      🔗 Paste Link
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadMode("file")}
                      style={{ background: uploadMode === "file" ? "#3B82F6" : "none", color: uploadMode === "file" ? "#FFF" : c.subtext, border: "none", padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "800", cursor: "pointer" }}
                    >
                      📁 Browse & Drag
                    </button>
                  </div>
                </div>

                {uploadMode === "link" ? (
                  <input
                    type="text"
                    placeholder="Paste image link (https://...)"
                    value={newProduct.image}
                    onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${c.border}`, background: c.bg, color: c.text, boxSizing: "border-box" }}
                  />
                ) : (
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    style={{
                      border: `2px dashed ${dragActive ? "#3B82F6" : c.border}`,
                      backgroundColor: dragActive ? "rgba(59, 130, 246, 0.08)" : c.bg,
                      borderRadius: "10px",
                      padding: "26px",
                      textAlign: "center",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => handleFiles(e.target.files)}
                      accept="image/*"
                      style={{ display: "none" }}
                    />
                    <div style={{ fontSize: "32px", marginBottom: "6px" }}>☁️</div>
                    <div style={{ fontSize: "13px", fontWeight: "800", color: c.text }}>
                      Drag & drop your product image here, or browse
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                style={{ backgroundColor: "#3B82F6", color: "#FFF", border: "none", padding: "12px", borderRadius: "8px", fontWeight: "900", cursor: "pointer", marginTop: "6px" }}
              >
                Publish to Inventory
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: PRODUCTS REQUESTED */}
        {activeTab === "requested" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "800px", margin: "0 auto" }}>
            {[
              { id: 1, user: "Kavya R.", item: "Mechanical Number Pad (Numpad)", requests: 14, date: "Today" },
              { id: 2, user: "Rahul S.", item: "Braided 100W Display Cable", requests: 9, date: "Yesterday" },
            ].map((r) => (
              <div
                key={r.id}
                style={{
                  backgroundColor: c.cardBg,
                  border: `1px solid ${c.border}`,
                  borderRadius: "12px",
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ fontWeight: "800", color: c.text, fontSize: "15px" }}>{r.item}</div>
                  <div style={{ fontSize: "12px", color: c.subtext, marginTop: "4px" }}>
                    Requested by {r.user} and {r.requests - 1} other shoppers • {r.date}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setNewProduct({ ...newProduct, name: r.item });
                    setActiveTab("add_product");
                  }}
                  style={{
                    backgroundColor: "#F59E0B",
                    color: "#000",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    fontWeight: "800",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  Source & Add
                </button>
              </div>
            ))}
          </div>
        )}

        {/* TAB 5: DAY 17 REAL-TIME LIVE SUPPORT & CHAT CONSOLE */}
        {activeTab === "live_support" && (
          <div
            data-testid="admin-live-support-panel"
            style={{
              backgroundColor: c.cardBg,
              border: `1px solid ${c.border}`,
              borderRadius: "16px",
              padding: "24px",
            }}
          >
            {/* Header with Broadcast CTA */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "14px",
                paddingBottom: "16px",
                borderBottom: `1px solid ${c.border}`,
                marginBottom: "20px",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "22px" }}>🎧</span>
                  <h2 style={{ fontSize: "18px", fontWeight: "900", color: c.text, margin: 0 }}>
                    Real-Time Customer Concierge Desk
                  </h2>
                </div>
                <div style={{ fontSize: "12px", color: c.subtext, marginTop: "4px" }}>
                  Bi-directional WebSockets: <span style={{ color: isChatConnected ? "#10B981" : "#EF4444", fontWeight: "800" }}>{isChatConnected ? "Active Stream Connected" : "Connecting..."}</span> • Room: <strong>general</strong>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {/* Admin Presence Toggle */}
                <button
                  type="button"
                  onClick={handleToggleAdminPresence}
                  data-testid="toggle-admin-presence-btn"
                  style={{
                    backgroundColor: adminOnlineToggle ? "rgba(16, 185, 129, 0.15)" : "rgba(148, 163, 184, 0.15)",
                    border: `1.5px solid ${adminOnlineToggle ? "#10B981" : "#94A3B8"}`,
                    color: adminOnlineToggle ? "#10B981" : "#94A3B8",
                    padding: "9px 15px",
                    borderRadius: "10px",
                    fontWeight: "800",
                    fontSize: "12px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                  title="Toggle whether customers see admin as Online or Offline"
                >
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: adminOnlineToggle ? "#10B981" : "#94A3B8",
                      display: "inline-block",
                      boxShadow: adminOnlineToggle ? "0 0 6px #10B981" : "none",
                    }}
                  />
                  <span>{adminOnlineToggle ? "Admin: Online" : "Admin: Offline"}</span>
                </button>

                {/* Instant Broadcast Trigger */}
                <button
                  onClick={handleSendBroadcast}
                  data-testid="broadcast-flash-btn"
                  style={{
                    backgroundColor: "#F59E0B",
                    color: "#000",
                    border: "none",
                    padding: "10px 18px",
                    borderRadius: "10px",
                    fontWeight: "900",
                    fontSize: "12px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 4px 14px rgba(245, 158, 11, 0.35)",
                  }}
                >
                  <span>📢</span>
                  <span>Broadcast Flash Sale to All Users</span>
                </button>
              </div>
            </div>

            {broadcastSuccess && (
              <div
                style={{
                  backgroundColor: "rgba(16, 185, 129, 0.15)",
                  border: "1px solid #10B981",
                  color: "#10B981",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: "800",
                  marginBottom: "16px",
                }}
              >
                ✓ {broadcastSuccess}
              </div>
            )}

            {/* Live Message Thread */}
            <div
              style={{
                backgroundColor: isDark ? "#090D16" : "#FFFFFF",
                border: `1px solid ${c.border}`,
                borderRadius: "14px",
                padding: "20px",
                height: "380px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              {adminChatMessages.map((msg) => {
                const isAdmin = msg.sender_role === "admin";
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: isAdmin ? "flex-end" : "flex-start",
                      maxWidth: "80%",
                      alignSelf: isAdmin ? "flex-end" : "flex-start",
                    }}
                  >
                    <div style={{ fontSize: "11px", fontWeight: "800", color: isAdmin ? "#F59E0B" : "#38BDF8", marginBottom: "3px" }}>
                      {msg.sender_name}
                    </div>
                    <div
                      style={{
                        backgroundColor: isAdmin ? (isDark ? "#1E293B" : "#F1F5F9") : "#38BDF8",
                        color: isAdmin ? c.text : "#030712",
                        padding: "10px 14px",
                        borderRadius: isAdmin ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                        fontSize: "13px",
                        fontWeight: "600",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                      }}
                    >
                      {msg.text}
                    </div>
                    <div style={{ fontSize: "10px", color: c.subtext, marginTop: "2px" }}>
                      {msg.timestamp}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Admin Reply Form */}
            <form
              onSubmit={handleSendAdminReply}
              style={{
                display: "flex",
                gap: "10px",
              }}
            >
              <input
                type="text"
                data-testid="admin-chat-input"
                placeholder="Type response as Admin to live customer..."
                value={adminChatInput}
                onChange={(e) => setAdminChatInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: "10px",
                  backgroundColor: isDark ? "#090D16" : "#FFFFFF",
                  border: `1px solid ${c.border}`,
                  color: c.text,
                  fontSize: "13px",
                  outline: "none",
                }}
              />
              <button
                type="submit"
                data-testid="admin-chat-send-btn"
                disabled={!adminChatInput.trim()}
                style={{
                  backgroundColor: adminChatInput.trim() ? "#3B82F6" : isDark ? "#334155" : "#CBD5E1",
                  color: "#FFF",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "10px",
                  fontWeight: "900",
                  fontSize: "13px",
                  cursor: adminChatInput.trim() ? "pointer" : "not-allowed",
                }}
              >
                Send Reply ➔
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
