import { logger } from "../shared/logger/logger.js";

export function notFound(req, res, next) {
  res.status(404).json({ success: false, message: "Route not found" });
}

export function errorHandler(err, req, res, next) {
  logger.error(err.message, err.stack);
  const isProviderError = err.name === "PaymentProviderError";
  const status = err.status || (err.name === "MulterError" ? 400 : isProviderError ? 502 : 500);
  const isSafeApplicationError = status < 500 && Boolean(err.status);
  const message = isSafeApplicationError || isProviderError ? err.message : "Internal server error";
  res.status(status).json({ success: false, message, ...(err.code ? { code: err.code } : {}) });
}
