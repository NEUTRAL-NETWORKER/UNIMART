import axios from "axios";

const VITE_API_URL = import.meta.env.VITE_API_URL;
if (!VITE_API_URL && import.meta.env.PROD) {
  throw new Error("VITE_API_URL is required in production build/runtime");
}

let ADMIN_API_BASE_URL = VITE_API_URL || "http://localhost:8000/api";
if (ADMIN_API_BASE_URL) {
  ADMIN_API_BASE_URL = ADMIN_API_BASE_URL.replace(/\/+$/, "");
  if (!ADMIN_API_BASE_URL.endsWith("/api")) {
    ADMIN_API_BASE_URL += "/api";
  }
}

const adminApi = axios.create({
  baseURL: ADMIN_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("unimart_admin_token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("unimart_admin_token");
      localStorage.removeItem("unimart_admin");
      if (window.location.pathname !== "/admin/login") {
        window.location.href = "/admin/login";
      }
    }
    return Promise.reject(error);
  }
);

export default adminApi;
