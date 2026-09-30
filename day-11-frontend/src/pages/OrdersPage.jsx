import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ticketModal, setTicketModal] = useState(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState("");

  const userEmail = localStorage.getItem("user_email") || "customer@store.com";

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get(`http://127.0.0.1:8000/api/v1/store/orders?user_email=${encodeURIComponent(userEmail)}`);
        setOrders(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [userEmail]);

  const handleRaiseTicket = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://127.0.0.1:8000/api/v1/store/support", {
        user_email: userEmail,
        order_id: ticketModal.id,
        subject,
        message,
      });
      setSubmitted("Support ticket raised! Celery notified the admin desk.");
      setTimeout(() => {
        setTicketModal(null);
        setSubmitted("");
        setSubject("");
        setMessage("");
      }, 2500);
    } catch {
      alert("Error submitting ticket.");
    }
  };

  const stages = ["Order Placed", "Shipped", "Out for Delivery", "Delivered"];

  if (loading) return <div style={{ padding: "2rem" }}>Loading orders...</div>;

  return (
    <div style={{ maxWidth: "900px", margin: "2rem auto", padding: "0 1rem" }}>
      <h2>My Orders & Live Package Tracking</h2>
      {orders.length === 0 ? (
        <p style={{ marginTop: "1rem" }}>You haven't placed any orders yet. <Link to="/">Start shopping</Link></p>
      ) : (
        orders.map((o) => {
          const currentStageIndex = stages.indexOf(o.status);

          return (
            <div key={o.id} style={{ background: "#fff", padding: "1.5rem", borderRadius: "10px", margin: "1.5rem 0", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.75rem" }}>
                <div>
                  <strong>Order #{o.id}</strong> — {o.product_name} (x{o.quantity})
                  <div style={{ color: "#64748b", fontSize: "0.85rem" }}>Total: ${Number(o.price * o.quantity).toFixed(2)}</div>
                </div>
                <button
                  onClick={() => setTicketModal(o)}
                  style={{ background: "#fee2e2", color: "#b91c1c", border: "none", padding: "0.4rem 0.8rem", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "0.85rem" }}
                >
                  Raise Issue / Support
                </button>
              </div>

              {/* Stepper */}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.5rem" }}>
                {stages.map((st, idx) => {
                  const isDone = currentStageIndex >= idx;
                  return (
                    <div key={st} style={{ textAlign: "center", flex: 1 }}>
                      <div style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: isDone ? "#16a34a" : "#cbd5e1",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 0.5rem auto",
                        fontWeight: "bold",
                        fontSize: "0.8rem"
                      }}>
                        {isDone ? "✓" : idx + 1}
                      </div>
                      <span style={{ fontSize: "0.8rem", color: isDone ? "#0f172a" : "#94a3b8", fontWeight: isDone ? "600" : "normal" }}>{st}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}

      {ticketModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", padding: "2rem", borderRadius: "10px", width: "450px" }}>
            <h3>Report Issue for Order #{ticketModal.id}</h3>
            {submitted && <div style={{ color: "#16a34a", margin: "1rem 0" }}>{submitted}</div>}
            <form onSubmit={handleRaiseTicket}>
              <input
                type="text"
                placeholder="Issue Subject"
                required
                style={{ width: "100%", padding: "0.6rem", margin: "1rem 0", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
              <textarea
                placeholder="Describe your issue..."
                required
                rows={4}
                style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setTicketModal(null)} style={{ padding: "0.5rem 1rem", border: "none", background: "#e2e8f0", borderRadius: "6px", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "0.5rem 1rem", border: "none", background: "#dc2626", color: "#fff", borderRadius: "6px", cursor: "pointer" }}>Submit Issue</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}