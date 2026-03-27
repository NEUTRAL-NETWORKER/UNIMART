import { createContext, useContext, useState, useCallback } from "react";
import adminApi from "./api/adminApi";

const AdminAuthContext = createContext(null);

// Helper to clear user session
const clearUserSession = () => {
  localStorage.removeItem("unimart_token");
  localStorage.removeItem("unimart_user");
};

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    try {
      const stored = localStorage.getItem("unimart_admin");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback(async (username, password) => {
    const { data } = await adminApi.post("/admin/auth/login", { username, password });

    // Clear user session when admin logs in (mutual exclusivity)
    clearUserSession();

    localStorage.setItem("unimart_admin_token", data.access_token);
    localStorage.setItem("unimart_admin", JSON.stringify({
      username: data.admin_username,
      displayName: data.display_name,
      role: data.role,
    }));
    setAdmin({ username: data.admin_username, displayName: data.display_name, role: data.role });
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("unimart_admin_token");
    localStorage.removeItem("unimart_admin");
    setAdmin(null);
  }, []);

  return (
    <AdminAuthContext.Provider value={{ admin, login, logout, isAuthenticated: !!admin }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
