import { useEffect, useState } from "react";
import axios from "axios";

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      const [mRes, oRes, tRes] = await Promise.all([
        axios.get("http://127.0.0.1:8000/api/v1/store/admin/metrics"),
        axios.get("http://127.0.0.1:8000/api/v1/store/orders"),
        axios.get("http://127.0.0.1:8000/api/v1/store/support")
      ]);
      setMetrics(mRes.data);
      setOrders(oRes.data);
      setTickets(tRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    await axios.patch(`http://127.0.0.1:8000/api/v1/store/orders/${orderId}/status`, { status: newStatus });
    fetchAdminData();
  };

  const handleTicketStatus = async (ticketId, newStatus) => {
    await axios.patch(`http://127.0.0.1:8000/api/v1/store/support/${ticketId}/status`, { status: newStatus });
    fetchAdminData();
  };

  if (loading) return <div style={{ padding: "2rem" }}>Loading Admin Deck...</div>;

  return (
    <div style={{ maxWidth: "1100px", margin: "2rem auto", padding: "0 1rem" }}>
      <h2>Admin Control Deck & Real-Time Operations</h2>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", margin: "1.5rem 0" }}>
        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "1.5rem", borderRadius: "10px" }}>
          <div style={{ color: "#1d4ed8", fontSize: "0.9rem", fontWeight: "600" }}>Total Orders</div>
          <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#1e3a8a" }}>{metrics?.total_orders || 0}</div>
        </div>
        <div style={{ background: "#fef3c7", border: "1px solid #fde68a", padding: "1.5rem", borderRadius: "10px" }}>
          <div style={{ color: "#b45309", fontSize: "0.9rem", fontWeight: "600" }}>Active Carts</div>
          <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#78350f" }}>{metrics?.active_carts || 0}</div>
        </div>
        <div style={{ background: "#fee2e2", border: "1px solid #fecaca", padding: "1.5rem", borderRadius: "10px" }}>
          <div style={{ color: "#b91c1c", fontSize: "0.9rem", fontWeight: "600" }}>Open Issues</div>
          <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#7f1d1d" }}>{metrics?.open_tickets || 0}</div>
        </div>
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "1.5rem", borderRadius: "10px" }}>
          <div style={{ color: "#15803d", fontSize: "0.9rem", fontWeight: "600" }}>Active Customers</div>
          <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#14532d" }}>{metrics?.active_customers || 0}</div>
        </div>
      </div>

      {/* Orders Management */}
      <h3 style={{ marginTop: "2rem" }}>Live Orders & Dispatch Management</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: "8px", overflow: "hidden", marginTop: "1rem", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
        <thead>
          <tr style={{ background: "#f8fafc", textAlign: "left", borderBottom: "1px solid #cbd5e1" }}>
            <th style={{ padding: "0.75rem 1rem" }}>ID</th>
            <th style={{ padding: "0.75rem 1rem" }}>Customer</th>
            <th style={{ padding: "0.75rem 1rem" }}>Product</th>
            <th style={{ padding: "0.75rem 1rem" }}>Amount</th>
            <th style={{ padding: "0.75rem 1rem" }}>Status Update</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
              <td style={{ padding: "0.75rem 1rem" }}>#{o.id}</td>
              <td style={{ padding: "0.75rem 1rem" }}>{o.user_email}</td>
              <td style={{ padding: "0.75rem 1rem" }}>{o.product_name}</td>
              <td style={{ padding: "0.75rem 1rem" }}>${(o.price * o.quantity).toFixed(2)}</td>
              <td style={{ padding: "0.75rem 1rem" }}>
                <select
                  value={o.status}
                  onChange={(e) => handleStatusChange(o.id, e.target.value)}
                  style={{ padding: "0.4rem", borderRadius: "6px", border: "1px solid #94a3b8" }}
                >
                  <option value="Order Placed">Order Placed</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Issues Management */}
      <h3 style={{ marginTop: "2.5rem" }}>Customer Issue Desk (Celery-Alerted)</h3>
      {tickets.length === 0 ? (
        <p style={{ color: "#64748b" }}>No tickets submitted.</p>
      ) : (
        <div style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
          {tickets.map((t) => (
            <div key={t.id} style={{ background: "#fff", padding: "1rem 1.5rem", borderRadius: "8px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong>#{t.id} - {t.subject}</strong> <span style={{ fontSize: "0.85rem", color: "#64748b" }}>({t.user_email} - Order #{t.order_id})</span>
                <p style={{ margin: "0.4rem 0", color: "#334155" }}>{t.message}</p>
              </div>
              <select
                value={t.status}
                onChange={(e) => handleTicketStatus(t.id, e.target.value)}
                style={{ padding: "0.4rem", borderRadius: "6px", border: "1px solid #94a3b8", background: t.status === "Open" ? "#fee2e2" : "#f0fdf4" }}
              >
                <option value="Open">Open</option>
                <option value="In Review">In Review</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}