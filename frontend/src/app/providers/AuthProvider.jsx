import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  });

  const loginUser = ({ user, token }) => {
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("access_token", token);
    setUser(user);
  };

  const logoutUser = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("access_token");
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: Boolean(user),
    loginUser,
    logoutUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}