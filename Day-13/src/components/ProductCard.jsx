import { Link } from "react-router-dom";

export default function ProductCard({ id, name, price, stock, imageUrl }) {
  const fallback = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500";
  const displayImage = imageUrl && imageUrl.trim() !== "" ? imageUrl : fallback;

  return (
    <div style={{ background: "#fff", borderRadius: "10px", overflow: "hidden", boxShadow: "0 2px 6px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column" }}>
      <img
        src={displayImage}
        alt={name}
        onError={(e) => { e.target.onerror = null; e.target.src = fallback; }}
        style={{ width: "100%", height: "180px", objectFit: "cover" }}
      />
      <div style={{ padding: "1rem", display: "flex", flexDirection: "column", flex: 1 }}>
        <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem" }}>{name}</h4>
        <div style={{ color: "#2563eb", fontWeight: "bold", fontSize: "1.2rem", marginBottom: "0.5rem" }}>
          ${Number(price).toFixed(2)}
        </div>
        <div style={{ fontSize: "0.85rem", color: stock > 0 ? "#16a34a" : "#dc2626", marginBottom: "1rem" }}>
          {stock > 0 ? `In Stock (${stock})` : "Out of Stock"}
        </div>
        <Link
          to={`/products/${id}`}
          style={{
            marginTop: "auto",
            display: "block",
            textAlign: "center",
            padding: "0.5rem",
            background: "#2563eb",
            color: "#fff",
            textDecoration: "none",
            borderRadius: "6px",
            fontWeight: "600",
          }}
        >
          View Details
        </Link>
      </div>
    </div>
  );
}