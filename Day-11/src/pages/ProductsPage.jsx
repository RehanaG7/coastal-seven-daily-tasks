import { useEffect, useState } from "react";
import { productService } from "../api/productService";
import ProductCard from "../components/ProductCard";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const data = await productService.getAll();
        setProducts(data);
      } catch (err) {
        setError("Unable to load product catalog from backend.");
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  if (loading) return <div style={{ padding: "2rem", textAlign: "center" }}>Loading catalog...</div>;
  if (error) return <div style={{ padding: "2rem", color: "red", textAlign: "center" }}>{error}</div>;

  return (
    <div style={{ maxWidth: "1200px", margin: "2rem auto", padding: "0 1rem" }}>
      <h2 style={{ marginBottom: "1.5rem" }}>Featured Products</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1.5rem" }}>
        {products.map((p) => (
          <ProductCard
            key={p.id}
            id={p.id}
            name={p.name}
            price={p.price}
            stock={p.stock}
            imageUrl={p.image_url}
          />
        ))}
      </div>
    </div>
  );
}