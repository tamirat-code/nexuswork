import { loggerConfig } from "../../config/logger.config.js";

function log(level, ...args) {
  const levels = ["error", "warn", "info", "debug"];
  if (levels.indexOf(level) <= levels.indexOf(loggerConfig.level)) {
    console[level === "debug" ? "log" : level](`[${level}]`, ...args);
  }
}

export const logger = {
  error: (...a) => log("error", ...a),
  warn: (...a) => log("warn", ...a),
  info: (...a) => log("info", ...a),
  debug: (...a) => log("debug", ...a),
};
