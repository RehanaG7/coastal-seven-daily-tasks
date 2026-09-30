import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="container" style={{ textAlign: "center", marginTop: "4rem" }}>
      <h1>404</h1>
      <p style={{ margin: "1rem 0" }}>The page you requested could not be found.</p>
      <Link to="/" style={{ color: "#2563eb" }}>Return Home</Link>
    </div>
  );
}