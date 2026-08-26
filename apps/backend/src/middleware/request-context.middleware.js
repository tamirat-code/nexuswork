import crypto from "node:crypto";

export function requestContext(req, res, next) {
  const requestId = crypto.randomUUID();
  req.requestId = requestId;
  // Keep the existing field for backward compatibility with current services.
  req.correlationId = requestId;
  res.setHeader("X-Request-Id", requestId);
  next();
}
