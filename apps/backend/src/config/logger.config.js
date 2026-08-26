import { env } from "./env.js";

export const loggerConfig = {
  level: env.logLevel,
  format: env.isProduction ? "json" : "dev",
};
