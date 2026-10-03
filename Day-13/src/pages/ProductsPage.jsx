import React, { useState, useMemo } from "react";
import { useStore } from "../context/StoreContext";
import { useNavigate } from "react-router-dom";

export default function ProductsPage() {
  const { products, addToCart, theme } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortOption, setSortOption] = useState("default");
  const navigate = useNavigate();
  const isDark = theme === "dark";

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

  const c = {
    bg: isDark ? "#080C14" : "#F8FAFC",
    cardBg: isDark ? "#0F172A" : "#FFFFFF",
    border: isDark ? "#1E293B" : "#E2E8F0",
    text: isDark ? "#F8FAFC" : "#0F172A",
    subtext: isDark ? "#94A3B8" : "#64748B",
  };

  return (
    <div style={{ backgroundColor: c.bg, minHeight: "100vh", padding: "20px 24px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: "1240px", margin: "0 auto" }}>
        
        {/* Search, Categories, and Sort Controls */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "16px", marginBottom: "20px" }}>
          
          {/* Search */}
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

          {/* Categories */}
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

          {/* Sort Dropdown */}
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

        {/* Counter */}
        <div style={{ fontSize: "13px", fontWeight: "800", color: c.subtext, marginBottom: "18px" }}>
          Showing {filteredAndSorted.length} of {safeProducts.length} items
        </div>

        {/* Identical Structured Product Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "22px",
          }}
        >
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
                {/* Product Image & Badges */}
                <div style={{ height: "175px", backgroundColor: "#1E293B", position: "relative", overflow: "hidden" }}>
                  <img
                    src={p.image}
                    alt={p.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
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
                        letterSpacing: "0.5px",
                      }}
                    >
                      🔴 STOCKOUT ({p.stock} LEFT)
                    </span>
                  )}
                </div>

                {/* Content */}
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

                  {/* Action Buttons */}
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => navigate(`/catalog/${p.id}`)}
                      style={{
                        flex: 1,
                        backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
                        color: c.text,
                        border: `1px solid ${c.border}`,
                        padding: "8px 12px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: "700",
                        cursor: "pointer",
                      }}
                    >
                      View Details
                    </button>

                    {isStockout ? (
                      <button
                        onClick={() => alert(`Restock requested for ${p.name}`)}
                        style={{
                          flex: 1,
                          backgroundColor: "#EF4444",
                          color: "#FFF",
                          border: "none",
                          padding: "8px 12px",
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: "800",
                          cursor: "pointer",
                        }}
                      >
                        🔔 Request Restock
                      </button>
                    ) : (
                      <button
                        onClick={() => addToCart(p)}
                        style={{
                          flex: 1,
                          backgroundColor: "#F59E0B",
                          color: "#000",
                          border: "none",
                          padding: "8px 12px",
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: "900",
                          cursor: "pointer",
                        }}
                      >
                        + Add to Cart
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
