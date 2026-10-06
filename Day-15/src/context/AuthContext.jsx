import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("access_token") || null);
  const [userRole, setUserRole] = useState(localStorage.getItem("user_role") || "customer");
  const [userEmail, setUserEmail] = useState(localStorage.getItem("user_email") || "");

  const login = (newToken, role = "customer", email = "") => {
    localStorage.setItem("access_token", newToken);
    localStorage.setItem("user_role", role);
    localStorage.setItem("user_email", email);
    setToken(newToken);
    setUserRole(role);
    setUserEmail(email);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_email");
    setToken(null);
    setUserRole("customer");
    setUserEmail("");
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        userRole,
        userEmail,
        isAuthenticated: !!token,
        isAdmin: userRole === "admin",
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);