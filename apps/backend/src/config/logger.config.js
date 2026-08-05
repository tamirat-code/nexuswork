export const loggerConfig = {
  level: process.env.LOG_LEVEL || "info",
  format: process.env.NODE_ENV === "production" ? "json" : "dev",
};
