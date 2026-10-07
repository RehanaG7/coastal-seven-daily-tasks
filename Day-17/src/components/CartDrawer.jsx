import React, { useState, useEffect } from "react";
import { useCartStore, useAuthStore, useUIStore } from "../store/useStore";
import { useOptimisticStockUpdate } from "../hooks/useProducts";
import { useNavigate } from "react-router-dom";

export default function CartDrawer({ isOpen, onClose }) {
  const storeIsOpen = useCartStore((s) => s.isOpen);
  const storeCloseCart = useCartStore((s) => s.closeCart);
  const cart = useCartStore((s) => s.cart);
  const removeFromCart = useCartStore((s) => s.removeFromCart);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);

  const theme = useUIStore((s) => s.theme);
  const openTracker = useUIStore((s) => s.openTracker);
  const user = useAuthStore((s) => s.user);

  const stockMutation = useOptimisticStockUpdate();

  const effectiveIsOpen = isOpen !== undefined ? isOpen : storeIsOpen;
  const handleClose = onClose || storeCloseCart;

  const navigate = useNavigate();
  const isDark = theme === "dark";

  // Flow steps: "cart" | "address" | "payment" | "success"
  const [step, setStep] = useState("cart");
  const [lastOrder, setLastOrder] = useState(null);
  const [savedAddress, setSavedAddress] = useState(null);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    street: "",
    city: "",
    pincode: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("pay_later");
  const [orderId, setOrderId] = useState("");
  const [orderNotification, setOrderNotification] = useState(null);

  // Load saved address on open
  useEffect(() => {
    const stored = localStorage.getItem("rmart_saved_address");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSavedAddress(parsed);
        setUseNewAddress(false);
      } catch (e) {
        setSavedAddress(null);
      }
    } else {
      setUseNewAddress(true);
    }
  }, [effectiveIsOpen]);

  if (!effectiveIsOpen) return null;

  const subtotal = cart.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 1), 0);
  const delivery = subtotal > 499 || subtotal === 0 ? 0 : 40;
  const tax = subtotal * 0.05;
  const total = subtotal + delivery + tax;

  const handleProceedToAddress = () => {
    if (savedAddress && !useNewAddress) {
      setStep("payment");
    } else {
      setStep("address");
    }
  };

  const handleSaveAddressAndContinue = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.street || !formData.pincode) {
      alert("Please fill all required delivery details.");
      return;
    }
    localStorage.setItem("rmart_saved_address", JSON.stringify(formData));
    setSavedAddress(formData);
    setUseNewAddress(false);
    setStep("payment");
  };

  const handlePlaceOrder = () => {
    const generatedId = "RM-" + Math.floor(100000 + Math.random() * 900000);
    const celeryTaskId = "celery-task-" + Math.random().toString(36).substring(2, 9);
    setOrderId(generatedId);

    const placedOrder = {
      orderId: generatedId,
      items: cart,
      total: total.toFixed(2),
      address: savedAddress || formData,
      paymentMethod,
      payLaterDue: paymentMethod === "pay_later" ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString() : null,
      timestamp: new Date().toLocaleTimeString(),
      status: "Processing (Queued in Redis)",
      celery_task_id: celeryTaskId,
    };

    // Store in global admin orders pool
    const existingOrders = JSON.parse(localStorage.getItem("rmart_admin_orders") || "[]");
    localStorage.setItem("rmart_admin_orders", JSON.stringify([placedOrder, ...existingOrders]));

    // Push notification into user's Inbox
    const existingNotifs = JSON.parse(localStorage.getItem("rmart_user_inbox") || "[]");
    const newNotif = {
      id: Date.now(),
      title: `Order #${generatedId} Confirmed (${paymentMethod === "pay_later" ? "Pay Later - 0% APR" : paymentMethod.toUpperCase()})`,
      message: `Your order for $${total.toFixed(2)} has been queued. Celery worker [${celeryTaskId}] dispatched confirmation email & tracking.`,
      time: "Just now",
      read: false,
      orderId: generatedId,
    };
    localStorage.setItem("rmart_user_inbox", JSON.stringify([newNotif, ...existingNotifs]));

    setOrderNotification(`🔔 Celery Task #${celeryTaskId} dispatched: Order #${generatedId} confirmed!`);
    setLastOrder(placedOrder);
    setStep("success");
    clearCart();
  };

  const handleShopMore = () => {
    setStep("cart");
    setOrderNotification(null);
    handleClose();
    navigate("/catalog");
  };

  const c = {
    modalBg: isDark ? "#080C14" : "#F8FAFC",
    cardBg: isDark ? "#0F172A" : "#FFFFFF",
    cardBgHover: isDark ? "#1E293B" : "#F1F5F9",
    border: isDark ? "#1E293B" : "#E2E8F0",
    text: isDark ? "#F8FAFC" : "#0F172A",
    subtext: isDark ? "#94A3B8" : "#64748B",
    primary: "#F59E0B",
    accent: "#38BDF8",
  };

  return (
    <div
      data-testid="cart-drawer"
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 99999,
        backgroundColor: c.modalBg,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* ====================================================================
          TOP FULL-SCREEN HEADER & PROGRESS BREADCRUMBS
          ==================================================================== */}
      <div
        style={{
          padding: "16px 32px",
          borderBottom: `1px solid ${c.border}`,
          backgroundColor: isDark ? "#030712" : "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        }}
      >
        {/* Brand & Title */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            onClick={handleClose}
            style={{
              backgroundColor: "transparent",
              border: `1px solid ${c.border}`,
              color: c.text,
              padding: "8px 14px",
              borderRadius: "8px",
              fontWeight: "800",
              fontSize: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>←</span>
            <span>Back to Store</span>
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "20px", color: "#F59E0B" }}>⚡</span>
            <span style={{ fontSize: "18px", fontWeight: "900", color: c.text, letterSpacing: "-0.3px" }}>
              R - M A R T &nbsp; C A R T
            </span>
            <span
              style={{
                backgroundColor: "rgba(56, 189, 248, 0.15)",
                color: "#38BDF8",
                fontSize: "11px",
                fontWeight: "800",
                padding: "2px 8px",
                borderRadius: "12px",
              }}
            >
              FULL SCREEN
            </span>
          </div>
        </div>

        {/* Step Breadcrumbs */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {[
            { id: "cart", label: "1. Cart Items" },
            { id: "address", label: "2. Address" },
            { id: "payment", label: "3. Payment & Pay Later" },
            { id: "success", label: "4. Confirmation" },
          ].map((s, idx) => {
            const isActive = step === s.id;
            return (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: isActive ? "900" : "700",
                    color: isActive ? "#F59E0B" : c.subtext,
                    borderBottom: isActive ? "2px solid #F59E0B" : "none",
                    paddingBottom: "2px",
                  }}
                >
                  {s.label}
                </span>
                {idx < 3 && <span style={{ color: c.subtext, fontSize: "10px" }}>➔</span>}
              </div>
            );
          })}
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          style={{
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#EF4444",
            padding: "8px 16px",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: "900",
            cursor: "pointer",
          }}
        >
          ✕ Close
        </button>
      </div>

      {/* Dynamic Push Notification Banner */}
      {orderNotification && (
        <div
          style={{
            backgroundColor: "#10B981",
            color: "#FFFFFF",
            padding: "10px 24px",
            fontSize: "13px",
            fontWeight: "800",
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
          }}
        >
          <span>⚡</span>
          <span>{orderNotification}</span>
        </div>
      )}

      {/* ====================================================================
          FULL-SCREEN 2-COLUMN CHECKOUT BODY
          ==================================================================== */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "28px",
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: step === "success" ? "1fr" : "1fr 380px",
            gap: "28px",
            alignItems: "start",
          }}
        >
          {/* ================================================================
              LEFT MAIN CONTENT (STEPS 1, 2, 3, 4)
              ================================================================ */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* STEP 1: CART ITEMS */}
            {step === "cart" && (
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "16px",
                  }}
                >
                  <h2 style={{ fontSize: "20px", fontWeight: "900", color: c.text, margin: 0 }}>
                    Selected Cart Items ({cart.length})
                  </h2>
                  {cart.length > 0 && (
                    <button
                      onClick={() => {
                        cart.forEach((item) => {
                          const qty = item.quantity || 1;
                          stockMutation?.mutate && stockMutation.mutate({ productId: item.id, delta: qty });
                        });
                        clearCart();
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#EF4444",
                        fontSize: "12px",
                        fontWeight: "800",
                        cursor: "pointer",
                      }}
                    >
                      Clear All Items
                    </button>
                  )}
                </div>

                {cart.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "80px 20px",
                      backgroundColor: c.cardBg,
                      border: `1px solid ${c.border}`,
                      borderRadius: "16px",
                    }}
                  >
                    <div style={{ fontSize: "64px", marginBottom: "16px" }}>🛒</div>
                    <h3 style={{ color: c.text, fontSize: "18px", margin: "0 0 8px 0" }}>
                      Your Shopping Cart is Empty
                    </h3>
                    <p style={{ color: c.subtext, fontSize: "13px", margin: "0 0 24px 0" }}>
                      Browse top-rated deals in our 3D product catalog and add items with one click.
                    </p>
                    <button
                      onClick={handleShopMore}
                      style={{
                        backgroundColor: c.primary,
                        color: "#030712",
                        border: "none",
                        padding: "12px 30px",
                        borderRadius: "10px",
                        fontWeight: "900",
                        fontSize: "14px",
                        cursor: "pointer",
                      }}
                    >
                      Explore Products ➔
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "18px",
                          padding: "16px 20px",
                          backgroundColor: c.cardBg,
                          border: `1px solid ${c.border}`,
                          borderRadius: "14px",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                        }}
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{
                            width: "80px",
                            height: "80px",
                            objectFit: "cover",
                            borderRadius: "10px",
                            border: `1px solid ${c.border}`,
                          }}
                        />

                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "16px", fontWeight: "900", color: c.text }}>
                            {item.name}
                          </div>
                          <div style={{ fontSize: "12px", color: c.subtext, marginTop: "2px" }}>
                            Category: {item.category || "General"} • In Stock
                          </div>
                          <div style={{ fontSize: "18px", fontWeight: "900", color: "#10B981", marginTop: "6px" }}>
                            ${item.price}
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            backgroundColor: isDark ? "#030712" : "#F1F5F9",
                            padding: "4px 8px",
                            borderRadius: "8px",
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
                              backgroundColor: c.cardBg,
                              border: `1px solid ${c.border}`,
                              color: c.text,
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontWeight: "900",
                              fontSize: "14px",
                            }}
                          >
                            -
                          </button>
                          <span style={{ fontWeight: "900", color: c.text, minWidth: "24px", textAlign: "center" }}>
                            {item.quantity || 1}
                          </span>
                          <button
                            onClick={() => {
                              updateQuantity(item.id, 1);
                              stockMutation?.mutate && stockMutation.mutate({ productId: item.id, delta: -1 });
                            }}
                            style={{
                              width: "28px",
                              height: "28px",
                              backgroundColor: c.cardBg,
                              border: `1px solid ${c.border}`,
                              color: c.text,
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontWeight: "900",
                              fontSize: "14px",
                            }}
                          >
                            +
                          </button>
                        </div>

                        {/* Item Total & Remove */}
                        <div style={{ textAlign: "right", minWidth: "90px" }}>
                          <div style={{ fontSize: "16px", fontWeight: "900", color: c.text }}>
                            ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                          </div>
                          <button
                            onClick={() => {
                              const qty = item.quantity || 1;
                              removeFromCart(item.id);
                              stockMutation?.mutate && stockMutation.mutate({ productId: item.id, delta: qty });
                            }}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#EF4444",
                              fontSize: "11px",
                              fontWeight: "800",
                              cursor: "pointer",
                              marginTop: "6px",
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: ADDRESS VIEW */}
            {step === "address" && (
              <div
                style={{
                  backgroundColor: c.cardBg,
                  border: `1px solid ${c.border}`,
                  borderRadius: "16px",
                  padding: "24px",
                }}
              >
                <h2 style={{ fontSize: "20px", fontWeight: "900", color: c.text, marginTop: 0 }}>
                  Shipping & Delivery Address
                </h2>

                {savedAddress && !useNewAddress ? (
                  <div
                    style={{
                      border: "2px solid #10B981",
                      borderRadius: "12px",
                      padding: "18px",
                      backgroundColor: "rgba(16, 185, 129, 0.08)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "12px", fontWeight: "900", color: "#10B981" }}>
                        ✓ Default Saved Delivery Address
                      </span>
                      <button
                        onClick={() => setUseNewAddress(true)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#38BDF8",
                          fontSize: "12px",
                          fontWeight: "800",
                          cursor: "pointer",
                          textDecoration: "underline",
                        }}
                      >
                        Change Address
                      </button>
                    </div>
                    <div style={{ fontWeight: "900", color: c.text, fontSize: "15px" }}>
                      {savedAddress.name} ({savedAddress.phone})
                    </div>
                    <div style={{ color: c.subtext, fontSize: "13px" }}>
                      {savedAddress.street}, {savedAddress.city} - {savedAddress.pincode}
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSaveAddressAndContinue} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: c.text, marginBottom: "4px" }}>
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g. Rehana Shaik"
                          style={{
                            width: "100%",
                            padding: "10px 14px",
                            borderRadius: "8px",
                            border: `1px solid ${c.border}`,
                            backgroundColor: isDark ? "#030712" : "#FFFFFF",
                            color: c.text,
                            fontSize: "14px",
                            boxSizing: "border-box",
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: c.text, marginBottom: "4px" }}>
                          Mobile Number *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+91 98765 43210"
                          style={{
                            width: "100%",
                            padding: "10px 14px",
                            borderRadius: "8px",
                            border: `1px solid ${c.border}`,
                            backgroundColor: isDark ? "#030712" : "#FFFFFF",
                            color: c.text,
                            fontSize: "14px",
                            boxSizing: "border-box",
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: c.text, marginBottom: "4px" }}>
                        Flat, House No, Street Address *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.street}
                        onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                        placeholder="Flat 402, Guntur Main Road"
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: "8px",
                          border: `1px solid ${c.border}`,
                          backgroundColor: isDark ? "#030712" : "#FFFFFF",
                          color: c.text,
                          fontSize: "14px",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: c.text, marginBottom: "4px" }}>
                          City / District *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          placeholder="Guntur / Amaravati"
                          style={{
                            width: "100%",
                            padding: "10px 14px",
                            borderRadius: "8px",
                            border: `1px solid ${c.border}`,
                            backgroundColor: isDark ? "#030712" : "#FFFFFF",
                            color: c.text,
                            fontSize: "14px",
                            boxSizing: "border-box",
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: c.text, marginBottom: "4px" }}>
                          PIN Code *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.pincode}
                          onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                          placeholder="522001"
                          style={{
                            width: "100%",
                            padding: "10px 14px",
                            borderRadius: "8px",
                            border: `1px solid ${c.border}`,
                            backgroundColor: isDark ? "#030712" : "#FFFFFF",
                            color: c.text,
                            fontSize: "14px",
                            boxSizing: "border-box",
                          }}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      style={{
                        backgroundColor: "#10B981",
                        color: "#FFFFFF",
                        border: "none",
                        padding: "14px",
                        borderRadius: "10px",
                        fontWeight: "900",
                        fontSize: "14px",
                        cursor: "pointer",
                        marginTop: "8px",
                      }}
                    >
                      💾 Save Address & Continue to Payment ➔
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* STEP 3: PAYMENT & PAY LATER VIEW */}
            {step === "payment" && (
              <div
                style={{
                  backgroundColor: c.cardBg,
                  border: `1px solid ${c.border}`,
                  borderRadius: "16px",
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "18px",
                }}
              >
                <div>
                  <h2 style={{ fontSize: "20px", fontWeight: "900", color: c.text, margin: 0 }}>
                    Select Payment Method
                  </h2>
                  <p style={{ color: c.subtext, fontSize: "13px", marginTop: "4px" }}>
                    Choose Instant UPI, Card, Pay Later (0% interest), or Cash on Delivery.
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {[
                    {
                      id: "pay_later",
                      label: "R-Mart Pay Later (Buy Now, Pay in 30 Days @ 0% Interest)",
                      icon: "⏳",
                      tag: "RECOMMENDED",
                      desc: "Instant pre-approved $500 credit limit. No card or OTP needed.",
                    },
                    {
                      id: "upi",
                      label: "Instant UPI (Google Pay, PhonePe, Paytm, BHIM)",
                      icon: "⚡",
                      tag: "FASTEST",
                      desc: "Scan QR or enter UPI ID for 1-second auto confirmation.",
                    },
                    {
                      id: "card",
                      label: "Credit / Debit Card (Visa, Mastercard, RuPay, Amex)",
                      icon: "💳",
                      tag: "SECURE",
                      desc: "256-bit bank-grade encryption with instant OTP verification.",
                    },
                    {
                      id: "cod",
                      label: "Cash on Delivery (Pay cash/UPI at doorstep)",
                      icon: "💵",
                      tag: "DOORSTEP",
                      desc: "Pay when courier hands over your packages.",
                    },
                  ].map((p) => {
                    const isSelected = paymentMethod === p.id;
                    return (
                      <label
                        key={p.id}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "14px",
                          padding: "16px",
                          borderRadius: "12px",
                          backgroundColor: isSelected ? "rgba(245, 158, 11, 0.08)" : c.cardBg,
                          border: isSelected ? "2px solid #F59E0B" : `1px solid ${c.border}`,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={isSelected}
                          onChange={() => setPaymentMethod(p.id)}
                          style={{ marginTop: "4px", accentColor: "#F59E0B" }}
                        />
                        <span style={{ fontSize: "24px" }}>{p.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ fontWeight: "900", color: c.text, fontSize: "14px" }}>
                              {p.label}
                            </span>
                            <span
                              style={{
                                backgroundColor: isSelected ? "#F59E0B" : "rgba(56, 189, 248, 0.15)",
                                color: isSelected ? "#030712" : "#38BDF8",
                                fontSize: "10px",
                                fontWeight: "900",
                                padding: "2px 8px",
                                borderRadius: "6px",
                              }}
                            >
                              {p.tag}
                            </span>
                          </div>
                          <div style={{ color: c.subtext, fontSize: "12px", marginTop: "4px" }}>
                            {p.desc}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {/* Pay Later Special Highlight Banner */}
                {paymentMethod === "pay_later" && (
                  <div
                    style={{
                      backgroundColor: "rgba(245, 158, 11, 0.12)",
                      border: "1px solid #F59E0B",
                      borderRadius: "12px",
                      padding: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                    }}
                  >
                    <div style={{ fontSize: "28px" }}>⏳</div>
                    <div>
                      <div style={{ color: "#F59E0B", fontSize: "13px", fontWeight: "900" }}>
                        R-Mart Pay Later Active: Pre-Approved Limit $500.00
                      </div>
                      <div style={{ color: c.subtext, fontSize: "12px", marginTop: "2px" }}>
                        Zero interest, zero processing fee. You will have 30 days to pay after receipt of your items.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 4: SUCCESS VIEW */}
            {step === "success" && (
              <div
                style={{
                  backgroundColor: c.cardBg,
                  border: `1px solid ${c.border}`,
                  borderRadius: "16px",
                  padding: "48px 32px",
                  textAlign: "center",
                  maxWidth: "600px",
                  margin: "0 auto",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                }}
              >
                <div style={{ fontSize: "64px", marginBottom: "16px" }}>🎉</div>
                <h1 style={{ fontSize: "24px", fontWeight: "900", color: c.text, margin: "0 0 8px 0" }}>
                  Order Confirmed & Queued!
                </h1>
                <div
                  style={{
                    display: "inline-block",
                    backgroundColor: "rgba(16, 185, 129, 0.15)",
                    color: "#10B981",
                    padding: "6px 16px",
                    borderRadius: "20px",
                    fontWeight: "900",
                    fontSize: "13px",
                    marginBottom: "16px",
                  }}
                >
                  Order ID: #{orderId}
                </div>

                <div
                  style={{
                    backgroundColor: isDark ? "#030712" : "#F1F5F9",
                    border: `1px solid ${c.border}`,
                    borderRadius: "12px",
                    padding: "16px",
                    marginBottom: "24px",
                    textAlign: "left",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "12px", color: c.subtext }}>Payment Method:</span>
                    <strong style={{ fontSize: "12px", color: "#F59E0B" }}>
                      {paymentMethod === "pay_later" ? "R-Mart Pay Later (Due in 30 days)" : paymentMethod.toUpperCase()}
                    </strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "12px", color: c.subtext }}>Celery Background Worker:</span>
                    <strong style={{ fontSize: "12px", color: "#38BDF8" }}>
                      {lastOrder?.celery_task_id || "celery-worker-active"} (Task Dispatched)
                    </strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "12px", color: c.subtext }}>Delivery Estimate:</span>
                    <strong style={{ fontSize: "12px", color: "#10B981" }}>Guaranteed in 24-48 Hours</strong>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                  <button
                    onClick={() => {
                      if (lastOrder) openTracker(lastOrder);
                      handleClose();
                    }}
                    style={{
                      backgroundColor: "#10B981",
                      color: "#FFFFFF",
                      border: "none",
                      padding: "12px 24px",
                      borderRadius: "10px",
                      fontWeight: "900",
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    🚚 Track Order Live
                  </button>
                  <button
                    onClick={handleShopMore}
                    style={{
                      backgroundColor: c.primary,
                      color: "#030712",
                      border: "none",
                      padding: "12px 24px",
                      borderRadius: "10px",
                      fontWeight: "900",
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    🛍️ Shop More Products
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ================================================================
              RIGHT SIDEBAR: STICKY ORDER SUMMARY CARD (Steps 1, 2, 3)
              ================================================================ */}
          {step !== "success" && (
            <div
              style={{
                position: "sticky",
                top: "20px",
                backgroundColor: c.cardBg,
                border: `1px solid ${c.border}`,
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <h3 style={{ fontSize: "16px", fontWeight: "900", color: c.text, margin: 0 }}>
                Order Summary
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", borderBottom: `1px solid ${c.border}`, paddingBottom: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: c.subtext }}>Items Subtotal:</span>
                  <span style={{ fontWeight: "800", color: c.text }}>${subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: c.subtext }}>Delivery Fee:</span>
                  <span style={{ fontWeight: "800", color: delivery === 0 ? "#10B981" : c.text }}>
                    {delivery === 0 ? "FREE" : `$${delivery.toFixed(2)}`}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: c.subtext }}>Estimated GST (5%):</span>
                  <span style={{ fontWeight: "800", color: c.text }}>${tax.toFixed(2)}</span>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "16px", fontWeight: "900", color: c.text }}>Total Payable:</span>
                <span style={{ fontSize: "22px", fontWeight: "900", color: "#10B981" }}>
                  ${total.toFixed(2)}
                </span>
              </div>

              {/* Action Button for Current Step */}
              {step === "cart" && (
                <button
                  disabled={cart.length === 0}
                  onClick={() => { handleClose(); navigate("/checkout"); }}
                  style={{
                    backgroundColor: cart.length === 0 ? "#64748B" : c.primary,
                    color: "#030712",
                    border: "none",
                    padding: "14px",
                    borderRadius: "10px",
                    fontWeight: "900",
                    fontSize: "14px",
                    cursor: cart.length === 0 ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 15px rgba(245, 158, 11, 0.3)",
                  }}
                >
                  Proceed to Checkout ➔
                </button>
              )}

              {step === "address" && savedAddress && !useNewAddress && (
                <button
                  onClick={() => setStep("payment")}
                  style={{
                    backgroundColor: "#38BDF8",
                    color: "#030712",
                    border: "none",
                    padding: "14px",
                    borderRadius: "10px",
                    fontWeight: "900",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  Proceed to Payment ➔
                </button>
              )}

              {step === "payment" && (
                <button
                  onClick={handlePlaceOrder}
                  style={{
                    backgroundColor: paymentMethod === "pay_later" ? "#F59E0B" : "#10B981",
                    color: "#030712",
                    border: "none",
                    padding: "14px",
                    borderRadius: "10px",
                    fontWeight: "900",
                    fontSize: "14px",
                    cursor: "pointer",
                    boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)",
                  }}
                >
                  {paymentMethod === "pay_later" ? "⚡ Confirm with Pay Later (0% APR)" : "🚀 Pay & Place Order"}
                </button>
              )}

              <div style={{ fontSize: "11px", color: c.subtext, textAlign: "center", marginTop: "4px" }}>
                🔒 100% Purchase Protection & Free Returns
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
