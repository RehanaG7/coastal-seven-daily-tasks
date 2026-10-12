// ==============================================================================
// DAY 17: STRENGTHENED AXIOS SERVICE LAYER & JWT AUTHENTICATION FLOW
// Centralized API client with automatic token injection and 401 handling
// ==============================================================================

import axios from "axios";
import { env } from "../config/env";

export const apiClient = axios.create({
  baseURL: env.API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Request Interceptor: Attach JWT Bearer Token
apiClient.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("access_token");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Expired Sessions / 401 Unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear credentials
      localStorage.removeItem("token");
      localStorage.removeItem("access_token");
      localStorage.removeItem("rmart_user");
      localStorage.removeItem("user_role");

      // Notify application of session expiration
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("rmart:auth_expired", {
            detail: {
              message: "Your session has expired. Please log in again.",
              timestamp: Date.now(),
            },
          })
        );
      }
    }
    return Promise.reject(error);
  }
);

// ==============================================================================
// MODULAR API SERVICE METHODS
// ==============================================================================

export const authService = {
  login: async (email, password) => {
    const res = await apiClient.post("/auth/login", { email, password });
    return res.data;
  },
  register: async (userData) => {
    const res = await apiClient.post("/auth/register", userData);
    return res.data;
  },
  getProfile: async () => {
    const res = await apiClient.get("/auth/me");
    return res.data;
  },
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("rmart_user");
    localStorage.removeItem("user_role");
  },
};

export const orderService = {
  getOrders: async () => {
    const res = await apiClient.get("/orders");
    return res.data;
  },
  getOrderById: async (id) => {
    const res = await apiClient.get(`/orders/${id}`);
    return res.data;
  },
  checkout: async (orderPayload) => {
    const res = await apiClient.post("/orders/checkout", orderPayload);
    return res.data;
  },
  updateStatus: async (orderId, newStatus) => {
    const res = await apiClient.put(`/orders/${orderId}/status`, {
      status: newStatus,
    });
    return res.data;
  },
};

export const chatService = {
  getHistory: async (roomId = "general") => {
    const res = await apiClient.get(`/chat/history/${roomId}`);
    return res.data;
  },
  sendMessage: async (roomId, messageData) => {
    const res = await apiClient.post(`/chat/message`, {
      room_id: roomId,
      ...messageData,
    });
    return res.data;
  },
};

export const taskService = {
  getTaskStatus: async (taskId) => {
    const res = await apiClient.get(`/tasks/${taskId}`);
    return res.data;
  },
  listTasks: async () => {
    const res = await apiClient.get("/tasks");
    return res.data;
  },
};

export const invoiceService = {
  generateInvoice: async (orderId, orderData = null) => {
    const res = await apiClient.post(`/orders/${orderId}/generate-invoice`, {
      order_data: orderData,
    });
    return res.data;
  },
  downloadInvoiceUrl: (orderId) => {
    return `${env.API_URL}/orders/${orderId}/invoice/download`;
  },
};

export const csvService = {
  importCsv: async (payload) => {
    if (payload instanceof FormData) {
      const res = await apiClient.post("/products/bulk-import-csv", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    }
    const res = await apiClient.post("/products/bulk-import-csv", payload);
    return res.data;
  },
  getSampleTemplateUrl: () => {
    return `${env.API_URL}/products/sample-csv-template`;
  },
};

export const notificationService = {
  getNotifications: async () => {
    const res = await apiClient.get("/notifications");
    return res.data;
  },
  markRead: async (id) => {
    const res = await apiClient.post(`/notifications/${id}/read`);
    return res.data;
  },
};

export const productService = {
  getProducts: async () => {
    const res = await apiClient.get("/products");
    return res.data;
  },
  createProduct: async (productData) => {
    const res = await apiClient.post("/products", productData);
    return res.data;
  },
  deleteProduct: async (productId) => {
    const res = await apiClient.delete(`/products/${productId}`);
    return res.data;
  },
  updateStock: async (productId, newStock) => {
    const res = await apiClient.patch(`/products/${productId}/stock`, { stock: newStock });
    return res.data;
  },
};

export default apiClient;


