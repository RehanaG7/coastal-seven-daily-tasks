import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { productService } from "../api/productService";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, userEmail } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const activeEmail = userEmail || localStorage.getItem("user_email") || "customer@store.com";

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await productService.getById(id);
        setProduct(data);
      } catch (err) {
        setError("Product not found or unavailable.");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) return navigate("/login");
    setBusy(true);
    try {
      await axios.post("http://127.0.0.1:8000/api/v1/store/cart", {
        user_email: activeEmail,
        product_id: product.id,
        product_name: product.name,
        price: Number(product.price),
        quantity: 1,
        image_url: product.image_url || "",
      });
      setMessage(`Added "${product.name}" to cart! 🛒`);
      setTimeout(() => setMessage(""), 3000);
    } catch {
      alert("Failed to add product to cart.");
    } finally {
      setBusy(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!isAuthenticated) return navigate("/login");
    setBusy(true);
    try {
      await axios.post("http://127.0.0.1:8000/api/v1/store/orders", {
        user_email: activeEmail,
        product_name: product.name,
        price: Number(product.price),
        quantity: 1,
      });
      setMessage(`Order placed successfully! Celery is dispatching confirmation. 🚀`);
      setTimeout(() => navigate("/orders"), 1200);
    } catch {
      alert("Failed to place order.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await productService.delete(id);
      navigate("/");
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete product.");
    }
  };

  if (loading) return <div style={{ padding: "2rem" }}>Loading product details...</div>;
  if (error) return <div style={{ padding: "2rem", color: "red" }}>{error}</div>;
  if (!product) return null;

  const rawUrl = product.image_url;
  const placeholder = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500";
  const displayImage = rawUrl && rawUrl.trim() !== "" ? rawUrl : placeholder;

  return (
    <div style={{ maxWidth: "1000px", margin: "2rem auto", padding: "0 1rem" }}>
      <Link to="/" style={{ textDecoration: "none", color: "#2563eb", fontWeight: "500" }}>
        &larr; Back to Products
      </Link>

      {message && (
        <div style={{ marginTop: "1rem", padding: "1rem", backgroundColor: "#dcfce7", color: "#166534", borderRadius: "8px", fontWeight: "600" }}>
          {message}
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "2.5rem", marginTop: "1.5rem", background: "#ffffff", padding: "2rem", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
        <div style={{ flex: "1 1 350px", textAlign: "center" }}>
          <img
            src={displayImage}
            alt={product.name}
            onError={(e) => { e.target.onerror = null; e.target.src = placeholder; }}
            style={{ width: "100%", maxHeight: "380px", objectFit: "cover", borderRadius: "8px" }}
          />
        </div>

        <div style={{ flex: "1 1 400px", display: "flex", flexDirection: "column" }}>
          <h1 style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>{product.name}</h1>
          <p style={{ fontSize: "1.5rem", fontWeight: "700", color: "#2563eb", margin: "0.5rem 0" }}>
            ${Number(product.price).toFixed(2)}
          </p>
          <p style={{ color: "#475569", lineHeight: "1.6", margin: "1rem 0" }}>{product.description}</p>
          <p style={{ fontWeight: "600", marginBottom: "1.5rem" }}>
            Status: {product.stock > 0 ? <span style={{ color: "#16a34a" }}>In Stock ({product.stock})</span> : <span style={{ color: "#dc2626" }}>Out of Stock</span>}
          </p>

          <div style={{ display: "flex", gap: "1rem", marginTop: "auto" }}>
            {!isAdmin && product.stock > 0 && (
              <>
                <button
                  onClick={handleAddToCart}
                  disabled={busy}
                  style={{ backgroundColor: "#f8fafc", color: "#0f172a", border: "1px solid #cbd5e1", padding: "0.75rem 1.5rem", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}
                >
                  {busy ? "Updating..." : "Add to Cart"}
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={busy}
                  style={{ backgroundColor: "#2563eb", color: "#ffffff", border: "none", padding: "0.75rem 1.5rem", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}
                >
                  {busy ? "Placing..." : "Place Order"}
                </button>
              </>
            )}

            {isAdmin && (
              <button
                onClick={handleDelete}
                style={{ backgroundColor: "#dc2626", color: "#ffffff", border: "none", padding: "0.75rem 1.5rem", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}
              >
                Delete Product
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}