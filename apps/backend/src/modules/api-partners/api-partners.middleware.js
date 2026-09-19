import { getCookie, AUTH_COOKIE } from "../auth/auth.cookies.js";
import { authenticateApiKey, getBrowserPartner, markApiKeyUsed } from "./api-partners.service.js";
import { consumePartnerRequest } from "./api-usage.service.js";

export async function requirePartnerApiKey(req, res, next) {
  try {
    if (getCookie(req, AUTH_COOKIE) || req.headers.authorization?.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, code: "PARTNER_API_KEY_REQUIRED", message: "Partner API routes require an API key, not a browser session" });
    }
    const rawApiKey = req.get("x-nexuswork-api-key");
    const authenticated = await authenticateApiKey(rawApiKey);
    if (!authenticated) {
      return res.status(401).json({ success: false, code: "INVALID_PARTNER_API_KEY", message: "Missing, invalid, expired, or revoked partner API key" });
    }
    req.apiPartner = authenticated.partner;
    req.apiKey = authenticated.apiKey;
    await markApiKeyUsed(authenticated.apiKey._id);
    const usage = await consumePartnerRequest(authenticated.partner);
    res.setHeader("X-RateLimit-Limit", String(usage.rate?.limit || 0));
    res.setHeader("X-RateLimit-Remaining", String(usage.rate?.remaining || 0));
    if (usage.rate?.resetAt) res.setHeader("X-RateLimit-Reset", String(Math.ceil(usage.rate.resetAt.getTime() / 1000)));
    if (!usage.allowed) {
      res.setHeader("Retry-After", String(usage.retryAfterSeconds));
      const message = usage.code === "PARTNER_RATE_LIMITED"
        ? "Partner API rate limit exceeded"
        : usage.code === "PARTNER_MONTHLY_QUOTA_EXCEEDED"
          ? "Partner API monthly quota exceeded"
          : "Partner prepaid balance exhausted";
      return res.status(429).json({ success: false, code: usage.code, message, retry_after_seconds: usage.retryAfterSeconds, usage: usage.usage });
    }
    req.apiUsage = usage.usage;
    next();
  } catch (error) {
    next(error);
  }
}

export function requirePartnerScope(scope) {
  return (req, res, next) => {
    if (!req.apiKey?.scopes?.includes(scope)) {
      return res.status(403).json({
        success: false,
        code: "PARTNER_SCOPE_REQUIRED",
        message: `This endpoint requires the ${scope} scope`,
      });
    }
    next();
  };
}

export async function requireBrowserPartner(req, _res, next) {
  try {
    req.apiPartner = await getBrowserPartner(req.user);
    next();
  } catch (error) {
    next(error);
  }
}
