import morgan from "morgan";
import { loggerConfig } from "../config/logger.config.js";

export const requestLogger = morgan(loggerConfig.format);
