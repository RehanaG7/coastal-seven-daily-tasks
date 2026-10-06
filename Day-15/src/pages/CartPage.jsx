import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

export default function CartPage() {
  const { userEmail, isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const activeEmail = userEmail || localStorage.getItem("user_email") || "customer@store.com";

  const fetchCart = async () => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/v1/store/cart?user_email=${encodeURIComponent(activeEmail)}`);
      setCartItems(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    fetchCart();
  }, [activeEmail, isAuthenticated]);

  const changeQuantity = async (itemId, delta) => {
    try {
      await axios.patch(`http://127.0.0.1:8000/api/v1/store/cart/${itemId}/quantity`, { delta });
      fetchCart();
    } catch {
      alert("Failed to update quantity.");
    }
  };

  const handleRemove = async (itemId) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/api/v1/store/cart/${itemId}`);
      setCartItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch {
      alert("Failed to remove item.");
    }
  };

  const handleCheckoutAll = async () => {
    if (cartItems.length === 0) return;
    setPlacing(true);
    try {
      for (const item of cartItems) {
        await axios.post("http://127.0.0.1:8000/api/v1/store/orders", {
          user_email: activeEmail,
          product_name: item.product_name,
          price: Number(item.price),
          quantity: Number(item.quantity || 1),
        });
        await axios.delete(`http://127.0.0.1:8000/api/v1/store/cart/${item.id}`);
      }
      setMessage("Order placed successfully! Celery is dispatching confirmation emails. 🚀");
      setCartItems([]);
      setTimeout(() => navigate("/orders"), 1500);
    } catch (err) {
      alert("Checkout failed. Check backend connection.");
    } finally {
      setPlacing(false);
    }
  };

  const totalAmount = cartItems.reduce((acc, item) => acc + (Number(item.price) * (item.quantity || 1)), 0);

  if (loading) return <div style={{ padding: "2rem" }}>Loading cart...</div>;

  return (
    <div style={{ maxWidth: "900px", margin: "2rem auto", padding: "0 1rem" }}>
      <h2>Shopping Cart</h2>

      {message && (
        <div style={{ padding: "1rem", backgroundColor: "#dcfce7", color: "#166534", borderRadius: "8px", margin: "1rem 0", fontWeight: "600" }}>
          {message}
        </div>
      )}

      {cartItems.length === 0 ? (
        <div style={{ background: "#fff", padding: "3rem", borderRadius: "10px", textAlign: "center", marginTop: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          <p style={{ color: "#64748b", fontSize: "1.2rem" }}>Your cart is empty.</p>
          <Link to="/" style={{ display: "inline-block", marginTop: "1rem", background: "#2563eb", color: "#fff", padding: "0.6rem 1.4rem", borderRadius: "6px", textDecoration: "none", fontWeight: "600" }}>
            Explore Catalog
          </Link>
        </div>
      ) : (
        <div style={{ marginTop: "1.5rem", display: "grid", gap: "1rem" }}>
          {cartItems.map((item) => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", padding: "1.25rem", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", flexWrap: "wrap", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                {item.image_url && (
                  <img src={item.image_url} alt={item.product_name} style={{ width: "70px", height: "70px", objectFit: "cover", borderRadius: "8px" }} />
                )}
                <div>
                  <h4 style={{ margin: "0 0 0.25rem 0", fontSize: "1.1rem" }}>{item.product_name}</h4>
                  <div style={{ color: "#2563eb", fontWeight: "bold" }}>${Number(item.price).toFixed(2)} each</div>
                </div>
              </div>

              {/* Quantity Controls */}
              <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", border: "1px solid #cbd5e1", borderRadius: "6px", overflow: "hidden" }}>
                  <button
                    onClick={() => changeQuantity(item.id, -1)}
                    style={{ padding: "0.4rem 0.8rem", background: "#f8fafc", border: "none", cursor: "pointer", fontWeight: "bold" }}
                  >
                    -
                  </button>
                  <span style={{ padding: "0.4rem 1rem", fontWeight: "600", minWidth: "35px", textAlign: "center" }}>
                    {item.quantity || 1}
                  </span>
                  <button
                    onClick={() => changeQuantity(item.id, 1)}
                    style={{ padding: "0.4rem 0.8rem", background: "#f8fafc", border: "none", cursor: "pointer", fontWeight: "bold" }}
                  >
                    +
                  </button>
                </div>

                <div style={{ fontWeight: "bold", minWidth: "80px", textAlign: "right" }}>
                  ${(Number(item.price) * (item.quantity || 1)).toFixed(2)}
                </div>

                <button
                  onClick={() => handleRemove(item.id)}
                  style={{ background: "#fee2e2", color: "#b91c1c", border: "none", padding: "0.4rem 0.8rem", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {/* Subtotal & Checkout */}
          <div style={{ background: "#fff", padding: "1.5rem", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            <div>
              <span style={{ color: "#64748b", fontSize: "1rem" }}>Subtotal ({cartItems.reduce((acc, i) => acc + (i.quantity || 1), 0)} items): </span>
              <strong style={{ fontSize: "1.4rem", color: "#0f172a" }}>${totalAmount.toFixed(2)}</strong>
            </div>
            <button
              onClick={handleCheckoutAll}
              disabled={placing}
              style={{ background: "#16a34a", color: "#fff", border: "none", padding: "0.8rem 1.6rem", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "1rem" }}
            >
              {placing ? "Processing Order..." : "Proceed to Checkout"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}