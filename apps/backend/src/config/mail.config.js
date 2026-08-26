import { env } from "./env.js";

export const mailConfig = {
  resendApiKey: env.resendApiKey,
  from: env.mailFrom,
  appUrl: env.clientUrl || "http://localhost:5173",
};
