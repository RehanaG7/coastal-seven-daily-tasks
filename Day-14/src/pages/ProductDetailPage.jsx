import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCartStore, useAuthStore, useUIStore } from "../store/useStore";

const CATALOG_DATA = [
  { id: 1, name: "Mechanical Gaming Keyboard RGB", price: 89.99, stock: 12, category: "Peripherals", image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500", description: "Hot-swappable tactile mechanical switches with per-key customizable RGB backlighting and durable PBT keycaps." },
  { id: 2, name: "Pro Precision Wireless Mouse", price: 49.99, stock: 8, category: "Peripherals", image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500", description: "Ultra-low latency 2.4GHz wireless gaming mouse with 20K DPI optical sensor and 70-hour battery life." },
  { id: 3, name: "27-Inch 165Hz Curved Monitor", price: 299.99, stock: 2, category: "Electronics", image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500", description: "Immersive 1500R curvature QHD display with 1ms response time, HDR400, and AMD FreeSync Premium." },
  { id: 4, name: "Active Noise-Cancelling Headphones", price: 179.99, stock: 0, category: "Electronics", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500", description: "Hybrid ANC technology with 40-hour playtime, quick USB-C charging, and spatial studio audio profile." },
  { id: 5, name: "Studio USB Condenser Microphone", price: 69.99, stock: 15, category: "Accessories", image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500", description: "Cardioid pickup pattern with built-in metal pop filter, gain dial, and zero-latency headphone monitoring." },
  { id: 6, name: "Ultra-Fast NVMe M.2 2TB SSD", price: 139.99, stock: 5, category: "Electronics", image: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500", description: "PCIe Gen 4.0 read speeds up to 7450 MB/s engineered for high-performance creative and gaming rigs." },
  { id: 7, name: "Braided 100W USB-C PD Cable", price: 14.99, stock: 35, category: "Accessories", image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500", description: "Reinforced ballistic nylon cord rated for 20,000+ bends, supporting 4K video and 100W Power Delivery." },
  { id: 8, name: "Ergonomic Memory Foam Wrist Rest", price: 22.99, stock: 19, category: "Accessories", image: "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=500", description: "Cooling-gel infused high-density memory foam designed to relieve wrist stress during all-day workflows." },
];

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const addToCart = useCartStore((s) => s.addToCart);
  const openCart = useCartStore((s) => s.openCart);
  const toggleWishlist = useCartStore((s) => s.toggleWishlist);
  const isWishlisted = useCartStore((s) => s.isWishlisted(Number(id)));

  const user = useAuthStore((s) => s.user);
  const theme = useUIStore((s) => s.theme);
  const isDark = theme === "dark";

  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState("reviews"); // default to reviews as requested

  // Customer Reviews State
  const [reviews, setReviews] = useState([
    { id: 1, author: "Rahul V.", rating: 5, date: "Yesterday", text: "Exceptional speed! Delivered within 24 hours in mint condition." },
    { id: 2, author: "Ananya S.", rating: 5, date: "3 days ago", text: "100% authentic genuine product. Packaging was super secure." },
    { id: 3, author: "Vikram M.", rating: 4, date: "1 week ago", text: "Great build quality, worked instantly out of the box." },
  ]);
  const [newReviewText, setNewReviewText] = useState("");
  const [newReviewAuthor, setNewReviewAuthor] = useState("");

  const targetId = Number(id);
  const customProducts = JSON.parse(localStorage.getItem("rmart_custom_products") || "[]");
  const fullCatalog = [...customProducts, ...CATALOG_DATA];
  const product = fullCatalog.find((p) => p.id === targetId || String(p.id) === String(id));

  const c = {
    bg: "#000000",
    card: "#0B0F19",
    border: "#1E293B",
    text: "#FFFFFF",
    sub: "#94A3B8",
  };

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

  const isStockout = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 3;
  const isAdmin = user?.role === "admin";

  const handleAddToCart = () => {
    addToCart(product, qty);
    openCart();
  };

  // Immediate "PLACE ORDER" (Buy Now)
  const handlePlaceOrderNow = () => {
    addToCart(product, qty);
    openCart();
  };

  const handleAddReview = (e) => {
    e.preventDefault();
    if (!newReviewText.trim()) return;
    const author = newReviewAuthor.trim() || user?.name || "Verified Customer";
    const rev = {
      id: Date.now(),
      author,
      rating: 5,
      date: "Just now",
      text: newReviewText.trim(),
    };
    setReviews([rev, ...reviews]);
    setNewReviewText("");
    setNewReviewAuthor("");
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
              <img src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              
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
              <button
                onClick={() => toggleWishlist(product)}
                style={{
                  position: "absolute",
                  top: "14px",
                  right: "14px",
                  width: "42px",
                  height: "42px",
                  borderRadius: "50%",
                  backgroundColor: isWishlisted ? "#DC2626" : "rgba(15, 23, 42, 0.75)",
                  border: `1px solid ${isWishlisted ? "#EF4444" : "rgba(255,255,255,0.2)"}`,
                  color: "#FFF",
                  fontSize: "18px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isWishlisted ? "❤️" : "🤍"}
              </button>
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

            {/* TAB SELECTOR: REVIEWS & SPECS */}
            <div style={{ display: "flex", gap: "12px", borderBottom: `1px solid ${c.border}`, marginBottom: "16px" }}>
              <button
                onClick={() => setActiveTab("reviews")}
                style={{
                  background: "none",
                  border: "none",
                  borderBottom: activeTab === "reviews" ? "3px solid #38BDF8" : "none",
                  color: activeTab === "reviews" ? "#38BDF8" : c.sub,
                  fontWeight: "900",
                  fontSize: "14px",
                  padding: "8px 12px",
                  cursor: "pointer",
                }}
              >
                Customer Reviews ({reviews.length})
              </button>
              <button
                onClick={() => setActiveTab("specs")}
                style={{
                  background: "none",
                  border: "none",
                  borderBottom: activeTab === "specs" ? "3px solid #38BDF8" : "none",
                  color: activeTab === "specs" ? "#38BDF8" : c.sub,
                  fontWeight: "900",
                  fontSize: "14px",
                  padding: "8px 12px",
                  cursor: "pointer",
                }}
              >
                Specifications
              </button>
            </div>

            {/* TAB CONTENT: REVIEWS */}
            {activeTab === "reviews" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px", maxHeight: "200px", overflowY: "auto" }}>
                {reviews.map((r) => (
                  <div key={r.id} style={{ fontSize: "12px", padding: "10px 14px", borderRadius: "10px", backgroundColor: isDark ? "#1E293B" : "#F1F5F9" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontWeight: "900", color: c.text }}>{r.author} (⭐⭐⭐⭐⭐)</span>
                      <span style={{ color: c.sub, fontSize: "11px" }}>{r.date}</span>
                    </div>
                    <div style={{ color: c.sub }}>{r.text}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: "13px", color: c.sub, display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
                <div>• <strong>Warranty:</strong> 1 Year Brand Replacement Warranty</div>
                <div>• <strong>Dispatch:</strong> Automated Micro-Warehouse Rapid Logistics</div>
                <div>• <strong>Returns:</strong> 7-Day Hassle-Free Return Policy</div>
              </div>
            )}

            {/* ACTION ROW: ROLE BASED (USERS: CART & BUY NOW, ADMIN: INVENTORY CONTROLS) */}
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
                      🛡️ Admin Mode (No Cart Option)
                    </div>
                    <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "2px" }}>
                      Current Stock: <strong style={{ color: "#FFF" }}>{product.stock}</strong> units
                    </div>
                  </div>
                  <button
                    onClick={() => navigate("/catalog")}
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
                    ← Back to Catalog
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {/* Quantity Control */}
                  {!isStockout && (
                    <div style={{ display: "flex", alignItems: "center", border: `1px solid ${c.border}`, borderRadius: "10px", overflow: "hidden" }}>
                      <button
                        onClick={() => setQty(Math.max(1, qty - 1))}
                        style={{ width: "40px", height: "46px", background: "none", border: "none", color: c.text, fontWeight: "900", cursor: "pointer", fontSize: "16px" }}
                      >
                        -
                      </button>
                      <span style={{ width: "40px", textAlign: "center", fontWeight: "900", color: c.text, fontSize: "15px" }}>
                        {qty}
                      </span>
                      <button
                        onClick={() => setQty(Math.min(product.stock, qty + 1))}
                        style={{ width: "40px", height: "46px", background: "none", border: "none", color: c.text, fontWeight: "900", cursor: "pointer", fontSize: "16px" }}
                      >
                        +
                      </button>
                    </div>
                  )}

                  {/* ADD TO CART */}
                  <button
                    onClick={handleAddToCart}
                    disabled={isStockout}
                    style={{
                      flex: 1,
                      backgroundColor: "#0B0F19",
                      color: "#FFFFFF",
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
                    }}
                  >
                    <span>🛒</span>
                    <span>Add to Cart</span>
                  </button>

                  {/* PLACE ORDER (BUY NOW) */}
                  <button
                    onClick={handlePlaceOrderNow}
                    disabled={isStockout}
                    style={{
                      flex: 1.2,
                      backgroundColor: isStockout ? "#334155" : "#F59E0B",
                      color: "#030712",
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
                    <span>PLACE ORDER NOW</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
