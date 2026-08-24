import crypto from "node:crypto";

export function requestContext(req, res, next) {
  const correlationId = crypto.randomUUID();
  req.correlationId = correlationId;
  res.setHeader("X-Request-Id", correlationId);
  next();
}
