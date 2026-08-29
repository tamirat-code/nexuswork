import { logger } from "./logger.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/v1";

export function csrfHeaders() {
  if (typeof document === "undefined") return {};
  const match = document.cookie.match(/(?:^|; )nw_csrf=([^;]+)/);
  return match ? { "X-CSRF-Token": decodeURIComponent(match[1]) } : {};
}

export async function apiRequest(path, { method = "GET", body, token } = {}) {
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    credentials: "include",
    headers: {
      
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...csrfHeaders(),
    },
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    let message = data.message || `Request failed with status ${res.status}`;
    if (data.code && typeof window !== "undefined") {
      const translated = window.__nwI18n?.t(`errors.${data.code}`);
      if (translated && translated !== `errors.${data.code}`) message = translated;
    }
    const err = new Error(message);
    err.status = res.status;
    Object.assign(err, data);
    logger.error("API request failed", err, { method, path, status: res.status, code: data.code });
    throw err;
  }
  return data;
}
