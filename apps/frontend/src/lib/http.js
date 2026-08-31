import { logger } from "./logger.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/v1";
let csrfToken = null;

function authHeader(token) {
  return token && typeof token === "string" && token.trim()
    ? { Authorization: `Bearer ${token}` }
    : {};
}

function notifyInvalidSession(status) {
  if (status === 401 && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("nw:auth-invalid"));
  }
}

export function csrfHeaders() {
  if (csrfToken) return { "X-CSRF-Token": csrfToken };
  if (typeof document === "undefined") return {};
  const match = document.cookie.match(/(?:^|; )nw_csrf=([^;]+)/);
  return match ? { "X-CSRF-Token": decodeURIComponent(match[1]) } : {};
}

export async function ensureCsrfToken() {
  if (csrfToken) return csrfToken;
  const res = await fetch(`${API_BASE_URL}/auth/csrf`, { credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.data?.csrfToken) {
    throw new Error(data.message || "Unable to establish a security session. Refresh and try again.");
  }
  csrfToken = data.data.csrfToken;
  return csrfToken;
}

export async function apiRequest(path, { method = "GET", body, token } = {}) {
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const isMutation = !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());
  if (isMutation) await ensureCsrfToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    credentials: "include",
    headers: {
      ...authHeader(token),
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
    notifyInvalidSession(res.status);
    Object.assign(err, data);
    logger.error("API request failed", err, { method, path, status: res.status, code: data.code });
    throw err;
  }
  // Login, registration, and MFA rotate the CSRF cookie together with the
  // session cookie. Force the next mutation to read the newly issued token.
  if (path.startsWith("/auth/") && method.toUpperCase() === "POST") csrfToken = null;
  return data;
}

/** Fetch a private non-JSON resource using the same cookie/JWT rules as apiRequest. */
export async function authenticatedFetch(url, { token, headers = {}, ...options } = {}) {
  const res = await fetch(url, {
    credentials: "include",
    ...options,
    headers: { ...authHeader(token), ...headers },
  });
  notifyInvalidSession(res.status);
  return res;
}
