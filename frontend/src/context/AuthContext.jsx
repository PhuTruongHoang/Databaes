// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { loginApi } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // load từ localStorage (giữ login sau khi reload trang)
  useEffect(() => {
    const stored = localStorage.getItem("authUser");
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("authUser");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await loginApi(email, password);
    // Backend trả về { message, user } nên lấy user
    const userData = res.data.user || res.data;
    setCurrentUser(userData);
    localStorage.setItem("authUser", JSON.stringify(userData));
    return userData;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("authUser");
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
