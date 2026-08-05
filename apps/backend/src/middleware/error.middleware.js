import { logger } from "../shared/logger/logger.js";

export function notFound(req, res, next) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err, req, res, next) {
  logger.error(err.message, err.stack);
  const status = err.status || 500;
  res.status(status).json({ success: false, message: err.message || "Internal server error" });
}
