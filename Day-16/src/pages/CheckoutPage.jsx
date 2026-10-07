import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router-dom";
import { checkoutSchema } from "../schemas/checkoutSchema";
import { useCartStore, useUIStore } from "../store/useStore";
import Footer from "../components/Footer";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const cart = useCartStore((s) => s.cart || []);
  const clearCart = useCartStore((s) => s.clearCart || (() => {}));
  const theme = useUIStore((s) => s.theme);
  const openTracker = useUIStore((s) => s.openTracker);
  const isDark = theme === "dark";

  // Coupon / Promo code state
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState(null);

  // Placed order success view
  const [placedOrder, setPlacedOrder] = useState(null);

  const subtotal = cart.reduce(
    (sum, item) => sum + (Number(item.price || item.product?.price || 0)) * (Number(item.quantity || 1)),
    0
  );

  const finalTotal = Math.max(0, subtotal - discount);

  const handleApplyPromo = (e) => {
    e.preventDefault();
    const clean = promoCode.trim().toUpperCase();
    if (clean === "RMART2026" || clean === "WELCOME10" || clean === "SAVE10") {
      const disc = Math.min(10, subtotal * 0.5);
      setDiscount(disc);
      setPromoMessage({ type: "success", text: `Promo code ${clean} applied! $${disc.toFixed(2)} savings.` });
    } else if (clean === "FREESHIP") {
      setPromoMessage({ type: "success", text: "Free express priority shipping applied!" });
    } else {
      setPromoMessage({ type: "error", text: "Invalid promo code. Try RMART2026 or SAVE10." });
    }
  };

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: "",
      email: "",
      address: "",
      city: "",
      postalCode: "",
      paymentMethod: "card",
    },
  });

  const selectedPaymentMethod = watch("paymentMethod");

  const onSubmit = async (data) => {
    const orderId = "ORD-" + Math.floor(100000 + Math.random() * 900000);
    const normalizedItems = cart.map((it) => ({
      id: it.id || it.product?.id,
      name: it.name || it.title || it.product?.name || "Product",
      title: it.name || it.title || it.product?.name || "Product",
      price: Number(it.price || it.product?.price || 0),
      quantity: Number(it.quantity || 1),
      image: it.image || it.image_url || it.product?.image_url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
      image_url: it.image || it.image_url || it.product?.image_url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
      category: it.category || it.product?.category || "General",
    }));

    const orderPayload = {
      ...data,
      orderId,
      id: orderId,
      items: normalizedItems,
      subtotal,
      discount,
      totalAmount: finalTotal,
      total: finalTotal,
      orderDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      createdAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      status: "Order Placed",
      deliveryETA: "24-48 Hours (Express Dispatched)",
    };

    const existingOrders = JSON.parse(localStorage.getItem("rmart_orders") || "[]");
    localStorage.setItem("rmart_orders", JSON.stringify([orderPayload, ...existingOrders]));

    if (typeof clearCart === "function") clearCart();
    setPlacedOrder(orderPayload);
  };

  const c = {
    bg: isDark ? "#06080F" : "#F8FAFC",
    cardBg: isDark ? "#0F1420" : "#FFFFFF",
    cardInner: isDark ? "#141A29" : "#F1F5F9",
    border: isDark ? "#1E2738" : "#E2E8F0",
    text: isDark ? "#FFFFFF" : "#0F172A",
    subtext: isDark ? "#94A3B8" : "#64748B",
    accent: "#38BDF8",
    gold: "#F59E0B",
    emerald: "#10B981",
  };

  return (
    <div
      style={{
        backgroundColor: c.bg,
        minHeight: "100vh",
        padding: "32px 20px 80px 20px",
        fontFamily: "'Inter', system-ui, sans-serif",
        color: c.text,
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Navigation Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: c.subtext, marginBottom: "20px" }}>
          <Link to="/catalog" style={{ color: c.subtext, textDecoration: "none" }}>Catalog</Link>
          <span>/</span>
          <span style={{ color: c.accent, fontWeight: "700" }}>Checkout & Order Summary</span>
        </div>

        {/* Page Title */}
        <div style={{ marginBottom: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span style={{ fontSize: "28px" }}>⚡</span>
            <h1 style={{ fontSize: "32px", fontWeight: "900", margin: 0, letterSpacing: "-0.5px", color: c.text }}>
              Complete Your Checkout
            </h1>
          </div>
          <p style={{ color: c.subtext, fontSize: "14px", margin: 0 }}>
            Review your selected products, confirm shipping details, and place your order with 256-bit encrypted security.
          </p>
        </div>

        {/* ORDER SUCCESS CELEBRATION MODAL / OVERLAY */}
        {placedOrder ? (
          <div
            style={{
              backgroundColor: c.cardBg,
              border: `1px solid ${c.emerald}`,
              borderRadius: "20px",
              padding: "48px 32px",
              textAlign: "center",
              boxShadow: "0 20px 50px rgba(16, 185, 129, 0.15)",
              maxWidth: "680px",
              margin: "40px auto",
            }}
          >
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                backgroundColor: "rgba(16, 185, 129, 0.15)",
                color: c.emerald,
                fontSize: "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px auto",
                border: `2px solid ${c.emerald}`,
              }}
            >
              ✓
            </div>
            <h2 style={{ fontSize: "28px", fontWeight: "900", color: c.text, marginBottom: "8px" }}>
              Order Confirmed & Placed!
            </h2>
            <div style={{ display: "inline-block", backgroundColor: "rgba(245, 158, 11, 0.15)", color: c.gold, padding: "4px 14px", borderRadius: "999px", fontWeight: "800", fontSize: "14px", marginBottom: "16px" }}>
              #{placedOrder.orderId}
            </div>
            <p style={{ color: c.subtext, fontSize: "14px", lineHeight: "1.6", maxWidth: "480px", margin: "0 auto 24px auto" }}>
              Thank you, <strong>{placedOrder.fullName}</strong>! Your order has been placed successfully and dispatched to our high-speed fulfillment hub.
            </p>

            {/* Item summary pill */}
            <div style={{ backgroundColor: c.cardInner, border: `1px solid ${c.border}`, borderRadius: "14px", padding: "16px", marginBottom: "24px", textAlign: "left" }}>
              <div style={{ fontSize: "12px", color: c.subtext, fontWeight: "700", marginBottom: "8px", textTransform: "uppercase" }}>
                Order Summary Items ({placedOrder.items.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {placedOrder.items.map((it, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <img src={it.image} alt={it.name} style={{ width: "36px", height: "36px", borderRadius: "6px", objectFit: "cover" }} />
                      <span style={{ fontSize: "13px", fontWeight: "700", color: c.text }}>{it.name} <span style={{ color: c.subtext, fontSize: "12px" }}>× {it.quantity}</span></span>
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: "800", color: c.emerald }}>${(it.price * it.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: `1px solid ${c.border}`, marginTop: "12px", paddingTop: "8px", display: "flex", justifyContent: "space-between", fontWeight: "900", fontSize: "15px" }}>
                <span>Total Paid:</span>
                <span style={{ color: c.emerald }}>${placedOrder.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Navigation CTAs */}
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={() => {
                  if (openTracker) openTracker(placedOrder);
                  navigate("/orders");
                }}
                style={{
                  backgroundColor: "#38BDF8",
                  color: "#030712",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "10px",
                  fontWeight: "900",
                  fontSize: "14px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>🚚 Track Live Order</span>
              </button>
              <button
                onClick={() => navigate("/orders")}
                style={{
                  backgroundColor: isDark ? "#1E2738" : "#E2E8F0",
                  color: c.text,
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "10px",
                  fontWeight: "800",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                View All Orders
              </button>
              <button
                onClick={() => navigate("/catalog")}
                style={{
                  backgroundColor: "transparent",
                  color: c.accent,
                  border: `1px solid ${c.accent}`,
                  padding: "12px 24px",
                  borderRadius: "10px",
                  fontWeight: "800",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Continue Shopping
              </button>
            </div>
          </div>
        ) : cart.length === 0 ? (
          /* Empty Cart State */
          <div
            style={{
              backgroundColor: c.cardBg,
              border: `1px dashed ${c.border}`,
              borderRadius: "20px",
              padding: "60px 24px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "56px", marginBottom: "16px" }}>🛒</div>
            <h2 style={{ fontSize: "22px", fontWeight: "900", color: c.text, marginBottom: "8px" }}>
              Your Cart is Currently Empty
            </h2>
            <p style={{ color: c.subtext, fontSize: "14px", maxWidth: "420px", margin: "0 auto 24px auto" }}>
              You don't have any items in your checkout order summary yet. Head back to the store to discover top-rated products!
            </p>
            <button
              onClick={() => navigate("/catalog")}
              style={{
                backgroundColor: "#38BDF8",
                color: "#030712",
                border: "none",
                padding: "14px 28px",
                borderRadius: "12px",
                fontWeight: "900",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Browse 16 Product Categories →
            </button>
          </div>
        ) : (
          /* DUAL-COLUMN CHECKOUT & ORDER SUMMARY EXPERIENCE */
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "32px", alignItems: "start" }}>
            
            {/* LEFT COLUMN: SHIPPING ADDRESS & PAYMENT FORM */}
            <div
              style={{
                backgroundColor: c.cardBg,
                border: `1px solid ${c.border}`,
                borderRadius: "20px",
                padding: "32px",
                boxShadow: isDark ? "0 10px 30px rgba(0,0,0,0.4)" : "0 4px 20px rgba(0,0,0,0.04)",
              }}
            >
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                
                {/* SECTION 1: SHIPPING DESTINATION */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                    <span style={{ backgroundColor: "rgba(56, 189, 248, 0.15)", color: c.accent, width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "900" }}>
                      1
                    </span>
                    <h3 style={{ fontSize: "18px", fontWeight: "900", margin: 0, color: c.text }}>
                      Delivery & Contact Details
                    </h3>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "800", textTransform: "uppercase", color: c.subtext, marginBottom: "6px" }}>
                        Full Name *
                      </label>
                      <input
                        {...register("fullName")}
                        placeholder="e.g. Alex Customer"
                        name="fullName"
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          padding: "12px 14px",
                          borderRadius: "10px",
                          backgroundColor: c.cardInner,
                          border: `1px solid ${errors.fullName ? "#EF4444" : c.border}`,
                          color: c.text,
                          fontSize: "14px",
                          outline: "none",
                        }}
                      />
                      {errors.fullName && <p style={{ color: "#EF4444", fontSize: "12px", margin: "4px 0 0 0", fontWeight: "600" }}>{errors.fullName.message}</p>}
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "800", textTransform: "uppercase", color: c.subtext, marginBottom: "6px" }}>
                        Email Address *
                      </label>
                      <input
                        {...register("email")}
                        placeholder="customer@example.com"
                        name="email"
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          padding: "12px 14px",
                          borderRadius: "10px",
                          backgroundColor: c.cardInner,
                          border: `1px solid ${errors.email ? "#EF4444" : c.border}`,
                          color: c.text,
                          fontSize: "14px",
                          outline: "none",
                        }}
                      />
                      {errors.email && <p style={{ color: "#EF4444", fontSize: "12px", margin: "4px 0 0 0", fontWeight: "600" }}>{errors.email.message}</p>}
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "800", textTransform: "uppercase", color: c.subtext, marginBottom: "6px" }}>
                        Street Address *
                      </label>
                      <input
                        {...register("address")}
                        placeholder="Flat 402, Hi-Tech City Road"
                        name="address"
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          padding: "12px 14px",
                          borderRadius: "10px",
                          backgroundColor: c.cardInner,
                          border: `1px solid ${errors.address ? "#EF4444" : c.border}`,
                          color: c.text,
                          fontSize: "14px",
                          outline: "none",
                        }}
                      />
                      {errors.address && <p style={{ color: "#EF4444", fontSize: "12px", margin: "4px 0 0 0", fontWeight: "600" }}>{errors.address.message}</p>}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "800", textTransform: "uppercase", color: c.subtext, marginBottom: "6px" }}>
                          City *
                        </label>
                        <input
                          {...register("city")}
                          placeholder="Hyderabad"
                          name="city"
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            padding: "12px 14px",
                            borderRadius: "10px",
                            backgroundColor: c.cardInner,
                            border: `1px solid ${errors.city ? "#EF4444" : c.border}`,
                            color: c.text,
                            fontSize: "14px",
                            outline: "none",
                          }}
                        />
                        {errors.city && <p style={{ color: "#EF4444", fontSize: "12px", margin: "4px 0 0 0", fontWeight: "600" }}>{errors.city.message}</p>}
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "800", textTransform: "uppercase", color: c.subtext, marginBottom: "6px" }}>
                          Postal Code *
                        </label>
                        <input
                          {...register("postalCode")}
                          placeholder="500081"
                          name="postalCode"
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            padding: "12px 14px",
                            borderRadius: "10px",
                            backgroundColor: c.cardInner,
                            border: `1px solid ${errors.postalCode ? "#EF4444" : c.border}`,
                            color: c.text,
                            fontSize: "14px",
                            outline: "none",
                          }}
                        />
                        {errors.postalCode && <p style={{ color: "#EF4444", fontSize: "12px", margin: "4px 0 0 0", fontWeight: "600" }}>{errors.postalCode.message}</p>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* FAST SHIPPING PERK BADGE */}
                <div
                  style={{
                    backgroundColor: "rgba(16, 185, 129, 0.1)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    borderRadius: "12px",
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <span style={{ fontSize: "20px" }}>⚡</span>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "800", color: c.emerald }}>
                      Free Express Priority Dispatch
                    </div>
                    <div style={{ fontSize: "12px", color: c.subtext }}>
                      Guaranteed doorstep delivery within 24–48 hours across all locations.
                    </div>
                  </div>
                </div>

                {/* SECTION 2: PAYMENT METHOD SELECTION */}
                <div style={{ paddingTop: "12px", borderTop: `1px solid ${c.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                    <span style={{ backgroundColor: "rgba(56, 189, 248, 0.15)", color: c.accent, width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "900" }}>
                      2
                    </span>
                    <h3 style={{ fontSize: "18px", fontWeight: "900", margin: 0, color: c.text }}>
                      Payment Method
                    </h3>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    
                    {/* Option 1: Credit / Debit Card */}
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "14px 16px",
                        borderRadius: "12px",
                        backgroundColor: selectedPaymentMethod === "card" ? "rgba(56, 189, 248, 0.08)" : c.cardInner,
                        border: `1.5px solid ${selectedPaymentMethod === "card" ? c.accent : c.border}`,
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        value="card"
                        {...register("paymentMethod")}
                        style={{ accentColor: c.accent }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "14px", fontWeight: "800", color: c.text }}>Credit / Debit Card</div>
                        <div style={{ fontSize: "11px", color: c.subtext }}>Visa, MasterCard, American Express, RuPay</div>
                      </div>
                      <span style={{ fontSize: "20px" }}>💳</span>
                    </label>

                    {/* Option 2: Cash on Delivery / Pay Later */}
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "14px 16px",
                        borderRadius: "12px",
                        backgroundColor: selectedPaymentMethod === "cod" ? "rgba(56, 189, 248, 0.08)" : c.cardInner,
                        border: `1.5px solid ${selectedPaymentMethod === "cod" ? c.accent : c.border}`,
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        value="cod"
                        {...register("paymentMethod")}
                        style={{ accentColor: c.accent }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "14px", fontWeight: "800", color: c.text }}>Cash on Delivery / Pay Later</div>
                        <div style={{ fontSize: "11px", color: c.subtext }}>Pay with cash or scan QR when delivered at your doorstep</div>
                      </div>
                      <span style={{ fontSize: "20px" }}>💵</span>
                    </label>

                    {/* Option 3: UPI / Instant Transfer */}
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "14px 16px",
                        borderRadius: "12px",
                        backgroundColor: selectedPaymentMethod === "upi" ? "rgba(56, 189, 248, 0.08)" : c.cardInner,
                        border: `1.5px solid ${selectedPaymentMethod === "upi" ? c.accent : c.border}`,
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        value="upi"
                        {...register("paymentMethod")}
                        style={{ accentColor: c.accent }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "14px", fontWeight: "800", color: c.text }}>UPI & Instant QR Transfer</div>
                        <div style={{ fontSize: "11px", color: c.subtext }}>Google Pay, PhonePe, Paytm, BHIM</div>
                      </div>
                      <span style={{ fontSize: "20px" }}>📱</span>
                    </label>

                    {errors.paymentMethod && <p style={{ color: "#EF4444", fontSize: "12px", margin: "4px 0 0 0", fontWeight: "600" }}>{errors.paymentMethod.message}</p>}
                  </div>
                </div>

                {/* SUBMIT BUTTON */}
                <div style={{ paddingTop: "12px" }}>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      width: "100%",
                      backgroundColor: "#10B981",
                      color: "#FFFFFF",
                      border: "none",
                      padding: "16px 24px",
                      borderRadius: "12px",
                      fontSize: "16px",
                      fontWeight: "900",
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      boxShadow: "0 6px 20px rgba(16, 185, 129, 0.35)",
                      transition: "transform 0.15s ease, background-color 0.15s ease",
                    }}
                  >
                    <span>{isSubmitting ? "Processing Order..." : `Place Order • $${finalTotal.toFixed(2)}`}</span>
                    <span>→</span>
                  </button>
                  <div style={{ textAlign: "center", marginTop: "10px", fontSize: "12px", color: c.subtext }}>
                    🔒 SSL 256-Bit Encrypted • Fast 24-hr Processing Guarantee
                  </div>
                </div>

              </form>
            </div>

            {/* RIGHT COLUMN: RICH STICKY ORDER SUMMARY CARD */}
            <div
              style={{
                backgroundColor: c.cardBg,
                border: `1px solid ${c.border}`,
                borderRadius: "20px",
                padding: "28px",
                position: "sticky",
                top: "24px",
                boxShadow: isDark ? "0 10px 30px rgba(0,0,0,0.4)" : "0 4px 20px rgba(0,0,0,0.04)",
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "16px", borderBottom: `1px solid ${c.border}`, marginBottom: "20px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: "900", margin: 0, color: c.text }}>
                  Order Summary
                </h2>
                <span style={{ backgroundColor: "rgba(56, 189, 248, 0.15)", color: c.accent, padding: "4px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: "800" }}>
                  {cart.length} {cart.length === 1 ? "Item" : "Items"}
                </span>
              </div>

              {/* Scrollable Products List with Verified Matching Images */}
              <div
                style={{
                  maxHeight: "320px",
                  overflowY: "auto",
                  paddingRight: "6px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  marginBottom: "20px",
                }}
              >
                {cart.map((item, idx) => {
                  const pName = item.name || item.title || item.product?.name || "Product";
                  const pPrice = Number(item.price || item.product?.price || 0);
                  const pQty = Number(item.quantity || 1);
                  const pImg = item.image || item.image_url || item.product?.image_url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500";
                  const pCat = item.category || item.product?.category || "General";

                  return (
                    <div
                      key={item.id || idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px",
                        borderRadius: "12px",
                        backgroundColor: c.cardInner,
                        border: `1px solid ${c.border}`,
                      }}
                    >
                      <img
                        src={pImg}
                        alt={pName}
                        style={{
                          width: "52px",
                          height: "52px",
                          borderRadius: "8px",
                          objectFit: "cover",
                          flexShrink: 0,
                          backgroundColor: "#000",
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "13px", fontWeight: "800", color: c.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {pName}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" }}>
                          <span style={{ fontSize: "10px", color: c.subtext, backgroundColor: isDark ? "#1E2738" : "#E2E8F0", padding: "1px 6px", borderRadius: "4px" }}>
                            {pCat}
                          </span>
                          <span style={{ fontSize: "11px", color: c.subtext }}>
                            Qty: <strong>{pQty}</strong>
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: "14px", fontWeight: "900", color: c.text }}>
                          ${(pPrice * pQty).toFixed(2)}
                        </div>
                        {pQty > 1 && (
                          <div style={{ fontSize: "11px", color: c.subtext }}>
                            ${pPrice.toFixed(2)}/ea
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* PROMO / COUPON CODE SECTION */}
              <form onSubmit={handleApplyPromo} style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Coupon (e.g. RMART2026)"
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      borderRadius: "8px",
                      backgroundColor: c.cardInner,
                      border: `1px solid ${c.border}`,
                      color: c.text,
                      fontSize: "12px",
                      outline: "none",
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      backgroundColor: isDark ? "#1E2738" : "#E2E8F0",
                      color: c.accent,
                      border: `1px solid ${c.border}`,
                      padding: "10px 14px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: "800",
                      cursor: "pointer",
                    }}
                  >
                    Apply
                  </button>
                </div>
                {promoMessage && (
                  <p
                    style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      marginTop: "6px",
                      color: promoMessage.type === "success" ? c.emerald : "#EF4444",
                    }}
                  >
                    {promoMessage.text}
                  </p>
                )}
              </form>

              {/* DETAILED COST BREAKDOWN */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", paddingBottom: "16px", borderBottom: `1px solid ${c.border}`, marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: c.subtext }}>
                  <span>Items Subtotal</span>
                  <span style={{ color: c.text, fontWeight: "700" }}>${subtotal.toFixed(2)}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", color: c.subtext }}>
                  <span>Express Delivery</span>
                  <span style={{ color: c.emerald, fontWeight: "800" }}>
                    <span style={{ textDecoration: "line-through", color: c.subtext, marginRight: "4px" }}>$9.99</span>
                    FREE
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", color: c.subtext }}>
                  <span>Estimated Taxes & GST</span>
                  <span style={{ color: c.text, fontWeight: "700" }}>$0.00 (Inclusive)</span>
                </div>

                {discount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", color: c.emerald, fontWeight: "800" }}>
                    <span>Promo Discount</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* GRAND TOTAL */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "20px" }}>
                <span style={{ fontSize: "16px", fontWeight: "900", color: c.text }}>Total Due:</span>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "28px", fontWeight: "900", color: c.emerald }}>
                    ${finalTotal.toFixed(2)}
                  </span>
                  <div style={{ fontSize: "11px", color: c.subtext }}>Includes all applicable taxes</div>
                </div>
              </div>

              {/* TRUST SIGNALS */}
              <div style={{ backgroundColor: c.cardInner, borderRadius: "10px", padding: "12px", display: "flex", flexDirection: "column", gap: "8px", fontSize: "11px", color: c.subtext }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>🔒</span>
                  <span><strong>Bank-Grade 256-bit SSL Security</strong></span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>🛡️</span>
                  <span><strong>100% Genuine Certified R-Mart Guarantee</strong></span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>↩️</span>
                  <span><strong>7-Day Easy Return & Instant Refund Policy</strong></span>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* Footer */}
      <div style={{ marginTop: "60px", marginInline: "-20px", marginBottom: "-80px" }}>
        <Footer />
      </div>
    </div>
  );
}
