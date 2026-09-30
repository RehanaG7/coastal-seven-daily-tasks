import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function CreateProductPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("price", price);
      formData.append("stock", stock);

      if (imageFile) {
        formData.append("image_file", imageFile);
      } else if (imageUrl.trim()) {
        formData.append("image_url", imageUrl.trim());
      }

      await axios.post("http://127.0.0.1:8000/api/v1/products", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create product.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "560px", margin: "2rem auto", background: "#fff", padding: "2rem", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
      <h2 style={{ marginBottom: "1.5rem" }}>Upload New Product</h2>
      {error && <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", fontWeight: "600", marginBottom: "0.25rem" }}>Product Title</label>
          <input type="text" required style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #cbd5e1" }} value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", fontWeight: "600", marginBottom: "0.25rem" }}>Description</label>
          <textarea rows="3" required style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #cbd5e1" }} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", fontWeight: "600", marginBottom: "0.25rem" }}>Price ($)</label>
            <input type="number" step="0.01" required style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #cbd5e1" }} value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", fontWeight: "600", marginBottom: "0.25rem" }}>Stock Count</label>
            <input type="number" required style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #cbd5e1" }} value={stock} onChange={(e) => setStock(e.target.value)} />
          </div>
        </div>

        <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #94a3b8" }}>
          <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem" }}>Direct Image Upload (PC)</label>
          <input type="file" accept="image/*" onChange={handleFileChange} />
          {preview && (
            <div style={{ marginTop: "0.5rem" }}>
              <img src={preview} alt="Preview" style={{ height: "90px", borderRadius: "6px", objectFit: "cover" }} />
            </div>
          )}
          <div style={{ margin: "0.75rem 0", textAlign: "center", color: "#64748b", fontSize: "0.85rem" }}>— OR PASTE IMAGE URL —</div>
          <input type="url" placeholder="https://..." style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #cbd5e1" }} value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
        </div>

        <button type="submit" disabled={loading} style={{ width: "100%", padding: "0.75rem", background: "#2563eb", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}>
          {loading ? "Publishing..." : "Publish Product"}
        </button>
      </form>
    </div>
  );
}