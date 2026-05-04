import { createContext, useContext, useState, useEffect, useCallback } from "react";
import API_URL from "../api/config";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const storedToken = localStorage.getItem("revindex_token");
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(storedToken);
  const [loading, setLoading] = useState(!!storedToken);

  const validateToken = useCallback((t) => {
    if (!t) return;
    fetch(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.ok ? r.json() : null)
      .then(u => { setUser(u); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { validateToken(token); }, [validateToken, token]);

  function login(newToken, newUser) {
    localStorage.setItem("revindex_token", newToken);
    setToken(newToken);
    setUser(newUser);
  }

  function logout() {
    localStorage.removeItem("revindex_token");
    setToken(null);
    setUser(null);
  }

  function authHeader() {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, authHeader }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
