import { createContext, useContext, useState, useCallback } from "react";
import * as authApi from "../../services/api/auth.api.js";
import { storage } from "../../utils/storage.utils.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => storage.get("nw_token"));
  const [user, setUser] = useState(() => {
    const raw = storage.get("nw_user");
    return raw ? JSON.parse(raw) : null;
  });

  const persist = useCallback((token, user) => {
    setToken(token);
    setUser(user);
    storage.set("nw_token", token);
    storage.set("nw_user", JSON.stringify(user));
  }, []);

  const login = useCallback(
    async (email, password) => {
      const { data } = await authApi.login(email, password);
      persist(data.token, data.user);
    },
    [persist]
  );

  const register = useCallback(
    async (payload) => {
      const { data } = await authApi.register(payload);
      persist(data.token, data.user);
    },
    [persist]
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    storage.remove("nw_token");
    storage.remove("nw_user");
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, register, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
