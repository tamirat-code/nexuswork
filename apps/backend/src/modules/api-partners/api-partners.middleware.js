import { getCookie, AUTH_COOKIE } from "../auth/auth.cookies.js";
import { authenticateApiKey, markApiKeyUsed } from "./api-partners.service.js";

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
    next();
  } catch (error) {
    next(error);
  }
}
