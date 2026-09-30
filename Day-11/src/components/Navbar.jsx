import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { isAuthenticated, isAdmin, userEmail, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 2rem", background: "#0f172a", color: "#fff" }}>
      <Link to="/" style={{ color: "#fff", textDecoration: "none", fontSize: "1.3rem", fontWeight: "bold" }}>
        ApexMart
      </Link>

      <div style={{ display: "flex", gap: "1.25rem", alignItems: "center" }}>
        <Link to="/" style={{ color: "#cbd5e1", textDecoration: "none" }}>Catalog</Link>

        {isAuthenticated ? (
          <>
            {!isAdmin && (
              <>
                <Link to="/cart" style={{ color: "#38bdf8", textDecoration: "none", fontWeight: "600" }}>
                  🛒 Cart
                </Link>
                <Link to="/orders" style={{ color: "#38bdf8", textDecoration: "none", fontWeight: "500" }}>
                  My Orders & Tracking
                </Link>
              </>
            )}

            {isAdmin && (
              <>
                <Link to="/admin" style={{ color: "#facc15", textDecoration: "none", fontWeight: "600" }}>
                  Admin Deck
                </Link>
                <Link to="/products/new" style={{ color: "#4ade80", textDecoration: "none", fontWeight: "600" }}>
                  + Add Product
                </Link>
              </>
            )}

            <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>{userEmail}</span>

            <button
              onClick={handleLogout}
              style={{
                background: "transparent",
                border: "1px solid #475569",
                color: "#fff",
                padding: "0.35rem 0.75rem",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={{ color: "#cbd5e1", textDecoration: "none" }}>Login</Link>
            <Link to="/register" style={{ color: "#cbd5e1", textDecoration: "none" }}>Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}