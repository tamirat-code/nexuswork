import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import * as authApi from "../../services/api/auth.api.js";
import i18n from "../../i18n/index.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const persist = useCallback((nextUser) => {
    setToken(nextUser ? true : null);
    setUser(nextUser);
    if (nextUser?.preferred_language) i18n.changeLanguage(nextUser.preferred_language);
  }, []);

  const clear = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    authApi.getMe().then(({ data }) => persist(data)).catch(() => clear()).finally(() => setReady(true));
  }, [clear, persist]);

  const login = useCallback(
    async (email, password) => {
      const { data } = await authApi.login(email, password);
      if (data.user) persist(data.user);
      return data;
    },
    [persist]
  );

  const register = useCallback(
    async (payload) => {
      const { data } = await authApi.register(payload);
      persist(data.user);
      return data;
    },
    [persist]
  );

  const loginWithGoogle = useCallback(
    async (credential, options) => {
      try {
        const { data } = await authApi.googleAuth(credential, options);
        if (data.user) persist(data.user);
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
      if (token) await authApi.logout();
    } finally {
      clear();
    }
  }, [token, clear]);

  const refreshMe = useCallback(async () => {
    try {
      const { data } = await authApi.getMe();
      setUser(data);
      setToken(true);
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
    setToken(nextUser ? true : null);
  }, []);

  
  const lastRefreshRef = useRef(0);
  const REFRESH_THROTTLE_MS = 30_000;

  useEffect(() => {
    if (!token || !ready) return;

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
  }, [token, ready, refreshMe]);

  const completeMfaLogin = useCallback(
    (_nextToken, nextUser) => persist(nextUser),
    [persist]
  );

  return (
    <AuthContext.Provider value={{ token, user, ready, login, register, loginWithGoogle, completeMfaLogin, logout, refreshMe, setLocalUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
