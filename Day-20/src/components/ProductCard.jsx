import React, { useState, useRef, memo } from "react";
import { Link } from "react-router-dom";
import { useCartStore, useAuthStore, useUIStore } from "../store/useStore";
import { useOptimisticStockUpdate, useDeleteProduct } from "../hooks/useProducts";

export const ProductCard = memo(({ product }) => {
  const addToCart = useCartStore((s) => s.addToCart);
  const cart = useCartStore((s) => s.cart || []);
  const toggleWishlist = useCartStore((s) => s.toggleWishlist);
  const isWishlisted = useCartStore((s) => s.isWishlisted ? s.isWishlisted(product.id) : false);

  const user = useAuthStore((s) => s.user);
  const theme = useUIStore((s) => s.theme);
  const isDark = theme === "dark";

  const stockMutation = useOptimisticStockUpdate();
  const deleteMutation = typeof useDeleteProduct === "function" ? useDeleteProduct() : { mutate: () => {}, isPending: false };

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const prodName = product.name || product.title || "this product";
    if (window.confirm(`Are you sure you want to permanently delete "${prodName}" from inventory?`)) {
      deleteMutation.mutate(product.id);
    }
  };

  // Local optimistic stock counter for instant reactive UI feedback
  const [localStock, setLocalStock] = useState(product?.stock);

  React.useEffect(() => {
    setLocalStock(product?.stock);
  }, [product?.stock]);

  // Mouse 3D Tilt & Holographic Sheen
  const [tilt, setTilt] = useState({ rotX: 0, rotY: 0, glareX: 50, glareY: 50, isHovered: false });
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
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

  if (!product) return null;

  const currentStock = localStock !== undefined ? localStock : (product.stock ?? 0);
  const isOutOfStock = currentStock <= 0;
  const cartItem = cart.find((item) => item.id === product.id);
  const inCartQty = cartItem?.quantity || 0;
  const isAtMaxStock = currentStock > 0 && inCartQty >= currentStock;
  const isLowStock = currentStock > 0 && currentStock <= 3;
  const isAdmin = user?.role === "admin";

  const trackView = () => {
    try {
      const raw = localStorage.getItem("rmart_viewed_products");
      const list = raw ? JSON.parse(raw) : [];
      const filtered = list.filter((p) => p.id !== product.id);
      filtered.unshift({
        id: product.id,
        title: product.name || product.title,
        price: product.price,
        stock: product.stock,
      });
      localStorage.setItem("rmart_viewed_products", JSON.stringify(filtered.slice(0, 8)));
    } catch {
      // ignore
    }
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={trackView}
      className="perspective-1000"
      style={{ height: "100%" }}
      data-testid={`product-card-${product.id}`}
    >
      <div
        className="preserve-3d"
        style={{
          height: "100%",
          backgroundColor: isDark ? "#0B0F19" : "#FFFFFF",
          border: `1px solid ${
            tilt.isHovered
              ? "rgba(56, 189, 248, 0.6)"
              : isDark
              ? "#1E293B"
              : "#E2E8F0"
          }`,
          borderRadius: "18px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          transform: `rotateX(${tilt.rotX}deg) rotateY(${tilt.rotY}deg) ${
            tilt.isHovered ? "scale3d(1.03, 1.03, 1.03)" : "scale3d(1, 1, 1)"
          }`,
          transition: tilt.isHovered
            ? "transform 0.1s ease-out, border-color 0.2s ease"
            : "transform 0.5s ease-out, border-color 0.2s ease",
          boxShadow: tilt.isHovered
            ? isDark
              ? "0 20px 40px -10px rgba(56, 189, 248, 0.25), 0 0 25px rgba(0, 0, 0, 0.8)"
              : "0 20px 40px -10px rgba(0, 0, 0, 0.15)"
            : "0 4px 15px rgba(0, 0, 0, 0.08)",
        }}
      >
        {/* Holographic Sheen */}
        {tilt.isHovered && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255, 255, 255, 0.18) 0%, transparent 65%)`,
              pointerEvents: "none",
              zIndex: 15,
            }}
          />
        )}

        {/* Product Image Container */}
        <div style={{ height: "190px", backgroundColor: "#1E293B", position: "relative", overflow: "hidden" }}>
          <img
            src={product.image || product.image_url || `https://picsum.photos/seed/product-${product.id}/400/300`}
            alt={product.name || product.title}
            loading="lazy"
            decoding="async"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: tilt.isHovered ? "scale(1.08)" : "scale(1)",
              transition: "transform 0.4s ease",
            }}
            onError={(e) => {
              e.currentTarget.src = `https://picsum.photos/seed/product-${product.id}/400/300`;
            }}
          />

          {/* Badges on Top Left */}
          <div
            style={{
              position: "absolute",
              top: "12px",
              left: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              zIndex: 10,
            }}
          >
            {(isOutOfStock || isLowStock) && (
              <span
                style={{
                  backgroundColor: isOutOfStock ? "#DC2626" : "#EA580C",
                  color: "#FFF",
                  fontSize: "10px",
                  fontWeight: "900",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                  letterSpacing: "0.5px",
                }}
              >
                {isOutOfStock ? "🔴 STOCKOUT" : `⚠️ ${currentStock} LEFT`}
              </span>
            )}

            <span
              style={{
                backgroundColor: "rgba(15, 23, 42, 0.8)",
                color: "#38BDF8",
                fontSize: "10px",
                fontWeight: "800",
                padding: "3px 8px",
                borderRadius: "6px",
                border: "1px solid rgba(56, 189, 248, 0.4)",
                backdropFilter: "blur(6px)",
              }}
            >
              {product.category || "Hardware"}
            </span>
          </div>

          {/* HEART SYMBOL - WISHLIST TOGGLE (FOR USERS ONLY) */}
          {!isAdmin && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (toggleWishlist) toggleWishlist(product);
              }}
              title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                backgroundColor: isDark ? "rgba(15, 23, 42, 0.75)" : "rgba(255, 255, 255, 0.85)",
                border: isWishlisted ? "1.5px solid rgba(239, 68, 68, 0.6)" : "1px solid rgba(255, 255, 255, 0.2)",
                fontSize: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                zIndex: 20,
                backdropFilter: "blur(6px)",
                boxShadow: isWishlisted ? "0 2px 8px rgba(239, 68, 68, 0.25)" : "0 2px 6px rgba(0,0,0,0.3)",
                transition: "all 0.2s ease",
              }}
            >
              <span style={{ transform: isWishlisted ? "scale(1.15)" : "scale(1)", transition: "transform 0.2s ease" }}>
                {isWishlisted ? "❤️" : "🤍"}
              </span>
            </button>
          )}
        </div>

        {/* Details Section */}
        <div
          style={{
            padding: "18px",
            display: "flex",
            flexDirection: "column",
            flex: 1,
            position: "relative",
          }}
        >
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "900",
              color: isDark ? "#FFFFFF" : "#0F172A",
              margin: "0 0 8px 0",
              lineHeight: 1.3,
            }}
          >
            {product.name || product.title}
          </h3>

          <p
            style={{
              fontSize: "12px",
              color: isDark ? "#94A3B8" : "#64748B",
              margin: "0 0 16px 0",
              lineHeight: 1.5,
              flex: 1,
            }}
          >
            {product.description || "High quality product from R-Mart store."}
          </p>

          {/* Pricing & Stock */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: "14px",
            }}
          >
            <span style={{ fontSize: "20px", fontWeight: "900", color: "#10B981" }}>
              ${Number(product.price).toFixed(2)}
            </span>
            <span style={{ fontSize: "12px", color: isDark ? "#94A3B8" : "#64748B", fontWeight: "700" }}>
              Stock: {currentStock === 1 ? (
                <strong style={{ color: "#EF4444" }}>Only 1 left!</strong>
              ) : (
                <strong style={{ color: isDark ? "#FFF" : "#000" }}>{currentStock}</strong>
              )}
            </span>
          </div>

          {/* Action Row: Role Based Controls */}
          {isAdmin ? (
            /* ADMIN SIDE: VIEW IN DETAIL, DELETE & ADD STOCK */
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                <Link
                  to={`/catalog/${product.id}`}
                  style={{
                    flex: 1,
                    backgroundColor: isDark ? "#0B0F19" : "#F1F5F9",
                    color: isDark ? "#FFFFFF" : "#0F172A",
                    border: `1px solid ${isDark ? "#1E293B" : "#CBD5E1"}`,
                    padding: "9px 12px",
                    borderRadius: "10px",
                    fontSize: "12px",
                    fontWeight: "800",
                    textAlign: "center",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s ease",
                  }}
                >
                  View ↗
                </Link>

                <button
                  type="button"
                  data-testid={`admin-delete-product-${product.id}`}
                  title={`Delete ${product.name || product.title} permanently`}
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  style={{
                    flex: 1,
                    backgroundColor: "rgba(220, 38, 38, 0.12)",
                    color: "#EF4444",
                    border: "1px solid rgba(220, 38, 38, 0.4)",
                    padding: "9px 12px",
                    borderRadius: "10px",
                    fontSize: "12px",
                    fontWeight: "800",
                    cursor: deleteMutation.isPending ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                    transition: "all 0.2s ease",
                  }}
                >
                  <span>🗑️</span>
                  <span>Delete</span>
                </button>
              </div>

              {/* ADD STOCK CONTROLS */}
              <div
                style={{
                  backgroundColor: "rgba(245, 158, 11, 0.08)",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                  borderRadius: "10px",
                  padding: "8px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontSize: "11px", fontWeight: "800", color: "#F59E0B" }}>
                  📦 Add Stock:
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    type="button"
                    title="Reduce stock by 1"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const nextStock = Math.max(0, currentStock - 1);
                      setLocalStock(nextStock);
                      stockMutation?.mutate && stockMutation.mutate({ productId: product.id, delta: -1 });
                    }}
                    style={{
                      backgroundColor: "#DC2626",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: "6px",
                      width: "28px",
                      height: "28px",
                      fontWeight: "900",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "15px",
                    }}
                  >
                    -
                  </button>

                  <span style={{ fontSize: "14px", fontWeight: "900", color: isDark ? "#FFFFFF" : "#0F172A", minWidth: "26px", textAlign: "center" }}>
                    {currentStock}
                  </span>

                  <button
                    type="button"
                    title="Increase stock by 1"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const nextStock = currentStock + 1;
                      setLocalStock(nextStock);
                      stockMutation?.mutate && stockMutation.mutate({ productId: product.id, delta: 1 });
                    }}
                    style={{
                      backgroundColor: "#10B981",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: "6px",
                      width: "28px",
                      height: "28px",
                      fontWeight: "900",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "15px",
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* USER SIDE: VIEW IN DETAIL & ADD TO CART */
            <div style={{ display: "flex", gap: "8px" }}>
              <Link
                to={`/catalog/${product.id}`}
                style={{
                  flex: 1,
                  backgroundColor: isDark ? "#0B0F19" : "#F1F5F9",
                  color: isDark ? "#FFFFFF" : "#0F172A",
                  border: `1px solid ${isDark ? "#1E293B" : "#CBD5E1"}`,
                  padding: "10px",
                  borderRadius: "10px",
                  fontSize: "12px",
                  fontWeight: "800",
                  textAlign: "center",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                }}
              >
                View in Detail ↗
              </Link>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (isOutOfStock || isAtMaxStock) return;
                  const nextStock = Math.max(0, currentStock - 1);
                  setLocalStock(nextStock);
                  addToCart(product, 1);
                  if (stockMutation?.mutate) {
                    stockMutation.mutate({
                      productId: product.id,
                      delta: -1,
                      newStock: nextStock,
                    });
                  }
                }}
                disabled={isOutOfStock || isAtMaxStock}
                style={{
                  flex: 1.4,
                  backgroundColor: isOutOfStock || isAtMaxStock ? "#334155" : "#F59E0B",
                  color: isOutOfStock || isAtMaxStock ? "#94A3B8" : "#030712",
                  border: "none",
                  padding: "10px",
                  borderRadius: "10px",
                  fontSize: "12px",
                  fontWeight: "900",
                  cursor: isOutOfStock || isAtMaxStock ? "not-allowed" : "pointer",
                  boxShadow: isOutOfStock || isAtMaxStock ? "none" : "0 4px 14px rgba(245, 158, 11, 0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                  transition: "all 0.2s ease",
                }}
              >
                <span>🛒</span>
                <span>{isOutOfStock ? "Sold Out" : isAtMaxStock ? "Max in Cart" : "Add to Cart"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default ProductCard;
