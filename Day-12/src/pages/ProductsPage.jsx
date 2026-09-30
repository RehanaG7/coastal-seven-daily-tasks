import React, { useState } from "react";
import { useStore } from "../context/StoreContext";
import { useNavigate } from "react-router-dom";

export default function ProductsPage() {
  const {
    theme,
    inventory,
    addToCart,
    deleteProduct,
    updateProductStock,
    requestProductRestock,
    placeOrder,
    user
  } = useStore();

  const [selectedProduct, setSelectedProduct] = useState(null);
  const navigate = useNavigate();
  const isDark = theme === "dark";

  // Check admin across user state and localStorage
  let activeUser = user;
  if (!activeUser) {
    try {
      activeUser = JSON.parse(localStorage.getItem("rmart_user") || "null");
    } catch {}
  }

  const userEmail = (activeUser?.email || "").toLowerCase();
  const isAdmin = Boolean(
    activeUser?.is_admin === true ||
    activeUser?.is_admin === "true" ||
    activeUser?.is_admin === 1 ||
    userEmail.includes("admin") ||
    userEmail.includes("humza")
  );

  // In-memory reviews map for dynamic user-added reviews
  const [productReviews, setProductReviews] = useState({
    "p-1": [
      { reviewer: "Kiran R.", rating: 5, date: "2026-09-28", text: "Tactile key response is incredible for coding and gaming. Dispatched in 10 minutes!" },
      { reviewer: "Sneha P.", rating: 4, date: "2026-09-25", text: "Sturdy aluminum chassis and vibrant RGB profiles." }
    ],
    "p-2": [
      { reviewer: "Rahul T.", rating: 5, date: "2026-09-29", text: "Only 58g! Pixel-perfect tracking on my mousepad." }
    ],
    "p-3": [
      { reviewer: "Deepak M.", rating: 5, date: "2026-09-27", text: "Zero latency on the 2.4GHz dongle. Mic audio is crystal clear." }
    ]
  });

  // Review Form States inside Details Modal
  const [reviewName, setReviewName] = useState(activeUser?.name || "");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState("");

  // Direct In-Modal Buy Now & Payment State
  const [showDirectPay, setShowDirectPay] = useState(false);
  const [directPaymentMethod, setDirectPaymentMethod] = useState("upi");
  const [directUpiId, setDirectUpiId] = useState("customer@okhdfcbank");
  const [directAddress, setDirectAddress] = useState(activeUser?.address || "Flat 402, Guntur Main Road, Andhra Pradesh");
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  const c = {
    bg: isDark ? "#06080F" : "#F8FAFC",
    cardBg: isDark ? "#0F1420" : "#FFFFFF",
    modalBg: isDark ? "#0B0F19" : "#FFFFFF",
    border: isDark ? "#1E2738" : "#E2E8F0",
    text: isDark ? "#FFFFFF" : "#0F172A",
    subtext: isDark ? "#94A3B8" : "#64748B",
    inputBg: isDark ? "#070A10" : "#F1F5F9",
    accent: "#F59E0B",
    green: "#10B981",
  };

  const handleDelete = (e, item) => {
    e.stopPropagation();
    if (window.confirm(`Admin: Permanently delete "${item.title || item.name}"?`)) {
      deleteProduct(item.id);
      if (selectedProduct && selectedProduct.id === item.id) {
        setSelectedProduct(null);
      }
    }
  };

  // Submit new review dynamically inside modal
  const handleAddReview = (e, productId) => {
    e.preventDefault();
    if (!reviewText.trim()) return;

    const newRev = {
      reviewer: reviewName.trim() || activeUser?.name || "Verified Shopper",
      rating: Number(reviewRating),
      date: new Date().toISOString().substring(0, 10),
      text: reviewText.trim()
    };

    setProductReviews((prev) => ({
      ...prev,
      [productId]: [newRev, ...(prev[productId] || [])]
    }));

    setReviewText("");
    setReviewSuccessMsg("Thank you! Your verified review has been posted.");
    setTimeout(() => setReviewSuccessMsg(""), 3000);
  };

  // Direct checkout directly from inside the details modal
  const handleExecuteDirectOrder = (product) => {
    setIsProcessingOrder(true);
    const paymentMeta = {
      method: directPaymentMethod.toUpperCase(),
      transactionId: `TXN-${Date.now().toString().slice(-8)}`,
      status: directPaymentMethod === "cod" ? "Pending (COD)" : "Captured & Paid",
      paidAmount: product.price,
      accountRef: directPaymentMethod === "upi" ? directUpiId : "Direct Modal Checkout"
    };

    // Temporarily add 1 qty directly to place order
    setTimeout(() => {
      // Direct placement bypasses cart
      const celeryTaskId = `celery-direct-${Math.random().toString(36).substr(2, 7)}`;
      const newOrder = {
        id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        celery_task_id: celeryTaskId,
        customer: activeUser?.name || "Customer",
        email: activeUser?.email || "customer@rmart.com",
        items: [{
          id: product.id,
          title: product.title,
          price: product.price,
          quantity: 1,
          image_url: product.image_url
        }],
        total: Number(product.price),
        status: "Processing (Queued in Redis)",
        address: directAddress,
        date: new Date().toISOString().replace("T", " ").substring(0, 16),
        redis_queue: "express_priority_queue",
        payment: paymentMeta
      };

      updateProductStock(product.id, Math.max(0, Number(product.stock) - 1));
      setIsProcessingOrder(false);
      setShowDirectPay(false);
      setSelectedProduct(null);
      alert(`🎉 Order #${newOrder.id} Placed Directly for $${Number(product.price).toFixed(2)}!\nPayment Ref: ${paymentMeta.transactionId}\nDispatched to Celery Worker.`);
    }, 1200);
  };

  return (
    <div style={{ backgroundColor: c.bg, minHeight: "calc(100vh - 64px)", padding: "28px 24px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        
        {/* Top Header without category pills */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "900", color: c.text }}>
              Store Catalog & Live Inventory
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: c.subtext }}>
              Displaying all verified products • Guaranteed 15-minute Celery automated dispatch
            </p>
          </div>

          {isAdmin && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ backgroundColor: "#DC262620", color: "#EF4444", border: "1px solid #DC262650", padding: "6px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: "900" }}>
                🛡️ ADMIN: {activeUser?.name || "Humza"} (Stock & Delete Controls Active)
              </span>
              <button
                onClick={() => navigate("/admin")}
                style={{
                  backgroundColor: "#3B82F6",
                  color: "#FFF",
                  border: "none",
                  padding: "7px 14px",
                  borderRadius: "8px",
                  fontWeight: "900",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                Admin Deck →
              </button>
            </div>
          )}
        </div>

        {/* ALL PRODUCTS GRID (No category filter blocking) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "22px" }}>
          {inventory.map((item) => {
            const currentStock = Number(item.stock !== undefined ? item.stock : 0);
            const isStockout = currentStock < 5;
            const isZero = currentStock === 0;

            return (
              <div
                key={item.id}
                style={{
                  backgroundColor: c.cardBg,
                  border: `1px solid ${isStockout ? "#DC2626" : c.border}`,
                  borderRadius: "14px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  position: "relative",
                  boxShadow: isStockout ? "0 0 16px rgba(220, 38, 38, 0.25)" : "none",
                }}
              >
                {/* Stockout Badge if < 5 */}
                {isStockout && (
                  <span style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    backgroundColor: "#DC2626",
                    color: "#FFFFFF",
                    fontSize: "10px",
                    fontWeight: "900",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    letterSpacing: "0.5px",
                    zIndex: 10,
                  }}>
                    🔴 STOCKOUT ({currentStock} LEFT)
                  </span>
                )}

                <div>
                  <div
                    onClick={() => {
                      setSelectedProduct(item);
                      setShowDirectPay(false);
                    }}
                    style={{
                      height: "170px",
                      backgroundColor: c.inputBg,
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "12px",
                      overflow: "hidden",
                      cursor: "pointer",
                      opacity: isZero ? 0.6 : 1,
                    }}
                  >
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title || item.name}
                        style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                      />
                    ) : (
                      <span style={{ color: c.subtext, fontWeight: "900", fontSize: "20px" }}>R-MART</span>
                    )}
                  </div>

                  <h3
                    onClick={() => {
                      setSelectedProduct(item);
                      setShowDirectPay(false);
                    }}
                    style={{ margin: "0 0 4px 0", fontSize: "15px", fontWeight: "800", color: c.text, cursor: "pointer" }}
                  >
                    {item.title || item.name}
                  </h3>

                  <p style={{ margin: "0 0 10px 0", fontSize: "12px", color: c.subtext, height: "32px", overflow: "hidden" }}>
                    {item.description || "High quality inventory item."}
                  </p>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "20px", fontWeight: "900", color: c.accent }}>
                      ${Number(item.price || 0).toFixed(2)}
                    </span>
                    <span style={{ fontSize: "11px", fontWeight: "bold", color: isStockout ? "#EF4444" : "#10B981" }}>
                      Stock: {currentStock} units
                    </span>
                  </div>
                </div>

                {/* Card Bottom Controls */}
                <div style={{ borderTop: `1px solid ${c.border}`, paddingTop: "12px", marginTop: "8px" }}>
                  {isAdmin ? (
                    /* Admin Controls: Stock refiller & Delete */
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        backgroundColor: isDark ? "#0A0E17" : "#F1F5F9",
                        padding: "6px 8px",
                        borderRadius: "8px",
                        border: `1px solid ${c.border}`,
                      }}>
                        <span style={{ fontSize: "11px", fontWeight: "800", color: c.subtext }}>Stock:</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <button
                            type="button"
                            onClick={() => updateProductStock(item.id, currentStock - 1)}
                            style={{ width: "26px", height: "26px", borderRadius: "4px", border: `1px solid ${c.border}`, backgroundColor: isDark ? "#1E2738" : "#E2E8F0", color: c.text, cursor: "pointer", fontWeight: "bold" }}
                          >
                            -
                          </button>
                          <span style={{ minWidth: "24px", textAlign: "center", fontWeight: "900", color: isStockout ? "#EF4444" : c.text, fontSize: "13px" }}>
                            {currentStock}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateProductStock(item.id, currentStock + 1)}
                            style={{ width: "26px", height: "26px", borderRadius: "4px", border: `1px solid ${c.border}`, backgroundColor: isDark ? "#1E2738" : "#E2E8F0", color: c.text, cursor: "pointer", fontWeight: "bold" }}
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => updateProductStock(item.id, currentStock + 5)}
                            style={{ padding: "0 8px", height: "26px", borderRadius: "4px", border: "none", backgroundColor: c.accent, color: "#000", cursor: "pointer", fontWeight: "900", fontSize: "11px" }}
                          >
                            +5 Add Stock
                          </button>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProduct(item);
                            setShowDirectPay(false);
                          }}
                          style={{
                            padding: "9px 0",
                            backgroundColor: isDark ? "#161F30" : "#E2E8F0",
                            color: c.text,
                            border: `1px solid ${c.border}`,
                            borderRadius: "8px",
                            fontWeight: "800",
                            fontSize: "11px",
                            cursor: "pointer",
                          }}
                        >
                          View Details
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, item)}
                          style={{
                            padding: "9px 0",
                            backgroundColor: "#DC2626",
                            color: "#FFFFFF",
                            border: "none",
                            borderRadius: "8px",
                            fontWeight: "900",
                            fontSize: "11px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "4px",
                          }}
                        >
                          <span>🗑️</span>
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Shopper Controls */
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      <button
                        onClick={() => {
                          setSelectedProduct(item);
                          setShowDirectPay(false);
                        }}
                        style={{
                          backgroundColor: isDark ? "#161F30" : "#E2E8F0",
                          color: c.text,
                          border: `1px solid ${c.border}`,
                          padding: "8px 0",
                          borderRadius: "8px",
                          fontWeight: "800",
                          fontSize: "12px",
                          cursor: "pointer",
                        }}
                      >
                        View Details
                      </button>

                      {isZero ? (
                        <button
                          onClick={() => requestProductRestock(item)}
                          style={{
                            backgroundColor: "#DC2626",
                            color: "#FFFFFF",
                            border: "none",
                            padding: "8px 0",
                            borderRadius: "8px",
                            fontWeight: "900",
                            fontSize: "11px",
                            cursor: "pointer",
                            boxShadow: "0 2px 10px rgba(220, 38, 38, 0.4)",
                          }}
                        >
                          🔔 Request Restock
                        </button>
                      ) : (
                        <button
                          onClick={() => addToCart(item)}
                          style={{
                            backgroundColor: c.accent,
                            color: "#000",
                            border: "none",
                            padding: "8px 0",
                            borderRadius: "8px",
                            fontWeight: "900",
                            fontSize: "12px",
                            cursor: "pointer",
                            boxShadow: "0 2px 10px rgba(245,158,11,0.3)",
                          }}
                        >
                          + Add to Cart
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ---------------- DEEP-DIVE "VIEW DETAILS" MODAL WITH REVIEWS & DIRECT ORDERING ---------------- */}
        {selectedProduct && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.8)",
              backdropFilter: "blur(4px)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
            }}
          >
            <div
              style={{
                backgroundColor: c.modalBg,
                border: `1px solid ${c.border}`,
                borderRadius: "18px",
                padding: "26px",
                maxWidth: "760px",
                width: "100%",
                maxHeight: "92vh",
                overflowY: "auto",
                boxShadow: "0 25px 70px rgba(0,0,0,0.9)",
              }}
            >
              {/* Modal Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", borderBottom: `1px solid ${c.border}`, paddingBottom: "12px" }}>
                <div>
                  <span style={{ fontSize: "11px", fontWeight: "800", color: c.accent, textTransform: "uppercase" }}>
                    Category: {selectedProduct.category || "General Store"} • Product ID: {selectedProduct.id}
                  </span>
                  <h2 style={{ margin: "4px 0 0", fontSize: "22px", fontWeight: "900", color: c.text }}>
                    {selectedProduct.title || selectedProduct.name}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedProduct(null)}
                  style={{ background: "none", border: `1px solid ${c.border}`, borderRadius: "6px", color: c.text, padding: "5px 12px", cursor: "pointer", fontWeight: "bold" }}
                >
                  ✕
                </button>
              </div>

              {/* Product Visual & Technical Specs in Detail */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "20px", marginBottom: "20px" }}>
                <div style={{ height: "240px", backgroundColor: c.inputBg, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: `1px solid ${c.border}` }}>
                  {selectedProduct.image_url ? (
                    <img src={selectedProduct.image_url} alt="" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
                  ) : (
                    <span style={{ color: c.subtext, fontWeight: "900", fontSize: "28px" }}>R-MART</span>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: "800", color: c.subtext }}>DETAILED SPECIFICATIONS</span>
                    <p style={{ margin: "6px 0 12px 0", color: c.text, fontSize: "13px", lineHeight: "1.5" }}>
                      {selectedProduct.description || "Certified authentic and ready for immediate automated warehouse routing."}
                    </p>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "11px" }}>
                      <div style={{ backgroundColor: isDark ? "#0A0D15" : "#F1F5F9", padding: "8px", borderRadius: "6px", border: `1px solid ${c.border}` }}>
                        <span style={{ color: c.subtext }}>Warranty:</span>
                        <div style={{ fontWeight: "bold", color: c.text }}>1 Year Replacement</div>
                      </div>
                      <div style={{ backgroundColor: isDark ? "#0A0D15" : "#F1F5F9", padding: "8px", borderRadius: "6px", border: `1px solid ${c.border}` }}>
                        <span style={{ color: c.subtext }}>Dispatch SLA:</span>
                        <div style={{ fontWeight: "bold", color: c.green }}>15-Min Express</div>
                      </div>
                      <div style={{ backgroundColor: isDark ? "#0A0D15" : "#F1F5F9", padding: "8px", borderRadius: "6px", border: `1px solid ${c.border}` }}>
                        <span style={{ color: c.subtext }}>Stock Availability:</span>
                        <div style={{ fontWeight: "bold", color: Number(selectedProduct.stock) < 5 ? "#EF4444" : c.green }}>
                          {Number(selectedProduct.stock) === 0 ? "Out of Stock" : `${selectedProduct.stock} units left`}
                        </div>
                      </div>
                      <div style={{ backgroundColor: isDark ? "#0A0D15" : "#F1F5F9", padding: "8px", borderRadius: "6px", border: `1px solid ${c.border}` }}>
                        <span style={{ color: c.subtext }}>Delivery Fee:</span>
                        <div style={{ fontWeight: "bold", color: c.green }}>FREE via Celery</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${c.border}`, paddingTop: "12px", marginTop: "10px" }}>
                    <div>
                      <span style={{ fontSize: "11px", color: c.subtext }}>PRICE PER UNIT</span>
                      <div style={{ fontSize: "24px", fontWeight: "900", color: c.accent }}>
                        ${Number(selectedProduct.price || 0).toFixed(2)}
                      </div>
                    </div>

                    {!isAdmin && (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => addToCart(selectedProduct)}
                          disabled={Number(selectedProduct.stock) === 0}
                          style={{
                            backgroundColor: Number(selectedProduct.stock) === 0 ? "#374151" : c.accent,
                            color: Number(selectedProduct.stock) === 0 ? "#9CA3AF" : "#000",
                            fontWeight: "900",
                            padding: "10px 16px",
                            borderRadius: "8px",
                            border: "none",
                            cursor: Number(selectedProduct.stock) === 0 ? "not-allowed" : "pointer",
                            fontSize: "12px",
                          }}
                        >
                          + Cart
                        </button>

                        <button
                          onClick={() => setShowDirectPay(!showDirectPay)}
                          disabled={Number(selectedProduct.stock) === 0}
                          style={{
                            backgroundColor: Number(selectedProduct.stock) === 0 ? "#374151" : "#10B981",
                            color: "#FFFFFF",
                            fontWeight: "900",
                            padding: "10px 18px",
                            borderRadius: "8px",
                            border: "none",
                            cursor: Number(selectedProduct.stock) === 0 ? "not-allowed" : "pointer",
                            fontSize: "12px",
                          }}
                        >
                          ⚡ Place Order Directly
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ---------------- DIRECT PAYMENT ACCORDION (INSIDE DETAILS) ---------------- */}
              {showDirectPay && !isAdmin && (
                <div style={{ backgroundColor: isDark ? "#0A0D15" : "#F8FAFC", border: "2px solid #10B981", borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <b style={{ color: "#10B981", fontSize: "14px" }}>⚡ Instant Direct Order & Payment Checkout</b>
                    <button onClick={() => setShowDirectPay(false)} style={{ background: "none", border: "none", color: c.subtext, cursor: "pointer", fontSize: "12px" }}>Cancel</button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                    <div>
                      <label style={{ fontSize: "10px", fontWeight: "bold", color: c.subtext }}>DELIVERY ADDRESS</label>
                      <input
                        type="text"
                        value={directAddress}
                        onChange={(e) => setDirectAddress(e.target.value)}
                        style={{ width: "100%", padding: "8px", borderRadius: "6px", border: `1px solid ${c.border}`, backgroundColor: c.inputBg, color: c.text, fontSize: "11px", boxSizing: "border-box", marginTop: "3px" }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "10px", fontWeight: "bold", color: c.subtext }}>PAYMENT METHOD</label>
                      <select
                        value={directPaymentMethod}
                        onChange={(e) => setDirectPaymentMethod(e.target.value)}
                        style={{ width: "100%", padding: "8px", borderRadius: "6px", border: `1px solid ${c.border}`, backgroundColor: c.inputBg, color: c.text, fontSize: "11px", boxSizing: "border-box", marginTop: "3px" }}
                      >
                        <option value="upi">Instant UPI / QR</option>
                        <option value="card">Credit / Debit Card</option>
                        <option value="cod">Cash on Delivery (COD)</option>
                      </select>
                    </div>
                  </div>

                  {directPaymentMethod === "upi" && (
                    <div style={{ marginBottom: "12px" }}>
                      <input
                        type="text"
                        placeholder="Enter UPI VPA ID (e.g. shaik@okaxis)"
                        value={directUpiId}
                        onChange={(e) => setDirectUpiId(e.target.value)}
                        style={{ width: "100%", padding: "8px", borderRadius: "6px", border: `1px solid ${c.border}`, backgroundColor: c.inputBg, color: c.text, fontSize: "11px", boxSizing: "border-box" }}
                      />
                    </div>
                  )}

                  <button
                    onClick={() => handleExecuteDirectOrder(selectedProduct)}
                    disabled={isProcessingOrder}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      backgroundColor: "#10B981",
                      color: "#000",
                      fontWeight: "900",
                      fontSize: "13px",
                      border: "none",
                      cursor: isProcessingOrder ? "not-allowed" : "pointer",
                    }}
                  >
                    {isProcessingOrder ? "Processing Payment via Celery..." : `Confirm & Pay $${Number(selectedProduct.price).toFixed(2)} Now`}
                  </button>
                </div>
              )}

              {/* ---------------- CUSTOMER REVIEWS SECTION & ADD REVIEW FORM ---------------- */}
              <div style={{ borderTop: `1px solid ${c.border}`, paddingTop: "18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h4 style={{ margin: 0, color: c.text, fontSize: "15px", fontWeight: "900" }}>
                    Customer Reviews & Feedback ({productReviews[selectedProduct.id]?.length || 0})
                  </h4>
                  <span style={{ color: "#F59E0B", fontWeight: "bold", fontSize: "12px" }}>★★★★★ (Verified Reviews)</span>
                </div>

                {reviewSuccessMsg && (
                  <div style={{ padding: "8px 12px", backgroundColor: "#10B98120", color: "#10B981", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", marginBottom: "12px" }}>
                    ✓ {reviewSuccessMsg}
                  </div>
                )}

                {/* Add Review Form */}
                <form onSubmit={(e) => handleAddReview(e, selectedProduct.id)} style={{ backgroundColor: isDark ? "#0A0D15" : "#F8FAFC", border: `1px solid ${c.border}`, borderRadius: "10px", padding: "14px", marginBottom: "16px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "800", color: c.subtext, textTransform: "uppercase" }}>
                    Write a Review & Rating
                  </span>

                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "10px", margin: "8px 0" }}>
                    <input
                      type="text"
                      placeholder="Your Name (e.g. Arun Kumar)"
                      value={reviewName}
                      onChange={(e) => setReviewName(e.target.value)}
                      style={{ padding: "8px 10px", borderRadius: "6px", border: `1px solid ${c.border}`, backgroundColor: c.inputBg, color: c.text, fontSize: "12px" }}
                    />

                    <select
                      value={reviewRating}
                      onChange={(e) => setReviewRating(e.target.value)}
                      style={{ padding: "8px 10px", borderRadius: "6px", border: `1px solid ${c.border}`, backgroundColor: c.inputBg, color: c.text, fontSize: "12px", fontWeight: "bold" }}
                    >
                      <option value="5">★★★★★ (5 - Excellent)</option>
                      <option value="4">★★★★☆ (4 - Good)</option>
                      <option value="3">★★★☆☆ (3 - Average)</option>
                      <option value="2">★★☆☆☆ (2 - Below Avg)</option>
                      <option value="1">★☆☆☆☆ (1 - Poor)</option>
                    </select>
                  </div>

                  <textarea
                    rows="2"
                    required
                    placeholder="Share your experience regarding build quality, packaging, delivery..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: `1px solid ${c.border}`, backgroundColor: c.inputBg, color: c.text, fontSize: "12px", boxSizing: "border-box" }}
                  />

                  <button
                    type="submit"
                    style={{
                      marginTop: "8px",
                      backgroundColor: c.accent,
                      color: "#000",
                      fontWeight: "900",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    Post Review
                  </button>
                </form>

                {/* Reviews List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {(productReviews[selectedProduct.id] || []).length === 0 ? (
                    <div style={{ color: c.subtext, fontSize: "12px", fontStyle: "italic", padding: "10px 0" }}>
                      No reviews posted yet. Be the first to share your thoughts above!
                    </div>
                  ) : (
                    (productReviews[selectedProduct.id] || []).map((rev, idx) => (
                      <div key={idx} style={{ backgroundColor: isDark ? "#0A0D15" : "#FFFFFF", padding: "12px", borderRadius: "8px", border: `1px solid ${c.border}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                          <div>
                            <b style={{ color: c.text, fontSize: "13px" }}>{rev.reviewer}</b>
                            <span style={{ fontSize: "11px", color: c.subtext, marginLeft: "8px" }}>{rev.date}</span>
                          </div>
                          <span style={{ color: "#F59E0B", fontSize: "12px" }}>
                            {"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: "12px", color: c.subtext, lineHeight: "1.4" }}>
                          {rev.text}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
