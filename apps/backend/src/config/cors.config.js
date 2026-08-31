import { env } from "./env.js";

const allowedOrigins = new Set(env.clientUrls);

export const corsConfig = {
  origin(origin, callback) {
    // Non-browser requests (health checks, curl, server-to-server calls) do
    // not send an Origin header and should remain usable.
    if (!origin) return callback(null, true);
    const normalizedOrigin = origin.replace(/\/$/, "");
    if (allowedOrigins.has(normalizedOrigin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
  exposedHeaders: ["Content-Disposition", "Content-Length"],
};
