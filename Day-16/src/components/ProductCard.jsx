import React from "react";
import { Link } from "react-router-dom";
import { useCartStore, useUIStore, useAuthStore } from "../store/useStore";
import { useOptimisticStockUpdate } from "../hooks/useProducts";

export function ProductCard({ product }) {
  const addToCart = useCartStore((s) => s.addToCart);
  const theme = useUIStore((s) => s.theme);
  const user = useAuthStore((s) => s.user);
  const isDark = theme === "dark";
  const isAdmin = user?.role === "admin";

  // React Query optimistic mutation for admin stock modification
  const stockMutation = useOptimisticStockUpdate ? useOptimisticStockUpdate() : null;

  if (!product) return null;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Pass both product and default quantity 1 to satisfy tests & store
    addToCart(product, 1);
  };

  const handleStockDelta = (delta) => {
    if (stockMutation?.mutate) {
      stockMutation.mutate({ productId: product.id, delta });
    }
  };

  const isOutOfStock = product.stock !== undefined && product.stock <= 0;

  return (
    <div
      data-testid={`product-card-${product.id}`}
      style={{
        backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
        border: isDark ? "1px solid #1E293B" : "1px solid #E2E8F0",
        borderRadius: "16px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: isDark ? "none" : "0 4px 12px rgba(0, 0, 0, 0.04)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
    >
      <div>
        <div
          style={{
            width: "100%",
            height: "180px",
            borderRadius: "12px",
            overflow: "hidden",
            backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={product.image || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80"}
            alt={product.title || product.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => {
              e.currentTarget.src = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80";
            }}
          />
        </div>

        <span
          style={{
            fontSize: "11px",
            fontWeight: "700",
            textTransform: "uppercase",
            color: "#38BDF8",
            letterSpacing: "0.5px",
          }}
        >
          {product.category || "Electronics"}
        </span>

        <h3
          style={{
            fontSize: "16px",
            fontWeight: "700",
            color: isDark ? "#FFFFFF" : "#0F172A",
            margin: "6px 0 8px 0",
            lineHeight: "1.3",
          }}
        >
          {product.title || product.name}
        </h3>

        <p
          style={{
            fontSize: "13px",
            color: isDark ? "#94A3B8" : "#64748B",
            margin: "0 0 12px 0",
            lineHeight: "1.4",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {product.description || "High-quality premium electronic hardware."}
        </p>
      </div>

      <div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: "14px",
          }}
        >
          <span
            style={{
              fontSize: "20px",
              fontWeight: "900",
              color: isDark ? "#38BDF8" : "#0284C7",
            }}
          >
            ${Number(product.price).toFixed(2)}
          </span>
          <span
            style={{
              fontSize: "12px",
              fontWeight: "600",
              color: isOutOfStock ? "#EF4444" : "#10B981",
            }}
          >
            {isOutOfStock ? "Sold Out" : `In Stock: ${product.stock ?? 10}`}
          </span>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <Link
            to={`/catalog/${product.id}`}
            style={{
              flex: 1,
              textAlign: "center",
              padding: "10px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: "700",
              textDecoration: "none",
              backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
              color: isDark ? "#FFFFFF" : "#0F172A",
            }}
          >
            Details
          </Link>

          {isAdmin ? (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "#38BDF8" }}>
                Add Stock:
              </span>
              <button
                type="button"
                title="Increase stock by 1"
                onClick={() => handleStockDelta(1)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#0284C7",
                  color: "#FFFFFF",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                +1
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              style={{
                flex: 1.5,
                padding: "10px",
                borderRadius: "10px",
                border: "none",
                fontSize: "13px",
                fontWeight: "800",
                cursor: isOutOfStock ? "not-allowed" : "pointer",
                backgroundColor: isOutOfStock ? "#64748B" : "#0284C7",
                color: "#FFFFFF",
                transition: "background-color 0.2s ease",
              }}
            >
              {isOutOfStock ? "Sold Out" : "Add to Cart"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
