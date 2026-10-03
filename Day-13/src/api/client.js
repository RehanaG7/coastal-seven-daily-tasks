const BASE_URL = "http://127.0.0.1:8000";

const apiClient = {
  get: async (endpoint) => {
    try {
      const res = await fetch(`${BASE_URL}${endpoint}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      return { data };
    } catch (err) {
      return Promise.reject(err);
    }
  },
  post: async (endpoint, body) => {
    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      return { data };
    } catch (err) {
      return Promise.reject(err);
    }
  }
};

export default apiClient;
