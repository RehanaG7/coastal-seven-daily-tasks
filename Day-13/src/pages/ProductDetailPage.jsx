import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { productService } from "../api/productService";
import { useStore } from "../context/StoreContext";
import { useAuth } from "../context/AuthContext";

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { inventory, addToCart, theme } = useStore();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const isDark = theme === "dark";

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const data = await productService.getById(id);
        if (data) {
          setProduct({
            ...data,
            title: data.title || data.name,
            name: data.title || data.name,
          });
          setLoading(false);
          return;
        }
      } catch (err) {
        // Fallback to local inventory if API is offline or not synced
      }

      // Fallback lookup from StoreContext inventory
      const found = (inventory || []).find((item) => String(item.id) === String(id));
      if (found) {
        setProduct({
          ...found,
          title: found.title || found.name,
          name: found.title || found.name,
        });
      }
      setLoading(false);
    };

    fetchProduct();
  }, [id, inventory]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product);
    setMessage(`Added "${product.title || product.name}" to cart! 🛒`);
    setTimeout(() => setMessage(""), 3000);
  };

  const c = {
    bg: isDark ? "#06080F" : "#F8FAFC",
    cardBg: isDark ? "#0F1420" : "#FFFFFF",
    border: isDark ? "#1E2738" : "#E2E8F0",
    text: isDark ? "#FFFFFF" : "#0F172A",
    subtext: isDark ? "#94A3B8" : "#64748B",
    accent: "#F59E0B",
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: c.bg, minHeight: "80vh", padding: "40px", color: c.text, textAlign: "center" }}>
        <p style={{ fontSize: "16px", fontWeight: "600" }}>Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ backgroundColor: c.bg, minHeight: "80vh", padding: "40px", color: c.text, textAlign: "center" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#EF4444" }}>Product Not Found</h2>
        <p style={{ color: c.subtext, marginTop: "8px" }}>Could not locate product with ID: {id}</p>
        <Link to="/catalog" style={{ display: "inline-block", marginTop: "16px", color: "#3B82F6", textDecoration: "none", fontWeight: "700" }}>
          &larr; Back to Catalog
        </Link>
      </div>
    );
  }

  const title = product.title || product.name;
  const currentStock = Number(product.stock !== undefined ? product.stock : 0);
  const isOutOfStock = currentStock === 0;

  return (
    <div style={{ backgroundColor: c.bg, minHeight: "calc(100vh - 64px)", padding: "32px 24px", color: c.text, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: "1050px", margin: "0 auto" }}>
        
        {/* Breadcrumb / Back Link */}
        <Link to="/catalog" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#3B82F6", textDecoration: "none", fontWeight: "700", fontSize: "14px", marginBottom: "20px" }}>
          <span>&larr;</span> Back to Catalog
        </Link>

        {message && (
          <div style={{ marginBottom: "20px", padding: "12px 18px", backgroundColor: "#10B98120", border: "1px solid #10B98180", color: "#10B981", borderRadius: "10px", fontWeight: "700", fontSize: "14px" }}>
            {message}
          </div>
        )}

        <div style={{
          backgroundColor: c.cardBg,
          border: `1px solid ${c.border}`,
          borderRadius: "16px",
          padding: "32px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "36px",
          alignItems: "center"
        }}>
          {/* Product Image */}
          <div style={{ textAlign: "center", backgroundColor: isDark ? "#070A10" : "#F1F5F9", borderRadius: "12px", padding: "20px", border: `1px solid ${c.border}` }}>
            <img
              src={product.image_url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"}
              alt={title}
              style={{ maxHeight: "360px", maxWidth: "100%", objectFit: "contain", borderRadius: "8px" }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500";
              }}
            />
          </div>

          {/* Details Section */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", backgroundColor: "#3B82F620", color: "#3B82F6", padding: "4px 10px", borderRadius: "6px" }}>
                {product.category || "General"}
              </span>
              <span style={{ fontSize: "12px", color: c.subtext, fontWeight: "600" }}>
                ID: {product.id}
              </span>
            </div>

            <h1 style={{ fontSize: "28px", fontWeight: "900", margin: "0", color: c.text, lineHeight: 1.2 }}>
              {title}
            </h1>

            <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
              <span style={{ fontSize: "32px", fontWeight: "900", color: "#10B981" }}>
                ${Number(product.price || 0).toFixed(2)}
              </span>
              <span style={{ fontSize: "13px", fontWeight: "700", color: isOutOfStock ? "#EF4444" : "#10B981" }}>
                {isOutOfStock ? "🔴 Out of Stock" : `🟢 In Stock (${currentStock} available)`}
              </span>
            </div>

            <p style={{ fontSize: "14px", lineHeight: "1.6", color: c.subtext, margin: "0" }}>
              {product.description || "High-performance item engineered for exceptional quality and reliability."}
            </p>

            <div style={{ display: "flex", gap: "14px", marginTop: "12px" }}>
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                style={{
                  flex: 1,
                  backgroundColor: isOutOfStock ? "#6B7280" : "#10B981",
                  color: "#FFFFFF",
                  border: "none",
                  padding: "14px 20px",
                  borderRadius: "10px",
                  fontWeight: "800",
                  fontSize: "14px",
                  cursor: isOutOfStock ? "not-allowed" : "pointer",
                  transition: "opacity 0.2s",
                }}
              >
                {isOutOfStock ? "Out of Stock" : "Add to Cart 🛒"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
