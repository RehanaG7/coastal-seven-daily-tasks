import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCartStore, useAuthStore, useUIStore } from "../store/useStore";
import { useOptimisticStockUpdate } from "../hooks/useProducts";
import Footer from "../components/Footer";

export default function CartPage() {
  const navigate = useNavigate();
  const theme = useUIStore((s) => s.theme);
  const isDark = theme === "dark";

  const cart = useCartStore((s) => s.cart || []);
  const removeFromCart = useCartStore((s) => s.removeFromCart);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);

  const user = useAuthStore((s) => s.user);
  const stockMutation = useOptimisticStockUpdate();

  const [isProcessing, setIsProcessing] = useState(false);
  const [successBanner, setSuccessBanner] = useState("");

  const subtotal = cart.reduce(
    (sum, item) => sum + (Number(item.price || item.product?.price || 0)) * (Number(item.quantity || 1)),
    0
  );
  const delivery = subtotal > 499 || subtotal === 0 ? 0 : 40;
  const tax = subtotal * 0.05;
  const grandTotal = subtotal + delivery + tax;

  const handleCheckoutAndPlaceOrder = () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    // Smooth transition into checkout page
    setTimeout(() => {
      setIsProcessing(false);
      navigate("/checkout");
    }, 400);
  };

  const c = {
    bg: isDark ? "#080C14" : "#F8FAFC",
    cardBg: isDark ? "#0F172A" : "#FFFFFF",
    cardInner: isDark ? "#131C31" : "#F1F5F9",
    border: isDark ? "#1E293B" : "#E2E8F0",
    borderSubtle: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.06)",
    text: isDark ? "#F8FAFC" : "#0F172A",
    subtext: isDark ? "#94A3B8" : "#64748B",
    primary: "#F59E0B",
    accent: "#38BDF8",
    emerald: "#10B981",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: c.bg,
        color: c.text,
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "40px auto", padding: "0 24px", width: "100%", boxSizing: "border-box" }}>
        {/* Header Breadcrumbs & Title */}
        <div style={{ marginBottom: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: c.subtext, marginBottom: "8px" }}>
            <Link to="/catalog" style={{ color: c.subtext, textDecoration: "none" }}>Catalog</Link>
            <span>/</span>
            <span style={{ color: c.accent, fontWeight: "700" }}>Shopping Cart</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <h1 style={{ fontSize: "28px", fontWeight: "900", margin: 0, letterSpacing: "-0.5px", color: c.text }}>
                Shopping Cart
              </h1>
              <p style={{ color: c.subtext, fontSize: "14px", margin: "4px 0 0 0" }}>
                Review items in your cart and proceed to secure checkout.
              </p>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm("Are you sure you want to clear your cart?")) {
                    cart.forEach((item) => {
                      stockMutation?.mutate && stockMutation.mutate({ productId: item.id, delta: item.quantity || 1 });
                    });
                    clearCart();
                  }
                }}
                style={{
                  background: "none",
                  border: `1px solid ${c.border}`,
                  color: "#EF4444",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: "800",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                Clear Entire Cart
              </button>
            )}
          </div>
        </div>

        {/* Free Shipping Alert Bar */}
        {subtotal > 0 && subtotal < 499 && (
          <div
            style={{
              padding: "12px 18px",
              borderRadius: "12px",
              backgroundColor: isDark ? "rgba(245, 158, 11, 0.12)" : "rgba(245, 158, 11, 0.15)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "24px",
              fontSize: "13px",
            }}
          >
            <span>⚡</span>
            <span>
              Add <strong>${(499 - subtotal).toFixed(2)}</strong> more to unlock <strong>FREE Express Doorstep Delivery</strong>!
            </span>
          </div>
        )}

        {/* Empty State */}
        {cart.length === 0 ? (
          <div
            style={{
              backgroundColor: c.cardBg,
              border: `1px solid ${c.border}`,
              borderRadius: "20px",
              padding: "64px 32px",
              textAlign: "center",
              boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>🛒</div>
            <h2 style={{ fontSize: "22px", fontWeight: "900", color: c.text, margin: "0 0 8px 0" }}>
              Your Shopping Cart is Empty
            </h2>
            <p style={{ color: c.subtext, fontSize: "14px", margin: "0 0 28px 0", maxWidth: "420px", marginInline: "auto" }}>
              You haven't added any products yet. Explore our verified tech, gourmet foods, and luxury catalog.
            </p>
            <Link
              to="/catalog"
              style={{
                display: "inline-block",
                backgroundColor: c.primary,
                color: "#0F172A",
                padding: "12px 28px",
                borderRadius: "10px",
                fontWeight: "900",
                fontSize: "14px",
                textDecoration: "none",
                boxShadow: "0 4px 15px rgba(245, 158, 11, 0.3)",
              }}
            >
              Start Shopping Catalog ➔
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            {/* ==============================================================
                TOP SECTION: PRODUCTS LIST
                ============================================================== */}
            <div
              style={{
                backgroundColor: c.cardBg,
                border: `1px solid ${c.border}`,
                borderRadius: "18px",
                padding: "24px",
                boxShadow: "0 8px 30px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ fontSize: "14px", fontWeight: "900", letterSpacing: "0.5px", color: c.subtext, textTransform: "uppercase", marginBottom: "18px" }}>
                Selected Products ({cart.reduce((a, b) => a + (b.quantity || 1), 0)} items)
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {cart.map((item, idx) => {
                  const pName = item.name || item.title || item.product?.name || "Product";
                  const pPrice = Number(item.price || item.product?.price || 0);
                  const pQty = Number(item.quantity || 1);
                  const pImg = item.image || item.image_url || item.product?.image_url || `https://picsum.photos/seed/product-${item.id || idx + 1}/400/300`;
                  const pCat = item.category || item.product?.category || "General";

                  return (
                    <div
                      key={item.id || idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "18px",
                        padding: "16px",
                        backgroundColor: c.cardInner,
                        border: `1px solid ${c.border}`,
                        borderRadius: "14px",
                        flexWrap: "wrap",
                      }}
                    >
                      {/* Product Thumbnail */}
                      <Link to={`/catalog/${item.id}`} style={{ textDecoration: "none" }}>
                        <img
                          src={pImg}
                          alt={pName}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = `https://picsum.photos/seed/product-${item.id || 1}/400/300`;
                          }}
                          style={{
                            width: "84px",
                            height: "84px",
                            objectFit: "cover",
                            borderRadius: "12px",
                            border: `1px solid ${c.border}`,
                            backgroundColor: "#000",
                          }}
                        />
                      </Link>

                      {/* Product Metadata */}
                      <div style={{ flex: 1, minWidth: "220px" }}>
                        <Link
                          to={`/catalog/${item.id}`}
                          style={{
                            textDecoration: "none",
                            color: c.text,
                            fontSize: "16px",
                            fontWeight: "800",
                            lineHeight: 1.4,
                            display: "block",
                          }}
                        >
                          {pName}
                        </Link>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: "800",
                              color: c.accent,
                              backgroundColor: isDark ? "rgba(56, 189, 248, 0.12)" : "rgba(2, 132, 199, 0.1)",
                              padding: "2px 8px",
                              borderRadius: "6px",
                            }}
                          >
                            {pCat}
                          </span>
                          <span style={{ fontSize: "12px", color: c.subtext }}>
                            Unit Price: <strong>${pPrice.toFixed(2)}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          backgroundColor: isDark ? "#0A0F1D" : "#FFFFFF",
                          padding: "4px 8px",
                          borderRadius: "10px",
                          border: `1px solid ${c.border}`,
                        }}
                      >
                        <button
                          onClick={() => {
                            updateQuantity(item.id, -1);
                            stockMutation?.mutate && stockMutation.mutate({ productId: item.id, delta: 1 });
                          }}
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "6px",
                            backgroundColor: c.cardInner,
                            border: `1px solid ${c.border}`,
                            color: c.text,
                            fontWeight: "900",
                            cursor: "pointer",
                            fontSize: "14px",
                          }}
                        >
                          -
                        </button>
                        <span style={{ minWidth: "32px", textAlign: "center", fontWeight: "800", fontSize: "14px", color: c.text }}>
                          {pQty}
                        </span>
                        <button
                          onClick={() => {
                            updateQuantity(item.id, 1);
                            stockMutation?.mutate && stockMutation.mutate({ productId: item.id, delta: -1 });
                          }}
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "6px",
                            backgroundColor: c.cardInner,
                            border: `1px solid ${c.border}`,
                            color: c.text,
                            fontWeight: "900",
                            cursor: "pointer",
                            fontSize: "14px",
                          }}
                        >
                          +
                        </button>
                      </div>

                      {/* Line Item Total */}
                      <div style={{ textAlign: "right", minWidth: "100px" }}>
                        <div style={{ fontSize: "18px", fontWeight: "900", color: c.emerald }}>
                          ${(pPrice * pQty).toFixed(2)}
                        </div>
                        <div style={{ fontSize: "11px", color: c.subtext }}>In Stock</div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => {
                          stockMutation?.mutate && stockMutation.mutate({ productId: item.id, delta: pQty });
                          removeFromCart(item.id);
                        }}
                        title="Remove product"
                        style={{
                          background: "none",
                          border: "none",
                          color: "#EF4444",
                          cursor: "pointer",
                          padding: "6px",
                          fontSize: "16px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ==============================================================
                BOTTOM SECTION: PLACE ORDER & CHECKOUT SUMMARY
                ============================================================== */}
            <div
              style={{
                backgroundColor: c.cardBg,
                border: `1px solid ${c.border}`,
                borderRadius: "18px",
                padding: "28px",
                boxShadow: "0 10px 35px rgba(0,0,0,0.06)",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "28px",
                alignItems: "center",
              }}
            >
              {/* Left Column: Breakdown */}
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: "900", color: c.text, margin: "0 0 16px 0" }}>
                  Order Breakdown & Total
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", color: c.subtext }}>
                    <span>Items Subtotal:</span>
                    <strong style={{ color: c.text }}>${subtotal.toFixed(2)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: c.subtext }}>
                    <span>Express Delivery:</span>
                    <strong style={{ color: delivery === 0 ? c.emerald : c.text }}>
                      {delivery === 0 ? "FREE" : `$${delivery.toFixed(2)}`}
                    </strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: c.subtext }}>
                    <span>Estimated GST (5%):</span>
                    <strong style={{ color: c.text }}>${tax.toFixed(2)}</strong>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      paddingTop: "12px",
                      borderTop: `1px solid ${c.border}`,
                      fontSize: "18px",
                      fontWeight: "900",
                    }}
                  >
                    <span style={{ color: c.text }}>Total Payable:</span>
                    <span style={{ color: c.emerald, fontSize: "24px" }}>${grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Checkout Action Button */}
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <button
                  onClick={handleCheckoutAndPlaceOrder}
                  disabled={isProcessing || cart.length === 0}
                  style={{
                    backgroundColor: "#10B981",
                    color: "#FFFFFF",
                    border: "none",
                    padding: "16px 24px",
                    borderRadius: "12px",
                    fontSize: "16px",
                    fontWeight: "900",
                    cursor: "pointer",
                    boxShadow: "0 6px 20px rgba(16, 185, 129, 0.35)",
                    transition: "transform 0.15s ease, background-color 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                  }}
                >
                  <span>🚀</span>
                  <span>{isProcessing ? "Preparing Order..." : "Place Order & Proceed to Checkout ➔"}</span>
                </button>

                <div style={{ display: "flex", gap: "16px", justifyContent: "center", fontSize: "11px", color: c.subtext, flexWrap: "wrap" }}>
                  <span>🛡️ 256-Bit SSL Protection</span>
                  <span>⚡ 0% Pay Later Option</span>
                  <span>📦 24-48h Delivery</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}