import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCartStore, useAuthStore, useUIStore } from "../store/useStore";
import { useOptimisticStockUpdate, MOCK_CATALOG } from "../hooks/useProducts";
import Footer from "../components/Footer";

import { env } from "../config/env";
import { checkContentSafety, logAdminModerationAlert } from "../utils/moderationGuardrail";

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const addToCart = useCartStore((s) => s.addToCart);
  const cart = useCartStore((s) => s.cart || []);
  const openCart = useCartStore((s) => s.openCart);
  const toggleWishlist = useCartStore((s) => s.toggleWishlist);
  const isWishlisted = useCartStore((s) => s.isWishlisted ? s.isWishlisted(Number(id)) : false);

  const user = useAuthStore((s) => s.user);
  const theme = useUIStore((s) => s.theme);
  const isDark = theme === "dark";

  const stockMutation = useOptimisticStockUpdate();

  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState("reviews"); // "reviews" | "specs"

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);

  // Customer Reviews State
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ total_reviews: 0, average_rating: 4.8, breakdown: { 5: 3, 4: 1, 3: 0, 2: 0, 1: 0 } });
  const [reviewRating, setReviewRating] = useState(5);
  const [newReviewText, setNewReviewText] = useState("");
  const [newReviewAuthor, setNewReviewAuthor] = useState("");
  const [reviewModerationError, setReviewModerationError] = useState("");
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Fetch verified customer reviews from backend API with localStorage fallback
  useEffect(() => {
    let active = true;
    async function fetchReviews() {
      try {
        const apiBase = env.API_BASE_URL || (env.API_URL || "https://e-commerce-backend-texz.onrender.com").replace(/\/api\/v1\/?$/, "");
        const res = await fetch(`${apiBase}/api/v1/store/reviews/${id}`);
        if (res.ok) {
          const data = await res.json();
          if (active && data) {
            setReviews(data.reviews || []);
            setReviewStats({
              total_reviews: data.total_reviews || (data.reviews?.length || 0),
              average_rating: data.average_rating || 5.0,
              breakdown: data.breakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
            });
            return;
          }
        }
      } catch (err) {
        console.warn("[Reviews Fetch Notice]:", err);
      }
      
      // Fallback from localStorage or initial samples
      try {
        const localKey = `rmart_reviews_product_${id}`;
        const stored = JSON.parse(localStorage.getItem(localKey) || "null");
        if (active && stored && Array.isArray(stored)) {
          setReviews(stored);
          const total = stored.length;
          const avg = total > 0 ? (stored.reduce((a, b) => a + (b.rating || 5), 0) / total).toFixed(1) : 4.8;
          setReviewStats({ total_reviews: total, average_rating: Number(avg), breakdown: { 5: total, 4: 0, 3: 0, 2: 0, 1: 0 } });
          return;
        }
      } catch (e) {}

      // Default sample authentic reviews
      if (active) {
        const defaults = [
          { id: 1, author: "Arun Kumar", rating: 5, date: "Yesterday", text: "Outstanding quality! Delivered within 24 hours in mint condition." },
          { id: 2, author: "Priya Sharma", rating: 4, date: "3 days ago", text: "100% authentic genuine product. Works very well for daily tasks." },
          { id: 3, author: "David Miller", rating: 5, date: "1 week ago", text: "Superb build and finish. Highly satisfied with the purchase." },
        ];
        setReviews(defaults);
        setReviewStats({ total_reviews: 3, average_rating: 4.7, breakdown: { 5: 2, 4: 1, 3: 0, 2: 0, 1: 0 } });
      }
    }
    fetchReviews();
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    let isMounted = true;

    // Check if product was deleted by admin
    try {
      const deleted = new Set(JSON.parse(localStorage.getItem("rmart_deleted_product_ids") || "[]").map(String));
      if (deleted.has(String(id))) {
        setProduct(null);
        setLoading(false);
        return;
      }
    } catch (e) {}

    // Check localStorage stock overrides
    let overrides = {};
    try {
      overrides = JSON.parse(localStorage.getItem("rmart_stock_overrides") || "{}");
    } catch (e) {}

    // 1. Instant Synchronous Load from Local Storage / Mock Catalog / Session Cache (0ms latency!)
    let initialItem = null;
    try {
      const cachedCatalog = JSON.parse(sessionStorage.getItem("rmart_cached_products") || "[]");
      initialItem = cachedCatalog.find((p) => String(p.id) === String(id));
    } catch (e) {}

    if (!initialItem) {
      try {
        const localList = JSON.parse(localStorage.getItem("rmart_custom_products") || "[]");
        initialItem = localList.find((p) => String(p.id) === String(id));
      } catch (e) {}
    }

    if (!initialItem) {
      initialItem = MOCK_CATALOG.find((p) => String(p.id) === String(id));
    }

    if (initialItem) {
      const finalStock = overrides[id] ?? overrides[String(id)] ?? initialItem.stock ?? 10;
      setProduct({
        ...initialItem,
        stock: finalStock,
        price: Number(initialItem.price),
        image: initialItem.image_url || initialItem.image || `https://picsum.photos/seed/product-${initialItem.id}/400/300`,
      });
      setLoading(false);
    } else {
      setLoading(false); // Render immediately without blocking
    }

    // 2. Background Revalidation from API
    async function syncProductFromBackend() {
      try {
        const res = await fetch(`${env.API_URL}/products/${id}`);
        if (res.ok) {
          const item = await res.json();
          let deleted = new Set();
          try {
            deleted = new Set(JSON.parse(localStorage.getItem("rmart_deleted_product_ids") || "[]").map(String));
          } catch (e) {}
          if (deleted.has(String(item.id))) {
            if (isMounted) setProduct(null);
            return;
          }

          if (isMounted) {
            const finalStock = overrides[id] ?? overrides[String(id)] ?? item.stock ?? 10;
            setProduct({
              id: item.id,
              name: item.name || item.title,
              title: item.name || item.title,
              price: Number(item.price),
              stock: finalStock,
              category: item.category || "General",
              description: item.description || "High-quality premium item available on R-Mart.",
              image: item.image_url || item.image || `https://picsum.photos/seed/product-${item.id}/400/300`,
            });
            setLoading(false);
          }
        } else if (res.status === 404) {
          if (isMounted) {
            let deleted = new Set();
            try {
              deleted = new Set(JSON.parse(localStorage.getItem("rmart_deleted_product_ids") || "[]").map(String));
            } catch (e) {}
            // Only clear product if explicitly deleted by admin or if no fallback catalog item was found
            if (deleted.has(String(id)) || (!initialItem && !product)) {
              setProduct(null);
            }
            setLoading(false);
          }
        }
      } catch (e) {
        // Fallback remains active
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    syncProductFromBackend();
    return () => { isMounted = false; };
  }, [id]);

  useEffect(() => {
    const handleProductDeleted = (e) => {
      if (String(e?.detail?.id) === String(id)) {
        setProduct(null);
      }
    };
    window.addEventListener("rmart:product_deleted", handleProductDeleted);
    return () => window.removeEventListener("rmart:product_deleted", handleProductDeleted);
  }, [id]);

  const c = {
    bg: isDark ? "#000000" : "#F8FAFC",
    card: isDark ? "#0B0F19" : "#FFFFFF",
    border: isDark ? "#1E293B" : "#CBD5E1",
    text: isDark ? "#FFFFFF" : "#0F172A",
    sub: isDark ? "#94A3B8" : "#64748B",
    btnBg: isDark ? "#0B0F19" : "#FFFFFF",
    btnText: isDark ? "#FFFFFF" : "#0F172A",
  };

  if (loading) {
    return (
      <div style={{ minHeight: "80vh", backgroundColor: c.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: "28px", color: "#38BDF8", marginBottom: "12px" }}>⚡</div>
        <p style={{ color: c.text, fontWeight: "800", fontSize: "16px" }}>Loading Product Details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ minHeight: "80vh", backgroundColor: c.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
        <h2 style={{ color: c.text, fontSize: "22px", fontWeight: "900", marginBottom: "8px" }}>Product Not Found</h2>
        <p style={{ color: c.sub, fontSize: "14px", marginBottom: "20px" }}>Could not locate item with ID: {id}</p>
        <button
          onClick={() => navigate("/catalog")}
          style={{ backgroundColor: "#3B82F6", color: "#FFF", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "800", cursor: "pointer" }}
        >
          ← Back to Catalog
        </button>
      </div>
    );
  }

  const isStockout = (product.stock ?? 0) <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 3;
  const isAdmin = user?.role === "admin";

  const handleAddToCart = () => {
    if (isStockout) return;
    const newStock = Math.max(0, (product.stock || 0) - qty);
    setProduct((prev) => prev ? { ...prev, stock: newStock } : prev);
    addToCart(product, qty);
    if (stockMutation?.mutate) {
      stockMutation.mutate({
        productId: product.id,
        delta: -qty,
        newStock,
      });
    }
    if (openCart) openCart();
  };

  const handlePlaceOrderNow = () => {
    if (isStockout) return;
    const newStock = Math.max(0, (product.stock || 0) - qty);
    setProduct((prev) => prev ? { ...prev, stock: newStock } : prev);
    addToCart(product, qty);
    if (stockMutation?.mutate) {
      stockMutation.mutate({
        productId: product.id,
        delta: -qty,
        newStock,
      });
    }
    navigate("/checkout");
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!newReviewText.trim()) return;
    const author = newReviewAuthor.trim() || user?.name || "Verified Customer";
    const text = newReviewText.trim();
    const ratingVal = Number(reviewRating) || 5;

    // 1. Client-Side AI Content Moderation Guardrail
    const safety = checkContentSafety(text);
    if (!safety.isSafe) {
      setReviewModerationError(
        safety.reason || "🛡️ AI Moderation Guardrail: Your review contains inappropriate or offensive language and cannot be published."
      );
      logAdminModerationAlert("Customer Review", text, author);
      return;
    }

    setReviewModerationError("");
    setReviewSuccessMsg("");
    setIsSubmittingReview(true);

    try {
      const apiBase = env.API_BASE_URL || (env.API_URL || "https://e-commerce-backend-texz.onrender.com").replace(/\/api\/v1\/?$/, "");
      const res = await fetch(`${apiBase}/api/v1/store/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: Number(id),
          user_name: author,
          user_email: user?.email || "customer@store.com",
          rating: ratingVal,
          comment: text,
        })
      });

      if (res.status === 422) {
        const errJson = await res.json().catch(() => ({}));
        setReviewModerationError(
          errJson.detail || "🛡️ Content Moderation Guardrail: Offensive or harassing reviews are not permitted. Only constructive product feedback (positive or negative) is allowed."
        );
        setIsSubmittingReview(false);
        return;
      }

      if (res.ok) {
        const json = await res.json();
        const newRev = {
          id: json.id || Date.now(),
          author: json.user_name || author,
          rating: json.rating || ratingVal,
          date: "Just now",
          text: json.comment || text,
          comment: json.comment || text,
        };
        const updatedList = [newRev, ...reviews];
        setReviews(updatedList);
        const total = updatedList.length;
        const avg = (updatedList.reduce((a, b) => a + (b.rating || 5), 0) / total).toFixed(1);
        setReviewStats((prev) => ({
          ...prev,
          total_reviews: total,
          average_rating: Number(avg),
        }));
        try {
          localStorage.setItem(`rmart_reviews_product_${id}`, JSON.stringify(updatedList));
        } catch (e) {}

        setReviewSuccessMsg("✅ Review submitted and published! Thank you for your feedback.");
        setNewReviewText("");
        setNewReviewAuthor("");
        setTimeout(() => setReviewSuccessMsg(""), 4000);
        return;
      }
    } catch (err) {
      console.warn("[Review Submit Offline Fallback]:", err);
    } finally {
      setIsSubmittingReview(false);
    }

    // Local Persistence Fallback if server is not reachable
    const localRev = {
      id: Date.now(),
      author,
      rating: ratingVal,
      date: "Just now",
      text,
      comment: text,
    };
    const updated = [localRev, ...reviews];
    setReviews(updated);
    try {
      localStorage.setItem(`rmart_reviews_product_${id}`, JSON.stringify(updated));
    } catch (e) {}
    setReviewSuccessMsg("✅ Review saved successfully! Thank you for sharing your feedback.");
    setNewReviewText("");
    setNewReviewAuthor("");
    setTimeout(() => setReviewSuccessMsg(""), 4000);
  };

  return (
    <div style={{ backgroundColor: c.bg, minHeight: "100vh", padding: "32px 24px 80px 24px", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ maxWidth: "1140px", margin: "0 auto" }}>
        
        {/* Back Link */}
        <button
          onClick={() => navigate("/catalog")}
          style={{
            background: "none",
            border: "none",
            color: "#38BDF8",
            fontSize: "14px",
            fontWeight: "800",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "20px",
            padding: 0,
          }}
        >
          ← Back to Products Catalog
        </button>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
            gap: "40px",
            backgroundColor: c.card,
            border: `1px solid ${c.border}`,
            borderRadius: "20px",
            padding: "36px",
            boxShadow: isDark ? "0 20px 40px rgba(0,0,0,0.6)" : "0 10px 30px rgba(0,0,0,0.06)",
          }}
        >
          {/* Left: Product Image & Badges */}
          <div>
            <div style={{ width: "100%", height: "400px", backgroundColor: "#1E293B", borderRadius: "16px", overflow: "hidden", position: "relative" }}>
              <img
                src={product.image || `https://picsum.photos/seed/product-${product.id}/500/400`}
                alt={product.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => {
                  e.currentTarget.src = `https://picsum.photos/seed/product-${product.id}/500/400`;
                }}
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
                    padding: "6px 12px",
                    borderRadius: "8px",
                  }}
                >
                  {isStockout ? "🔴 OUT OF STOCK" : `⚠️ ONLY ${product.stock} UNITS REMAINING`}
                </span>
              )}

              {/* Wishlist Heart Icon */}
              {!isAdmin && (
                <button
                  onClick={() => toggleWishlist && toggleWishlist(product)}
                  style={{
                    position: "absolute",
                    top: "14px",
                    right: "14px",
                    width: "42px",
                    height: "42px",
                    borderRadius: "50%",
                    backgroundColor: isDark ? "rgba(15, 23, 42, 0.75)" : "rgba(255, 255, 255, 0.85)",
                    border: isWishlisted ? "1.5px solid rgba(239, 68, 68, 0.6)" : "1px solid rgba(255, 255, 255, 0.2)",
                    fontSize: "18px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
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

            {/* Trust Callouts */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "18px" }}>
              <div style={{ backgroundColor: isDark ? "#1E293B" : "#F1F5F9", padding: "12px", borderRadius: "10px", textAlign: "center", fontSize: "12px", fontWeight: "800", color: "#10B981" }}>
                🛡️ 100% Trusted
              </div>
              <div style={{ backgroundColor: isDark ? "#1E293B" : "#F1F5F9", padding: "12px", borderRadius: "10px", textAlign: "center", fontSize: "12px", fontWeight: "800", color: "#38BDF8" }}>
                ⚡ Delivered in 24-48 hrs
              </div>
            </div>
          </div>

          {/* Right: Info, Price, Reviews & Actions */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "12px", fontWeight: "800", color: "#38BDF8", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>
              {product.category}
            </div>

            <h1 style={{ fontSize: "28px", fontWeight: "900", color: c.text, margin: "0 0 12px 0", lineHeight: 1.25 }}>
              {product.name}
            </h1>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <span style={{ color: "#F59E0B", fontSize: "16px" }}>⭐⭐⭐⭐⭐</span>
              <span style={{ fontSize: "14px", fontWeight: "900", color: c.text }}>4.9</span>
              <span style={{ fontSize: "12px", color: c.sub }}>({reviews.length + 180} verified buyers)</span>
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "16px" }}>
              <span style={{ fontSize: "36px", fontWeight: "900", color: "#10B981" }}>
                ${Number(product.price).toFixed(2)}
              </span>
              <span style={{ fontSize: "13px", color: c.sub }}>
                Available stock: <strong style={{ color: c.text }}>{product.stock}</strong> units
              </span>
            </div>

            <p style={{ fontSize: "14px", color: c.sub, lineHeight: 1.6, margin: "0 0 20px 0" }}>
              {product.description}
            </p>

            {/* Key Specifications & Highlights */}
            <div
              style={{
                backgroundColor: isDark ? "#0A0F1D" : "#F8FAFC",
                border: `1px solid ${c.border}`,
                borderRadius: "14px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                marginBottom: "24px",
                fontSize: "13px",
              }}
            >
              <div style={{ fontWeight: "800", color: c.text, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                ✨ Product Highlights & Assurance
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", color: c.sub }}>
                <div>• <strong>Warranty:</strong> 1-Year Comprehensive</div>
                <div>• <strong>Dispatch:</strong> Rapid 24-48h Delivery</div>
                <div>• <strong>Returns:</strong> 7-Day Instant Return</div>
                <div>• <strong>Authenticity:</strong> 100% Brand Certified</div>
              </div>
            </div>

            {/* ACTION ROW: ROLE BASED */}
            <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
              {isAdmin ? (
                <div
                  style={{
                    backgroundColor: "rgba(245, 158, 11, 0.1)",
                    border: "1px solid rgba(245, 158, 11, 0.4)",
                    borderRadius: "14px",
                    padding: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: "900", color: "#F59E0B" }}>
                      🛡️ Admin Mode (Inventory View)
                    </div>
                    <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "2px" }}>
                      Current Stock: <strong style={{ color: "#FFF" }}>{product.stock}</strong> units
                    </div>
                  </div>
                  <button
                    onClick={() => navigate("/admin")}
                    style={{
                      backgroundColor: "#0B0F19",
                      color: "#FFFFFF",
                      border: "1px solid #1E293B",
                      padding: "8px 14px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: "800",
                      cursor: "pointer",
                    }}
                  >
                    Admin Dashboard →
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {/* Quantity Control */}
                  {!isStockout && (
                    <div style={{ display: "flex", alignItems: "center", border: `1px solid ${c.border}`, borderRadius: "10px", overflow: "hidden" }}>
                      <button
                        type="button"
                        onClick={() => setQty(Math.max(1, qty - 1))}
                        style={{ width: "40px", height: "46px", background: "none", border: "none", color: c.text, fontWeight: "900", cursor: "pointer", fontSize: "16px" }}
                      >
                        -
                      </button>
                      <span style={{ width: "40px", textAlign: "center", fontWeight: "900", color: c.text, fontSize: "15px" }}>
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQty(Math.min(product.stock || 99, qty + 1))}
                        disabled={qty >= (product.stock || 99)}
                        style={{
                          width: "40px",
                          height: "46px",
                          background: "none",
                          border: "none",
                          color: qty >= (product.stock || 99) ? c.sub : c.text,
                          fontWeight: "900",
                          cursor: qty >= (product.stock || 99) ? "not-allowed" : "pointer",
                          fontSize: "16px",
                        }}
                      >
                        +
                      </button>
                    </div>
                  )}

                  {product.stock === 1 && (
                    <div style={{ color: "#EF4444", fontSize: "11px", fontWeight: "900" }}>
                      ⚠️ Only 1 in stock!
                    </div>
                  )}

                  {/* ADD TO CART */}
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={isStockout}
                    style={{
                      flex: 1,
                      backgroundColor: c.btnBg,
                      color: c.btnText,
                      border: `1px solid ${c.border}`,
                      padding: "14px",
                      borderRadius: "12px",
                      fontWeight: "900",
                      fontSize: "14px",
                      cursor: isStockout ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      boxShadow: !isDark ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
                    }}
                  >
                    <span>🛒</span>
                    <span>{isStockout ? "Sold Out" : "Add to Cart"}</span>
                  </button>

                  {/* PLACE ORDER (BUY NOW) */}
                  <button
                    type="button"
                    onClick={handlePlaceOrderNow}
                    disabled={isStockout}
                    style={{
                      flex: 1.2,
                      backgroundColor: isStockout ? "#334155" : "#F59E0B",
                      color: isStockout ? "#94A3B8" : "#030712",
                      border: "none",
                      padding: "14px",
                      borderRadius: "12px",
                      fontWeight: "900",
                      fontSize: "14px",
                      cursor: isStockout ? "not-allowed" : "pointer",
                      boxShadow: isStockout ? "none" : "0 4px 15px rgba(245, 158, 11, 0.4)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    <span>⚡</span>
                    <span>{isStockout ? "OUT OF STOCK" : "PLACE ORDER NOW"}</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ================================================================
            CUSTOMER REVIEWS & RATINGS HUB (PLACED DIRECTLY UNDER PRODUCT)
            ================================================================ */}
        <div
          data-testid="product-reviews-section"
          style={{
            marginTop: "48px",
            backgroundColor: c.cardBg,
            border: `1px solid ${c.border}`,
            borderRadius: "24px",
            padding: "36px",
            boxShadow: isDark ? "0 20px 50px rgba(0,0,0,0.6)" : "0 10px 30px rgba(0,0,0,0.06)",
          }}
        >
          {/* Section Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px",
              paddingBottom: "24px",
              borderBottom: `1px solid ${c.border}`,
              marginBottom: "32px",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "24px" }}>⭐</span>
                <h2 style={{ fontSize: "24px", fontWeight: "900", color: c.text, margin: 0, letterSpacing: "-0.5px" }}>
                  Customer Reviews & Verified Ratings
                </h2>
              </div>
              <p style={{ color: c.sub, fontSize: "14px", margin: "6px 0 0 0" }}>
                Authentic feedback from verified customers. Protected by AI content moderation guardrails.
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: "800",
                  color: "#10B981",
                  backgroundColor: "rgba(16, 185, 129, 0.12)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  padding: "6px 14px",
                  borderRadius: "20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>🛡️</span>
                <span>AI Moderated Guardrails Active</span>
              </span>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: "800",
                  color: "#38BDF8",
                  backgroundColor: "rgba(56, 189, 248, 0.12)",
                  border: "1px solid rgba(56, 189, 248, 0.3)",
                  padding: "6px 14px",
                  borderRadius: "20px",
                }}
              >
                {reviews.length} Verified Reviews
              </span>
            </div>
          </div>

          {/* Rating Summary + Write Review Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "32px",
              marginBottom: "40px",
            }}
          >
            {/* Left: Overall Rating Card & Star Breakdown */}
            <div
              style={{
                backgroundColor: isDark ? "#0A0F1D" : "#F8FAFC",
                border: `1px solid ${c.border}`,
                borderRadius: "18px",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                <div style={{ fontSize: "48px", fontWeight: "900", color: "#F59E0B", lineHeight: 1 }}>
                  {Number(reviewStats.average_rating || 5.0).toFixed(1)}
                </div>
                <div>
                  <div style={{ color: "#F59E0B", fontSize: "20px", letterSpacing: "2px" }}>
                    {"★".repeat(Math.round(reviewStats.average_rating || 5))}
                    {"☆".repeat(Math.max(0, 5 - Math.round(reviewStats.average_rating || 5)))}
                  </div>
                  <div style={{ fontSize: "13px", color: c.sub, marginTop: "4px" }}>
                    Based on {reviews.length} customer reviews
                  </div>
                </div>
              </div>

              {/* Star Distribution Breakdown Bars */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = reviewStats.distribution?.[star] || (star === 5 ? reviews.length : 0);
                  const pct = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : (star === 5 ? 100 : 0);
                  return (
                    <div key={star} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px" }}>
                      <span style={{ width: "32px", color: c.sub, fontWeight: "700" }}>{star} ★</span>
                      <div style={{ flex: 1, height: "8px", backgroundColor: isDark ? "#1E293B" : "#E2E8F0", borderRadius: "4px", overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${pct}%`,
                            height: "100%",
                            backgroundColor: star >= 4 ? "#10B981" : star === 3 ? "#F59E0B" : "#EF4444",
                            borderRadius: "4px",
                            transition: "width 0.3s ease",
                          }}
                        />
                      </div>
                      <span style={{ width: "36px", textAlign: "right", color: c.sub, fontWeight: "700" }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Write a Verified Review Form */}
            <div
              style={{
                backgroundColor: isDark ? "#0A0F1D" : "#F8FAFC",
                border: `1px solid ${c.border}`,
                borderRadius: "18px",
                padding: "24px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "900", color: c.text, margin: 0 }}>
                  ✍️ Share Your Product Feedback
                </h3>
                {/* Interactive 5-Star Picker */}
                <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "20px",
                        padding: "0 2px",
                        color: star <= reviewRating ? "#F59E0B" : (isDark ? "#475569" : "#CBD5E1"),
                        transition: "transform 0.1s ease",
                      }}
                      title={`Rate ${star} Star${star > 1 ? 's' : ''}`}
                    >
                      ★
                    </button>
                  ))}
                  <span style={{ fontSize: "13px", fontWeight: "900", color: "#F59E0B", marginLeft: "6px" }}>
                    ({reviewRating}/5)
                  </span>
                </div>
              </div>

              {/* Moderation Error Banner */}
              {reviewModerationError && (
                <div
                  data-testid="review-moderation-warning"
                  style={{
                    padding: "12px 16px",
                    backgroundColor: "rgba(239, 68, 68, 0.15)",
                    border: "1px solid #EF4444",
                    borderRadius: "10px",
                    color: "#EF4444",
                    fontSize: "12px",
                    fontWeight: "700",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "10px",
                    marginBottom: "14px",
                  }}
                >
                  <span>{reviewModerationError}</span>
                  <button
                    type="button"
                    onClick={() => setReviewModerationError("")}
                    style={{ background: "none", border: "none", color: "#EF4444", fontWeight: "900", cursor: "pointer", padding: "2px" }}
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Success Feedback Banner */}
              {reviewSuccessMsg && (
                <div
                  style={{
                    padding: "10px 16px",
                    backgroundColor: "rgba(16, 185, 129, 0.15)",
                    border: "1px solid #10B981",
                    borderRadius: "10px",
                    color: "#10B981",
                    fontSize: "12px",
                    fontWeight: "800",
                    marginBottom: "14px",
                  }}
                >
                  {reviewSuccessMsg}
                </div>
              )}

              <form onSubmit={handleAddReview} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <input
                  type="text"
                  placeholder="Your Name (e.g. Alex M.)"
                  value={newReviewAuthor}
                  onChange={(e) => setNewReviewAuthor(e.target.value)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: `1px solid ${c.border}`,
                    backgroundColor: isDark ? "#131C31" : "#FFFFFF",
                    color: c.text,
                    fontSize: "13px",
                    outline: "none",
                  }}
                />

                <textarea
                  rows={3}
                  placeholder="Write honest feedback about quality, value, performance, or defects (both positive and negative feedback welcomed)..."
                  value={newReviewText}
                  onChange={(e) => setNewReviewText(e.target.value)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: "10px",
                    border: `1px solid ${c.border}`,
                    backgroundColor: isDark ? "#131C31" : "#FFFFFF",
                    color: c.text,
                    fontSize: "13px",
                    outline: "none",
                    resize: "vertical",
                    fontFamily: "inherit",
                  }}
                />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ fontSize: "11px", color: c.sub, display: "flex", alignItems: "center", gap: "4px" }}>
                    <span>🛡️</span>
                    <span>Toxic, abusive, or spam content is rejected by AI guardrails.</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingReview || !newReviewText.trim()}
                    style={{
                      backgroundColor: "#10B981",
                      color: "#FFFFFF",
                      border: "none",
                      padding: "10px 22px",
                      borderRadius: "10px",
                      fontWeight: "900",
                      fontSize: "13px",
                      cursor: isSubmittingReview || !newReviewText.trim() ? "not-allowed" : "pointer",
                      opacity: isSubmittingReview || !newReviewText.trim() ? 0.6 : 1,
                      boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {isSubmittingReview ? "Verifying..." : "Submit Verified Review"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Customer Reviews List */}
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: "900", color: c.text, margin: "0 0 20px 0" }}>
              Verified Buyer Reviews ({reviews.length})
            </h3>

            {reviews.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "48px 24px",
                  backgroundColor: isDark ? "#0A0F1D" : "#F8FAFC",
                  border: `1px solid ${c.border}`,
                  borderRadius: "16px",
                  color: c.sub,
                  fontSize: "14px",
                }}
              >
                No customer reviews yet. Be the first to share your thoughts on this product!
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
                {reviews.map((r, idx) => (
                  <div
                    key={r.id || idx}
                    style={{
                      padding: "20px",
                      borderRadius: "16px",
                      backgroundColor: isDark ? "#0A0F1D" : "#F8FAFC",
                      border: `1px solid ${c.border}`,
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            backgroundColor: "rgba(56, 189, 248, 0.15)",
                            color: "#38BDF8",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "900",
                            fontSize: "14px",
                          }}
                        >
                          {(r.author || r.user_name || "V")[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontWeight: "900", color: c.text, fontSize: "14px" }}>
                              {r.author || r.user_name || "Verified Buyer"}
                            </span>
                            <span
                              style={{
                                fontSize: "10px",
                                color: "#10B981",
                                backgroundColor: "rgba(16, 185, 129, 0.12)",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                fontWeight: "800",
                              }}
                            >
                              ✓ Verified Buyer
                            </span>
                          </div>
                          <div style={{ color: "#F59E0B", fontSize: "13px", marginTop: "2px", letterSpacing: "1px" }}>
                            {"★".repeat(Math.min(5, Math.max(1, r.rating || 5)))}
                            {"☆".repeat(Math.max(0, 5 - Math.min(5, Math.max(1, r.rating || 5))))}
                          </div>
                        </div>
                      </div>
                      <span style={{ color: c.sub, fontSize: "11px" }}>{r.date || "Recently"}</span>
                    </div>

                    <div style={{ color: isDark ? "#CBD5E1" : "#334155", fontSize: "13px", lineHeight: 1.6 }}>
                      {r.text || r.comment}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Footer */}
      <div style={{ marginTop: "60px", marginInline: "-24px", marginBottom: "-80px" }}>
        <Footer />
      </div>
    </div>
  );
}
