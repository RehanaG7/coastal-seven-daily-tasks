import axiosClient from "./axiosClient";

export const authService = {
  login: async (email, password) => {
    const response = await axiosClient.post("/auth/login", { email, password });
    return response.data;
  },

  register: async (email, password, role = "customer") => {
    const response = await axiosClient.post("/auth/register", {
      email,
      password,
      role,
    });
    return response.data;
  },
};