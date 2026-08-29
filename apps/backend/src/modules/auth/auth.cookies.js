import crypto from "node:crypto";
import { env } from "../../config/env.js";

export const AUTH_COOKIE = "nw_session";
export const CSRF_COOKIE = "nw_csrf";
// Vercel and Render are different sites even when the backend runs in the
// staging environment. Cross-site authentication therefore needs the same
// cookie policy as production; otherwise the browser withholds nw_session.
const isDeployedHttps = ["production", "staging"].includes(env.nodeEnv) || env.clientUrl?.startsWith("https://");
const cookieOptions = { httpOnly: true, secure: isDeployedHttps, sameSite: isDeployedHttps ? "none" : "lax", path: "/", maxAge: 7 * 24 * 60 * 60 * 1000 };
const csrfOptions = { httpOnly: false, secure: isDeployedHttps, sameSite: isDeployedHttps ? "none" : "lax", path: "/", maxAge: cookieOptions.maxAge };

export function setAuthCookies(res, token) {
  res.cookie(AUTH_COOKIE, token, cookieOptions);
  res.cookie(CSRF_COOKIE, crypto.randomBytes(32).toString("base64url"), csrfOptions);
}

export function clearAuthCookies(res) {
  res.clearCookie(AUTH_COOKIE, cookieOptions);
  res.clearCookie(CSRF_COOKIE, csrfOptions);
}

export function getCookie(req, name) {
  try {
    const value = req.headers.cookie?.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${name}=`));
    return value ? decodeURIComponent(value.slice(name.length + 1)) : null;
  } catch {
    return null;
  }
}

export function csrfGuard(req, res, next) {
  const path = req.path.replace(/^\/v1/, "");
  const publicAuthPath = path.startsWith("/auth/login") || path.startsWith("/auth/register") || path.startsWith("/auth/google") || path.startsWith("/auth/mfa/") || path.startsWith("/auth/password/forgot") || path.startsWith("/auth/password/reset") || path.startsWith("/auth/verify-email");
  if (["GET", "HEAD", "OPTIONS"].includes(req.method) || publicAuthPath || !getCookie(req, AUTH_COOKIE)) return next();
  const expected = getCookie(req, CSRF_COOKIE);
  const supplied = req.get("x-csrf-token");
  const expectedBuffer = Buffer.from(expected || "");
  const suppliedBuffer = Buffer.from(supplied || "");
  if (!expected || !supplied || expectedBuffer.length !== suppliedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, suppliedBuffer)) {
    return res.status(403).json({ success: false, code: "CSRF_INVALID", message: "Security token missing or invalid. Refresh and try again." });
  }
  next();
}
