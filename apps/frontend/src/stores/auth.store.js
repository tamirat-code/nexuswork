import { create } from "zustand";

// Zustand store for auth state; AuthProvider syncs this with localStorage
// so a page refresh doesn't log the user out.
export const useAuthStore = create((set) => ({
  token: null,
  user: null,
  setAuth: (token, user) => set({ token, user }),
  clearAuth: () => set({ token: null, user: null }),
}));
