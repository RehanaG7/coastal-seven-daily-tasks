import React, { useState, useRef, memo } from "react";
import { Link } from "react-router-dom";
import { useCartStore, useAuthStore, useUIStore } from "../store/useStore";
import { useOptimisticStockUpdate } from "../hooks/useProducts";
import { ProductCardProps, TiltState, CartStoreState } from "../types";

export const ProductCard: React.FC<ProductCardProps> = memo(({ product, onAddToCart }) => {
  const addToCartStore = useCartStore((s: CartStoreState) => s.addToCart);
  const toggleWishlist = useCartStore((s: CartStoreState) => s.toggleWishlist);
  const isWishlisted = useCartStore((s: CartStoreState) => s.isWishlisted(product.id));

  const user = useAuthStore((s: any) => s.user);
  const isAdmin = user?.role === "admin";
  const theme = useUIStore((s: any) => s.theme);
  const isDark = theme === "dark";

  const stockMutation = useOptimisticStockUpdate() as any;

  const [tilt, setTilt] = useState<TiltState>({
    rotX: 0,
    rotY: 0,
    glareX: 50,
    glareY: 50,
    isHovered: false,
  });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rotX = -((y - rect.height / 2) / (rect.height / 2)) * 14;
    const rotY = ((x - rect.width / 2) / (rect.width / 2)) * 14;
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    setTilt({ rotX, rotY, glareX, glareY, isHovered: true });
  };

  const handleMouseLeave = () => {
    setTilt({ rotX: 0, rotY: 0, glareX: 50, glareY: 50, isHovered: false });
  };

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product, 1);
    } else {
      addToCartStore(product, 1);
    }
  };

  const isLowStock = product.stock > 0 && product.stock <= 3;
  const isOutOfStock = product.stock <= 0;

  const cardBackground = isDark ? "#0F172A" : "#FFFFFF";
  const textColor = isDark ? "#F8FAFC" : "#0F172A";
  const borderColor = isDark ? "#1E293B" : "#E2E8F0";

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      data-testid={`product-card-${product.id}`}
      style={{
        backgroundColor: cardBackground,
        border: `1px solid ${borderColor}`,
        borderRadius: "14px",
        overflow: "hidden",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        transform: tilt.isHovered
          ? `perspective(800px) rotateX(${tilt.rotX}deg) rotateY(${tilt.rotY}deg) scale3d(1.02, 1.02, 1.02)`
          : "perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
        transition: tilt.isHovered ? "transform 0.08s ease-out" : "transform 0.3s ease",
        boxShadow: tilt.isHovered
          ? "0 12px 24px -10px rgba(0, 0, 0, 0.3)"
          : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      }}
    >
      <div style={{ position: "relative", height: "180px", overflow: "hidden", backgroundColor: "#1E293B" }}>
        <img
          src={product.image || product.image_url}
          alt={product.name || product.title}
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        {product.category && (
          <span
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              backgroundColor: "rgba(15, 23, 42, 0.75)",
              color: "#38BDF8",
              fontSize: "11px",
              fontWeight: 800,
              padding: "3px 8px",
              borderRadius: "6px",
            }}
          >
            {product.category}
          </span>
        )}
        {isOutOfStock && (
          <span
            style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              backgroundColor: "#DC2626",
              color: "#FFF",
              fontSize: "11px",
              fontWeight: 800,
              padding: "4px 8px",
              borderRadius: "6px",
            }}
          >
            Sold Out
          </span>
        )}
        {isLowStock && !isOutOfStock && (
          <span
            style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              backgroundColor: "#EA580C",
              color: "#FFF",
              fontSize: "11px",
              fontWeight: 800,
              padding: "4px 8px",
              borderRadius: "6px",
            }}
          >
            Low Stock ({product.stock})
          </span>
        )}
      </div>

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", flex: 1 }}>
        <h3 style={{ margin: "0 0 6px 0", fontSize: "16px", fontWeight: 800, color: textColor }}>
          {product.name || product.title}
        </h3>
        <p style={{ margin: "0 0 12px 0", fontSize: "12px", color: isDark ? "#94A3B8" : "#64748B", flex: 1 }}>
          {product.description}
        </p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <span style={{ fontSize: "18px", fontWeight: 900, color: "#10B981" }}>
            ${Number(product.price).toFixed(2)}
          </span>
          <span style={{ fontSize: "12px", fontWeight: 700, color: isDark ? "#94A3B8" : "#64748B" }}>
            Stock: {product.stock}
          </span>
        </div>

        {isAdmin ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "auto" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: textColor }}>
              Add Stock:
            </span>
            <button
              title="Increase stock by 1" onClick={() => stockMutation.mutate({ productId: product.id, delta: 1 })}
              style={{
                backgroundColor: "#3B82F6",
                color: "#FFFFFF",
                border: "none",
                padding: "6px 12px",
                borderRadius: "6px",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              +1
            </button>
            <button
              title="Increase stock by 5" onClick={() => stockMutation.mutate({ productId: product.id, delta: 5 })}
              style={{
                backgroundColor: "#2563EB",
                color: "#FFFFFF",
                border: "none",
                padding: "6px 12px",
                borderRadius: "6px",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              +5
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "8px", marginTop: "auto" }}>
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              style={{
                flex: 1,
                backgroundColor: isOutOfStock ? "#64748B" : "#F59E0B",
                color: "#000",
                border: "none",
                padding: "10px",
                borderRadius: "8px",
                fontWeight: 800,
                fontSize: "12px",
                cursor: isOutOfStock ? "not-allowed" : "pointer",
              }}
            >
              {isOutOfStock ? "Sold Out" : "Add to Cart"}
            </button>

            <button
              onClick={() => toggleWishlist(product)}
              title="Wishlist"
              style={{
                backgroundColor: isWishlisted ? "#EF4444" : isDark ? "#1E293B" : "#F1F5F9",
                color: isWishlisted ? "#FFF" : textColor,
                border: `1px solid ${borderColor}`,
                borderRadius: "8px",
                padding: "8px 12px",
                cursor: "pointer",
                fontWeight: 800,
              }}
            >
              {isWishlisted ? "❤️" : "🤍"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

export default ProductCard;
