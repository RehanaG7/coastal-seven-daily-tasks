import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStore, INITIAL_PRODUCTS } from "../context/StoreContext";

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, addToCart, theme, user } = useStore();
  const isDark = theme === "dark";

  const [activeTab, setActiveTab] = useState("specs");
  const [selectedQty, setSelectedQty] = useState(1);

  // Parse ID as both number and string to avoid type-mismatch bugs
  const targetId = Number(id);
  const allProducts = Array.isArray(products) && products.length > 0 ? products : (INITIAL_PRODUCTS || []);
  
  const product = allProducts.find(
    (p) => p.id === targetId || String(p.id) === String(id)
  );

  const c = {
    bg: isDark ? "#080C14" : "#F8FAFC",
    cardBg: isDark ? "#0F172A" : "#FFFFFF",
    border: isDark ? "#1E293B" : "#E2E8F0",
    text: isDark ? "#F8FAFB" : "#0F172A",
    subtext: isDark ? "#94A3B8" : "#64748B",
  };

  if (!product) {
    return (
      <div
        style={{
          minHeight: "80vh",
          backgroundColor: c.bg,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ fontSize: "54px", marginBottom: "16px" }}>🔍</div>
        <h2 style={{ color: c.text, fontSize: "22px", fontWeight: "900", margin: "0 0 8px 0" }}>
          Product Not Found
        </h2>
        <p style={{ color: c.subtext, fontSize: "14px", margin: "0 0 20px 0" }}>
          Could not locate product with ID: {id}
        </p>
        <button
          onClick={() => navigate("/catalog")}
          style={{
            backgroundColor: "#3B82F6",
            color: "#FFF",
            border: "none",
            padding: "10px 20px",
            borderRadius: "8px",
            fontWeight: "800",
            cursor: "pointer",
          }}
        >
          ← Back to Catalog
        </button>
      </div>
    );
  }

  const isStockout = (product.stock || 0) <= 0;
  const isLowStock = (product.stock || 0) > 0 && (product.stock || 0) <= 3;
  const isAdmin = user?.role === "admin" || localStorage.getItem("user_role") === "admin";

  const handleAddToCart = () => {
    for (let i = 0; i < selectedQty; i++) {
      addToCart(product);
    }
  };

  return (
    <div style={{ backgroundColor: c.bg, minHeight: "100vh", padding: "32px 24px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: "1140px", margin: "0 auto" }}>
        
        {/* Navigation Breadcrumb */}
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "none",
            border: "none",
            color: "#3B82F6",
            fontSize: "13px",
            fontWeight: "800",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "24px",
            padding: 0,
          }}
        >
          ← Back
        </button>

        {/* Product Details Container */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "36px",
            backgroundColor: c.cardBg,
            border: `1px solid ${c.border}`,
            borderRadius: "16px",
            padding: "32px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
          }}
        >
          {/* Left Column: Image */}
          <div>
            <div
              style={{
                width: "100%",
                height: "380px",
                backgroundColor: "#1E293B",
                borderRadius: "12px",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <img
                src={product.image}
                alt={product.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              {(isStockout || isLowStock) && (
                <span
                  style={{
                    position: "absolute",
                    top: "14px",
                    left: "14px",
                    backgroundColor: isStockout ? "#DC2626" : "#EA580C",
                    color: "#FFFFFF",
                    fontSize: "11px",
                    fontWeight: "900",
                    padding: "5px 10px",
                    borderRadius: "6px",
                    letterSpacing: "0.5px",
                  }}
                >
                  🔴 {isStockout ? "STOCKOUT (0 LEFT)" : `LOW STOCK (${product.stock} LEFT)`}
                </span>
              )}
            </div>

            {/* Badges bar */}
            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              <div
                style={{
                  flex: 1,
                  backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
                  padding: "10px",
                  borderRadius: "8px",
                  textAlign: "center",
                  fontSize: "11px",
                  fontWeight: "800",
                  color: c.text,
                }}
              >
                ⚡ 15-Min Express Dispatch
              </div>
              <div
                style={{
                  flex: 1,
                  backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
                  padding: "10px",
                  borderRadius: "8px",
                  textAlign: "center",
                  fontSize: "11px",
                  fontWeight: "800",
                  color: "#10B981",
                }}
              >
                ✔ 100% Genuine Verified
              </div>
            </div>
          </div>

          {/* Right Column: Info & Actions */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "12px", fontWeight: "800", color: "#3B82F6", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>
              {product.category || "General"}
            </div>

            <h1 style={{ fontSize: "26px", fontWeight: "900", color: c.text, margin: "0 0 12px 0", lineHeight: 1.3 }}>
              {product.name}
            </h1>

            {/* Ratings */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <span style={{ color: "#F59E0B", fontSize: "14px" }}>⭐⭐⭐⭐⭐</span>
              <span style={{ fontSize: "12px", fontWeight: "800", color: c.text }}>4.9</span>
              <span style={{ fontSize: "12px", color: c.subtext }}>(128 customer ratings)</span>
            </div>

            {/* Price */}
            <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "20px" }}>
              <span style={{ fontSize: "32px", fontWeight: "900", color: "#10B981" }}>
                ${product.price.toFixed(2)}
              </span>
              <span style={{ fontSize: "14px", color: c.subtext }}>
                (Inclusive of all automated fulfillment taxes)
              </span>
            </div>

            {/* Description */}
            <p style={{ fontSize: "14px", color: c.subtext, lineHeight: 1.6, margin: "0 0 24px 0" }}>
              {product.description}
            </p>

            {/* Tab switch for details/specs */}
            <div style={{ display: "flex", gap: "10px", borderBottom: `1px solid ${c.border}`, marginBottom: "16px" }}>
              <button
                onClick={() => setActiveTab("specs")}
                style={{
                  background: "none",
                  border: "none",
                  borderBottom: activeTab === "specs" ? "2px solid #3B82F6" : "none",
                  color: activeTab === "specs" ? "#3B82F6" : c.subtext,
                  fontWeight: "800",
                  fontSize: "13px",
                  padding: "8px 12px",
                  cursor: "pointer",
                }}
              >
                Specifications
              </button>
              <button
                onClick={() => setActiveTab("reviews")}
                style={{
                  background: "none",
                  border: "none",
                  borderBottom: activeTab === "reviews" ? "2px solid #3B82F6" : "none",
                  color: activeTab === "reviews" ? "#3B82F6" : c.subtext,
                  fontWeight: "800",
                  fontSize: "13px",
                  padding: "8px 12px",
                  cursor: "pointer",
                }}
              >
                Verified Reviews (4)
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === "specs" && (
              <div style={{ fontSize: "13px", color: c.subtext, display: "flex", flexDirection: "column", gap: "6px", marginBottom: "24px" }}>
                <div>• <strong>Warranty:</strong> 1 Year Comprehensive Replacement</div>
                <div>• <strong>Dispatch Hub:</strong> Automated Local Micro-Warehouse</div>
                <div>• <strong>Available Stock:</strong> {product.stock} units ready in bin</div>
              </div>
            )}

            {activeTab === "reviews" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px", maxHeight: "140px", overflowY: "auto" }}>
                <div style={{ fontSize: "12px", padding: "8px", borderRadius: "6px", backgroundColor: isDark ? "#1E293B" : "#F1F5F9" }}>
                  <span style={{ fontWeight: "800", color: c.text }}>Kavya R. (⭐⭐⭐⭐⭐):</span> Arrived in 14 mins flat! Premium build.
                </div>
                <div style={{ fontSize: "12px", padding: "8px", borderRadius: "6px", backgroundColor: isDark ? "#1E293B" : "#F1F5F9" }}>
                  <span style={{ fontWeight: "800", color: c.text }}>Rahul S. (⭐⭐⭐⭐):</span> Seamless connection, exact specs as advertised.
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              {!isAdmin && !isStockout && (
                <div style={{ display: "flex", alignItems: "center", border: `1px solid ${c.border}`, borderRadius: "8px", overflow: "hidden" }}>
                  <button
                    onClick={() => setSelectedQty(Math.max(1, selectedQty - 1))}
                    style={{ width: "36px", height: "42px", background: "none", border: "none", color: c.text, fontWeight: "900", cursor: "pointer" }}
                  >
                    -
                  </button>
                  <span style={{ width: "36px", textAlign: "center", fontWeight: "900", color: c.text, fontSize: "14px" }}>
                    {selectedQty}
                  </span>
                  <button
                    onClick={() => setSelectedQty(Math.min(product.stock || 10, selectedQty + 1))}
                    style={{ width: "36px", height: "42px", background: "none", border: "none", color: c.text, fontWeight: "900", cursor: "pointer" }}
                  >
                    +
                  </button>
                </div>
              )}

              {!isAdmin ? (
                isStockout ? (
                  <button
                    onClick={() => alert(`Restock request registered for "${product.name}". You will receive an alert!`)}
                    style={{
                      flex: 1,
                      backgroundColor: "#DC2626",
                      color: "#FFFFFF",
                      border: "none",
                      padding: "12px 24px",
                      borderRadius: "8px",
                      fontWeight: "900",
                      fontSize: "14px",
                      cursor: "pointer",
                    }}
                  >
                    🔔 Request Restock Notification
                  </button>
                ) : (
                  <button
                    onClick={handleAddToCart}
                    style={{
                      flex: 1,
                      backgroundColor: "#F59E0B",
                      color: "#000000",
                      border: "none",
                      padding: "12px 24px",
                      borderRadius: "8px",
                      fontWeight: "900",
                      fontSize: "14px",
                      cursor: "pointer",
                      boxShadow: "0 4px 15px rgba(245, 158, 11, 0.35)",
                    }}
                  >
                    🛒 Add {selectedQty > 1 ? `${selectedQty} Items` : ""} to Cart
                  </button>
                )
              ) : (
                <div style={{ fontSize: "13px", fontWeight: "800", color: "#3B82F6" }}>
                  🔒 Admin Mode: Inventory and orders managed via Admin Console.
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
