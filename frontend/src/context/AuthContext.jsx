/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(undefined);

// Mock users for frontend-first development
const mockUsers = [
  { id: "1", name: "Selam M.", email: "student@test.com", password: "123456", role: "student" },
  { id: "2", name: "Daniel T.", email: "client@test.com", password: "123456", role: "client" },
  { id: "3", name: "Dr. Sara N.", email: "university@test.com", password: "123456", role: "university_staff" },
  { id: "4", name: "Platform Admin", email: "admin@test.com", password: "123456", role: "admin" },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("nexus_user"));
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) localStorage.setItem("nexus_user", JSON.stringify(user));
    else localStorage.removeItem("nexus_user");
  }, [user]);

  const login = async ({ email, password }) => {
    await new Promise((resolve) => setTimeout(resolve, 700)); // Simulate network delay
    const found = mockUsers.find((u) => u.email === email && u.password === password);
    if (!found) throw new Error("Invalid email or password");
    
    const {  ...safeUser } = found;
    localStorage.setItem("access_token", `mock-jwt-${safeUser.role}`);
    setUser(safeUser);
    return safeUser;
  };

  const register = async ({ name, email, role }) => {
    await new Promise((resolve) => setTimeout(resolve, 900));
    if (mockUsers.some((u) => u.email === email)) throw new Error("This email is already registered");
    
    const newUser = { id: `u-${Date.now()}`, name, email, role };
    localStorage.setItem("access_token", `mock-jwt-${role}`);
    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("nexus_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: Boolean(user), login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}