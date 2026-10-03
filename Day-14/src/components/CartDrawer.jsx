import React, { useState, useEffect } from "react";
import { useCartStore, useAuthStore, useUIStore } from "../store/useStore";
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

  const [paymentMethod, setPaymentMethod] = useState("upi");
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
    setOrderId(generatedId);

    const placedOrder = {
      orderId: generatedId,
      items: cart,
      total: total.toFixed(2),
      address: savedAddress || formData,
      paymentMethod,
      timestamp: new Date().toLocaleTimeString(),
      status: "Dispatched",
    };

    // Store in global admin orders pool
    const existingOrders = JSON.parse(localStorage.getItem("rmart_admin_orders") || "[]");
    localStorage.setItem("rmart_admin_orders", JSON.stringify([placedOrder, ...existingOrders]));

    // Trigger Admin & User Push Notification
    setOrderNotification(`🔔 Alert: Order #${generatedId} confirmed! Sent to Admin fulfillment dashboard.`);

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
    modalBg: isDark ? "#0F172A" : "#FFFFFF",
    cardBg: isDark ? "#1E293B" : "#F8FAFC",
    border: isDark ? "#334155" : "#E2E8F0",
    text: isDark ? "#F8FAFC" : "#0F172A",
    subtext: isDark ? "#94A3B8" : "#64748B",
    primary: "#F59E0B",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        justifyContent: "flex-end",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          height: "100%",
          backgroundColor: c.modalBg,
          borderLeft: `1px solid ${c.border}`,
          display: "flex",
          flexDirection: "column",
          boxShadow: "-8px 0 28px rgba(0, 0, 0, 0.35)",
        }}
      >
        {/* Sticky Header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: `1px solid ${c.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: c.modalBg,
          }}
        >
          <div>
            <div style={{ fontSize: "18px", fontWeight: "900", color: c.text }}>
              {step === "cart" && "Shopping Cart"}
              {step === "address" && "Select Delivery Address"}
              {step === "payment" && "Payment Options"}
              {step === "success" && "Order Placed"}
            </div>
            <div style={{ fontSize: "12px", color: c.subtext, marginTop: "2px" }}>
              {step === "cart" && `${cart.length} item(s) selected`}
              {step === "address" && "Amazon / Flipkart Safe Checkout"}
              {step === "payment" && "Encrypted & 100% Safe Payments"}
              {step === "success" && `ID: ${orderId}`}
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              color: c.text,
              cursor: "pointer",
              padding: "4px 8px",
            }}
          >
            ✕
          </button>
        </div>

        {/* Dynamic Push Notification Banner */}
        {orderNotification && (
          <div
            style={{
              backgroundColor: "#10B981",
              color: "#FFFFFF",
              padding: "10px 16px",
              fontSize: "12px",
              fontWeight: "800",
              textAlign: "center",
            }}
          >
            {orderNotification}
          </div>
        )}

        {/* Scrollable Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          
          {/* STEP 1: CART VIEW */}
          {step === "cart" && (
            <div>
              {cart.length === 0 ? (
                <div style={{ textAlign: "center", padding: "80px 20px" }}>
                  <div style={{ fontSize: "56px", marginBottom: "16px" }}>🛒</div>
                  <h3 style={{ color: c.text, margin: "0 0 8px 0" }}>Your cart is empty</h3>
                  <p style={{ color: c.subtext, fontSize: "14px", margin: "0 0 20px 0" }}>
                    Explore our catalog and add top-rated products!
                  </p>
                  <button
                    onClick={handleShopMore}
                    style={{
                      backgroundColor: c.primary,
                      color: "#000",
                      border: "none",
                      padding: "10px 24px",
                      borderRadius: "8px",
                      fontWeight: "900",
                      cursor: "pointer",
                    }}
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        gap: "12px",
                        padding: "12px",
                        backgroundColor: c.cardBg,
                        border: `1px solid ${c.border}`,
                        borderRadius: "10px",
                      }}
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{ width: "64px", height: "64px", objectFit: "cover", borderRadius: "6px" }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "14px", fontWeight: "800", color: c.text, lineHeight: 1.3 }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: "15px", fontWeight: "900", color: "#10B981", margin: "4px 0" }}>
                          ${item.price}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              style={{ width: "24px", height: "24px", cursor: "pointer", fontWeight: "bold" }}
                            >
                              -
                            </button>
                            <span style={{ fontWeight: "800", color: c.text, fontSize: "13px" }}>
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              style={{ width: "24px", height: "24px", cursor: "pointer", fontWeight: "bold" }}
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            style={{ background: "none", border: "none", color: "#EF4444", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Summary Box */}
                  <div
                    style={{
                      marginTop: "16px",
                      padding: "16px",
                      backgroundColor: c.cardBg,
                      border: `1px solid ${c.border}`,
                      borderRadius: "10px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      fontSize: "13px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", color: c.subtext }}>
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: c.subtext }}>
                      <span>Delivery Fee</span>
                      <span>{delivery === 0 ? "FREE" : `$${delivery}`}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: c.subtext }}>
                      <span>Estimated Tax (5%)</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <div
                      style={{
                        borderTop: `1px solid ${c.border}`,
                        paddingTop: "8px",
                        display: "flex",
                        justifyContent: "space-between",
                        fontWeight: "900",
                        fontSize: "16px",
                        color: c.text,
                      }}
                    >
                      <span>Order Total</span>
                      <span style={{ color: "#10B981" }}>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: ADDRESS VIEW */}
          {step === "address" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {savedAddress && !useNewAddress ? (
                <div
                  style={{
                    backgroundColor: c.cardBg,
                    border: "2px solid #3B82F6",
                    borderRadius: "10px",
                    padding: "16px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "900", color: "#3B82F6", textTransform: "uppercase" }}>
                      ✔ Default Saved Address
                    </span>
                    <button
                      onClick={() => setUseNewAddress(true)}
                      style={{ background: "none", border: "none", color: "#F59E0B", fontWeight: "800", fontSize: "12px", cursor: "pointer" }}
                    >
                      Change Address
                    </button>
                  </div>
                  <div style={{ fontWeight: "800", color: c.text }}>{savedAddress.name}</div>
                  <div style={{ color: c.subtext, fontSize: "13px", marginTop: "4px" }}>
                    {savedAddress.street}, {savedAddress.city} - {savedAddress.pincode}
                  </div>
                  <div style={{ color: c.subtext, fontSize: "13px", marginTop: "2px" }}>
                    Phone: {savedAddress.phone}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveAddressAndContinue} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: c.subtext }}>
                    Provide Delivery Destination (Will be saved for future orders):
                  </div>
                  <input
                    type="text"
                    placeholder="Receiver Full Name *"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{ padding: "12px", borderRadius: "8px", border: `1px solid ${c.border}`, backgroundColor: c.cardBg, color: c.text }}
                  />
                  <input
                    type="tel"
                    placeholder="10-digit Mobile Number *"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{ padding: "12px", borderRadius: "8px", border: `1px solid ${c.border}`, backgroundColor: c.cardBg, color: c.text }}
                  />
                  <input
                    type="text"
                    placeholder="Flat, House no., Building, Street *"
                    required
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    style={{ padding: "12px", borderRadius: "8px", border: `1px solid ${c.border}`, backgroundColor: c.cardBg, color: c.text }}
                  />
                  <div style={{ display: "flex", gap: "10px" }}>
                    <input
                      type="text"
                      placeholder="City *"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      style={{ flex: 1, padding: "12px", borderRadius: "8px", border: `1px solid ${c.border}`, backgroundColor: c.cardBg, color: c.text }}
                    />
                    <input
                      type="text"
                      placeholder="Pincode *"
                      required
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      style={{ flex: 1, padding: "12px", borderRadius: "8px", border: `1px solid ${c.border}`, backgroundColor: c.cardBg, color: c.text }}
                    />
                  </div>
                  {savedAddress && (
                    <button
                      type="button"
                      onClick={() => setUseNewAddress(false)}
                      style={{ background: "none", border: "none", color: c.subtext, fontSize: "12px", cursor: "pointer", textAlign: "left" }}
                    >
                      ← Use previously saved address
                    </button>
                  )}
                  <button
                    type="submit"
                    style={{
                      backgroundColor: "#3B82F6",
                      color: "#FFFFFF",
                      border: "none",
                      padding: "12px",
                      borderRadius: "8px",
                      fontWeight: "900",
                      fontSize: "14px",
                      cursor: "pointer",
                      marginTop: "10px",
                    }}
                  >
                    Save Address & Continue →
                  </button>
                </form>
              )}
            </div>
          )}

          {/* STEP 3: PAYMENT VIEW */}
          {step === "payment" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ fontSize: "13px", fontWeight: "700", color: c.subtext }}>
                Choose Payment Method:
              </div>

              {[
                { id: "upi", label: "Instant UPI (Google Pay, PhonePe, Paytm)", icon: "⚡" },
                { id: "card", label: "Credit / Debit Card", icon: "💳" },
                { id: "cod", label: "Cash on Delivery (Pay upon arrival)", icon: "💵" },
              ].map((p) => (
                <label
                  key={p.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "14px",
                    borderRadius: "10px",
                    backgroundColor: c.cardBg,
                    border: paymentMethod === p.id ? "2px solid #F59E0B" : `1px solid ${c.border}`,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === p.id}
                    onChange={() => setPaymentMethod(p.id)}
                  />
                  <span style={{ fontSize: "18px" }}>{p.icon}</span>
                  <span style={{ fontWeight: "800", color: c.text, fontSize: "13px" }}>{p.label}</span>
                </label>
              ))}

              <div
                style={{
                  marginTop: "12px",
                  padding: "12px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(16, 185, 129, 0.1)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  color: "#10B981",
                  fontSize: "12px",
                  fontWeight: "700",
                }}
              >
                🔒 Bank-grade SSL 256-bit encryption. Your details are never stored.
              </div>
            </div>
          )}

          {/* STEP 4: SUCCESS VIEW */}
          {step === "success" && (
            <div style={{ textAlign: "center", padding: "40px 10px" }}>
              <div style={{ fontSize: "64px", marginBottom: "16px" }}>🎉</div>
              <h2 style={{ fontSize: "22px", fontWeight: "900", color: c.text, margin: "0 0 8px 0" }}>
                Order Placed Successfully!
              </h2>
              <div
                style={{
                  display: "inline-block",
                  backgroundColor: "rgba(59, 130, 246, 0.15)",
                  color: "#3B82F6",
                  padding: "6px 14px",
                  borderRadius: "20px",
                  fontWeight: "800",
                  fontSize: "12px",
                  marginBottom: "16px",
                }}
              >
                Tracking ID: {orderId}
              </div>
              <p style={{ color: c.subtext, fontSize: "13px", lineHeight: 1.6, margin: "0 0 24px 0" }}>
                A confirmation alert has been pushed to the operations dashboard. Our dispatch crew is packing your shipment.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button
                  onClick={() => {
                    openTracker(lastOrder);
                    handleClose();
                  }}
                  style={{
                    backgroundColor: "#10B981",
                    color: "#FFFFFF",
                    border: "none",
                    padding: "14px 28px",
                    borderRadius: "10px",
                    fontWeight: "900",
                    fontSize: "14px",
                    cursor: "pointer",
                    width: "100%",
                    boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  <span>🚚</span>
                  <span>TRACK ORDER LIVE</span>
                </button>

                <button
                  onClick={handleShopMore}
                  style={{
                    backgroundColor: c.primary,
                    color: "#000000",
                    border: "none",
                    padding: "14px 28px",
                    borderRadius: "10px",
                    fontWeight: "900",
                    fontSize: "14px",
                    cursor: "pointer",
                    width: "100%",
                    boxShadow: "0 4px 14px rgba(245, 158, 11, 0.35)",
                  }}
                >
                  🛍️ Continue Shopping
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Action Footer */}
        {step !== "success" && cart.length > 0 && (
          <div
            style={{
              padding: "16px 24px",
              borderTop: `1px solid ${c.border}`,
              backgroundColor: c.modalBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: "11px", color: c.subtext, textTransform: "uppercase", fontWeight: "800" }}>Total Amount</div>
              <div style={{ fontSize: "20px", fontWeight: "900", color: "#10B981" }}>${total.toFixed(2)}</div>
            </div>

            {step === "cart" && (
              <button
                onClick={handleProceedToAddress}
                style={{
                  backgroundColor: c.primary,
                  color: "#000",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  fontWeight: "900",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Place Order →
              </button>
            )}

            {step === "address" && savedAddress && !useNewAddress && (
              <button
                onClick={() => setStep("payment")}
                style={{
                  backgroundColor: "#3B82F6",
                  color: "#FFF",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  fontWeight: "900",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Deliver Here →
              </button>
            )}

            {step === "payment" && (
              <button
                onClick={handlePlaceOrder}
                style={{
                  backgroundColor: "#10B981",
                  color: "#FFF",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  fontWeight: "900",
                  fontSize: "14px",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(16, 185, 129, 0.3)",
                }}
              >
                Pay & Place Order 🚀
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
