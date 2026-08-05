import rateLimit from "express-rate-limit";

// Applied globally in app.js; tighten further per-route (e.g. auth endpoints)
// by exporting additional limiter instances here if brute-force becomes a concern.
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
