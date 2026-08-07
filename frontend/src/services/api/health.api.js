import { apiFetch } from "../../lib/http";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

export async function checkBackendHealth() {
  if (USE_MOCK) {
    return {
      success: true,
      message: "Mock mode is running. Backend is not connected yet.",
    };
  }

  return apiFetch("/health");
}
