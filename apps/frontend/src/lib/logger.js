const normalizeError = (error) => ({
  name: error?.name,
  message: error?.message || String(error || "Unknown error"),
  status: error?.status,
  code: error?.code,
  stack: error?.stack,
});

function write(level, message, context = {}) {
  const payload = { timestamp: new Date().toISOString(), level, message, ...context };
  const method = typeof console?.[level] === "function" ? console[level] : console.log;
  method(`[nexuswork:${level}] ${message}`, payload);
}

export const logger = {
  debug: (message, context) => write("debug", message, context),
  info: (message, context) => write("info", message, context),
  warn: (message, context) => write("warn", message, context),
  error: (message, error, context = {}) => write("error", message, { ...context, error: normalizeError(error) }),
};

export function installGlobalErrorHandlers() {
  if (typeof window === "undefined") return () => {};
  const onError = (event) => logger.error("Unhandled frontend error", event.error || new Error(event.message), { source: event.filename, line: event.lineno });
  const onRejection = (event) => logger.error("Unhandled promise rejection", event.reason);
  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);
  return () => { window.removeEventListener("error", onError); window.removeEventListener("unhandledrejection", onRejection); };
}
