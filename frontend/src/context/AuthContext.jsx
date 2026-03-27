import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('unimart_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      const savedUser = localStorage.getItem('unimart_user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          localStorage.removeItem('unimart_user');
          setUser(null);
        }
      }
    }
    setLoading(false);
  }, [token]);

  // Helper to clear admin session
  const clearAdminSession = () => {
    localStorage.removeItem('unimart_admin_token');
    localStorage.removeItem('unimart_admin');
  };

  // Login via backend API
  const login = async (identifier, password) => {
    try {
      const { data } = await api.post('/auth/login', {
        studentId: identifier,
        password: password,
      });

      // Clear admin session when user logs in (mutual exclusivity)
      clearAdminSession();

      const authToken = data.token;
      const userData = data.user;
      const refreshToken = data.refresh_token;

      localStorage.setItem('unimart_token', authToken);
      if (refreshToken) {
        localStorage.setItem('unimart_refresh_token', refreshToken);
      } else {
        localStorage.removeItem('unimart_refresh_token');
      }
      localStorage.setItem('unimart_user', JSON.stringify(userData));
      setToken(authToken);
      setUser(userData);
      return userData;
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Invalid credentials';
      throw new Error(msg);
    }
  };

  // Register via backend API
  const register = async (data) => {
    try {
      const { data: res } = await api.post('/auth/register', {
        register_number: data.studentId,
        username: data.username,
        password: data.password,
        personal_mail_id: data.email,
        phone_number: data.phone || null,
      });

      // Clear admin session when user registers (mutual exclusivity)
      clearAdminSession();

      const authToken = res.token;
      const userData = res.user;
      const refreshToken = res.refresh_token;

      localStorage.setItem('unimart_token', authToken);
      if (refreshToken) {
        localStorage.setItem('unimart_refresh_token', refreshToken);
      } else {
        localStorage.removeItem('unimart_refresh_token');
      }
      localStorage.setItem('unimart_user', JSON.stringify(userData));
      setToken(authToken);
      setUser(userData);
      return userData;
    } catch (err) {
      console.error('AuthContext register error:', err?.response?.data || err);
      const detail = err?.response?.data?.detail;
      let msg = 'Registration failed';
      if (typeof detail === 'string') {
        msg = detail;
      } else if (Array.isArray(detail)) {
        msg = detail.map(d => d.msg || d.message || JSON.stringify(d)).join(', ');
      } else if (detail) {
        msg = JSON.stringify(detail);
      }
      throw new Error(msg);
    }
  };

  const logout = () => {
    localStorage.removeItem('unimart_token');
    localStorage.removeItem('unimart_refresh_token');
    localStorage.removeItem('unimart_user');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (updates) => {
    try {
      const { data } = await api.put('/auth/profile', updates);
      const updatedUser = { ...user, ...data };
      localStorage.setItem('unimart_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Failed to update profile';
      throw new Error(msg);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user && !!token,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
