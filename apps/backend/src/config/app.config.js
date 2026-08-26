import { env } from "./env.js";

export const appConfig = {
  port: env.port,
  env: env.nodeEnv,
  apiPrefix: env.apiPrefix,
};
