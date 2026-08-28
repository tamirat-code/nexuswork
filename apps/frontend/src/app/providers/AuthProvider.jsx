import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import * as authApi from "../../services/api/auth.api.js";
import { storage } from "../../utils/storage.utils.js";
import i18n from "../../i18n/index.js";

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
    if (user?.preferred_language) i18n.changeLanguage(user.preferred_language);
  }, []);

  const clear = useCallback(() => {
    setToken(null);
    setUser(null);
    storage.remove("nw_token");
    storage.remove("nw_user");
  }, []);

  const login = useCallback(
    async (email, password) => {
      const { data } = await authApi.login(email, password);
      if (data.token) persist(data.token, data.user);
      return data;
    },
    [persist]
  );

  const register = useCallback(
    async (payload) => {
      const { data } = await authApi.register(payload);
      persist(data.token, data.user);
      return data;
    },
    [persist]
  );

  const loginWithGoogle = useCallback(
    async (credential, options) => {
      try {
        const { data } = await authApi.googleAuth(credential, options);
        if (data.token) persist(data.token, data.user);
        return data;
      } catch (err) {
        if (err.needsRole) return { needsRole: true };
        throw err;
      }
    },
    [persist]
  );

  const logout = useCallback(async () => {
    try {
      if (token) await authApi.logout(token);
    } finally {
      clear();
    }
  }, [token, clear]);

  const refreshMe = useCallback(async () => {
    if (!token) return;
    try {
      const { data } = await authApi.getMe(token);
      setUser(data);
      storage.set("nw_user", JSON.stringify(data));
      if (data?.preferred_language) i18n.changeLanguage(data.preferred_language);
    } catch (err) {
      // A cached token can outlive a password reset, session-version change,
      // user deactivation, or database refresh. Do not leave the UI looking
      // authenticated after the server has rejected that session.
      if (err.status === 401) clear();
      throw err;
    }
  }, [token, clear]);

  const setLocalUser = useCallback((nextUser) => {
    setUser(nextUser);
    if (nextUser) storage.set("nw_user", JSON.stringify(nextUser));
    else storage.remove("nw_user");
  }, []);

  
  const lastRefreshRef = useRef(0);
  const REFRESH_THROTTLE_MS = 30_000;

  useEffect(() => {
    if (!token) return;

    const maybeRefresh = () => {
      const now = Date.now();
      if (now - lastRefreshRef.current < REFRESH_THROTTLE_MS) return;
      lastRefreshRef.current = now;
      refreshMe().catch(() => {
        /* best-effort — the cached user object just stays as-is until the next attempt */
      });
    };

    maybeRefresh();
    window.addEventListener("focus", maybeRefresh);
    return () => window.removeEventListener("focus", maybeRefresh);
  }, [token, refreshMe]);

  const completeMfaLogin = useCallback(
    (nextToken, nextUser) => persist(nextToken, nextUser),
    [persist]
  );

  return (
    <AuthContext.Provider value={{ token, user, login, register, loginWithGoogle, completeMfaLogin, logout, refreshMe, setLocalUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
