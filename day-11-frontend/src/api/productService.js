import axiosClient from "./axiosClient";

export const productService = {
  getAll: async () => {
    const res = await axiosClient.get("/products");
    return res.data;
  },

  getById: async (id) => {
    const res = await axiosClient.get(`/products/${id}`);
    return res.data;
  },

  delete: async (id) => {
    const res = await axiosClient.delete(`/products/${id}`);
    return res.data;
  },
};