import React, { useState, useMemo, useRef } from "react";
import { useStore } from "../context/StoreContext";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const { products, setProducts, theme } = useStore();
  const navigate = useNavigate();
  const isDark = theme === "dark";

  const [activeTab, setActiveTab] = useState("catalog"); // "catalog" | "add_product" | "requested"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortOption, setSortOption] = useState("default");

  // Reviews modal state
  const [reviewModalProduct, setReviewModalProduct] = useState(null);

  // Add Product Studio state
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    stock: "",
    category: "Peripherals",
    image: "",
    description: "",
  });
  const [uploadMode, setUploadMode] = useState("link"); // "link" | "file"
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const safeProducts = Array.isArray(products) && products.length > 0 ? products : [];
  const categories = ["All", "Electronics", "Peripherals", "Accessories"];

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

  // Stock Adjustment Handlers
  const handleModifyStock = (id, delta) => {
    setProducts(
      safeProducts.map((p) => (p.id === id ? { ...p, stock: Math.max(0, (p.stock || 0) + delta) } : p))
    );
  };

  // Delete Product Handler
  const handleDeleteProduct = (id, name) => {
    if (window.confirm(`Are you sure you want to permanently delete "${name}" from inventory?`)) {
      setProducts(safeProducts.filter((p) => p.id !== id));
    }
  };

  // Image Upload Handlers
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

  const handlePublish = (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) {
      alert("Please provide product name and price.");
      return;
    }
    const created = {
      id: Date.now(),
      name: newProduct.name,
      price: parseFloat(newProduct.price),
      stock: parseInt(newProduct.stock || "0", 10),
      category: newProduct.category,
      image: newProduct.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
      description: newProduct.description || "Admin catalog addition.",
    };
    setProducts([created, ...safeProducts]);
    alert(`Product "${created.name}" published to catalog!`);
    setNewProduct({ name: "", price: "", stock: "", category: "Peripherals", image: "", description: "" });
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
        
        {/* Admin Navigation Controls */}
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
            ⚠ Products Requested (2)
          </button>
        </div>

        {/* TAB 1: EXACT MATCH CATALOG WITH ADMIN MANAGEMENT */}
        {activeTab === "catalog" && (
          <div>
            {/* Search, Categories, Sort */}
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

            {/* Product Cards Mirroring User UI */}
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

                      {/* Stock Adjustment Controls */}
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

                      {/* Actions: View Details, Reviews, Delete */}
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
                          onClick={() => setReviewModalProduct(p)}
                          style={{
                            flex: 1,
                            backgroundColor: "#F59E0B",
                            color: "#000",
                            border: "none",
                            padding: "7px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "800",
                            cursor: "pointer",
                          }}
                        >
                          ⭐ Reviews
                        </button>

                        <button
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          style={{
                            backgroundColor: "rgba(239, 68, 68, 0.15)",
                            color: "#EF4444",
                            border: "1px solid rgba(239, 68, 68, 0.4)",
                            padding: "7px 10px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "800",
                            cursor: "pointer",
                          }}
                          title="Delete Product"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: ADD PRODUCT STUDIO (DRAG & DROP, BROWSE, LINK) */}
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
                  <option value="Peripherals">Peripherals</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Accessories">Accessories</option>
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

              {/* Photo Upload: Link, Browse, Drag & Drop */}
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
                    <div style={{ fontSize: "11px", color: c.subtext, marginTop: "4px" }}>
                      Supports PNG, JPG, WebP
                    </div>
                  </div>
                )}

                {newProduct.image && (
                  <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "10px", padding: "8px", borderRadius: "8px", backgroundColor: c.bg, border: `1px solid ${c.border}` }}>
                    <img src={newProduct.image} alt="Preview" style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "6px" }} />
                    <span style={{ fontSize: "12px", color: "#10B981", fontWeight: "800" }}>✔ Image ready for catalog publish</span>
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

        {/* TAB 3: PRODUCTS REQUESTED */}
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

        {/* REVIEWS MODAL */}
        {reviewModalProduct && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 99999,
              backgroundColor: "rgba(0,0,0,0.75)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              backdropFilter: "blur(4px)",
            }}
          >
            <div style={{ width: "100%", maxWidth: "480px", backgroundColor: c.cardBg, border: `1px solid ${c.border}`, borderRadius: "14px", padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ margin: 0, color: c.text, fontSize: "16px", fontWeight: "900" }}>
                  Customer Reviews: {reviewModalProduct.name}
                </h3>
                <button onClick={() => setReviewModalProduct(null)} style={{ background: "none", border: "none", color: c.text, fontSize: "18px", cursor: "pointer" }}>✕</button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "300px", overflowY: "auto" }}>
                {[
                  { user: "Kavya", rating: "⭐⭐⭐⭐⭐", comment: "Outstanding build quality and delivered in under 15 minutes." },
                  { user: "Rahul S.", rating: "⭐⭐⭐⭐", comment: "Smooth switches, lighting presets are great." },
                ].map((rev, i) => (
                  <div key={i} style={{ padding: "10px", backgroundColor: c.bg, borderRadius: "8px", border: `1px solid ${c.border}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: "800", color: c.text }}>
                      <span>{rev.user}</span>
                      <span>{rev.rating}</span>
                    </div>
                    <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: c.subtext }}>{rev.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
