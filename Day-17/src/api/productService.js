import apiClient from "./apiClient";

export const productService = {
  getProducts: async () => {
    try {
      const response = await apiClient.get("/products");
      return response.data;
    } catch (err) {
      console.warn("Failed fetching from backend, falling back to local state:", err);
      return [];
    }
  },

  createProduct: async (productData) => {
    const response = await apiClient.post("/products", productData);
    return response.data;
  },

  deleteProduct: async (productId) => {
    const response = await apiClient.delete(`/products/${productId}`);
    return response.data;
  },

  updateStock: async (productId, newStock) => {
    const response = await apiClient.patch(`/products/${productId}/stock`, { stock: newStock });
    return response.data;
  }
};
