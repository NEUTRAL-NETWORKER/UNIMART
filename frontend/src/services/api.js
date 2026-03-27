import axios from 'axios';

const VITE_API_URL = import.meta.env.VITE_API_URL;
const IS_PROD = import.meta.env.PROD;
const APP_BASE_URL = import.meta.env.BASE_URL || '/';

const appPath = (path) => {
  const normalizedBase = APP_BASE_URL.endsWith('/')
    ? APP_BASE_URL.slice(0, -1)
    : APP_BASE_URL;
  return `${normalizedBase}${path}`;
};

if (!VITE_API_URL && IS_PROD) {
  throw new Error('VITE_API_URL is required in production build/runtime');
}

let API_BASE_URL = VITE_API_URL || 'http://localhost:8000/api';
if (API_BASE_URL) {
  API_BASE_URL = API_BASE_URL.replace(/\/+$/, '');
  if (!API_BASE_URL.endsWith('/api')) {
    API_BASE_URL += '/api';
  }
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('unimart_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle auth errors, refresh token, and network errors
// CRITICAL: Only redirect to /login on 401 (auth) errors, NOT on 404/500/network errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {

    // ── Network error — backend unreachable ──────────────────────────
    if (!error.response) {
      console.error("[API] Network error:", error.message);
      const networkError = new Error(
        "Unable to connect to the server. Please check your internet connection."
      );
      networkError.isNetworkError = true;
      return Promise.reject(networkError);
    }

    const originalRequest = error.config;

    // ── 401 Unauthorized — attempt token refresh ─────────────────────
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("unimart_refresh_token");

      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          localStorage.setItem("unimart_token", data.access_token);
          originalRequest.headers["Authorization"] = `Bearer ${data.access_token}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed — clear tokens and redirect to login
          localStorage.removeItem("unimart_token");
          localStorage.removeItem("unimart_refresh_token");
          localStorage.removeItem("unimart_user");
          const loginPath = appPath('/login');
          const registerPath = appPath('/register');
          if (window.location.pathname !== loginPath && window.location.pathname !== registerPath) {
            window.location.href = loginPath;
          }
          return Promise.reject(refreshError);
        }
      }

      // No refresh token available — redirect to login ONLY if not already there
      localStorage.removeItem("unimart_token");
      localStorage.removeItem("unimart_refresh_token");
      localStorage.removeItem("unimart_user");
      const loginPath = appPath('/login');
      const registerPath = appPath('/register');
      if (window.location.pathname !== loginPath && window.location.pathname !== registerPath) {
        window.location.href = loginPath;
      }
      return Promise.reject(error);
    }

    // ── 403 Forbidden — DO NOT redirect, just reject ─────────────────
    // ── 404 Not Found — DO NOT redirect, just reject ─────────────────
    // ── 422 Validation Error — DO NOT redirect, just reject ──────────
    // ── 500 Server Error — DO NOT redirect, just reject ──────────────
    // All other errors: pass through so components can handle them
    return Promise.reject(error);
  }
);

/**
 * Check if the backend is reachable. Returns true/false.
 * Useful for showing connection status in the UI.
 */
export async function checkBackendHealth() {
  try {
    const res = await api.get('/health', { timeout: 5000 });
    return res.data?.status === 'healthy';
  } catch {
    return false;
  }
}

export default api;
