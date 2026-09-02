import rateLimit from "express-rate-limit";

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  // Scope failed-login attempts to both the account and the real client IP.
  // This prevents one device from blocking the same account everywhere while
  // still limiting repeated attempts from that device.
  keyGenerator: (req) => `${req.body?.email?.toLowerCase() || "unknown"}:${req.ip}`,
  message: { success: false, message: "Too many login attempts. Please try again later." },
});

// Verification emails are throttled per account to prevent abuse.
export const verificationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.user?._id || req.ip),
  message: { success: false, message: "Too many verification emails requested. Please try again later." },
});

export const meetingRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, code: "MEETING_RATE_LIMITED", message: "Too many meeting requests. Please try again later." },
});
