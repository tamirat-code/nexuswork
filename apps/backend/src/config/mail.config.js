import { env } from "./env.js";

export const mailConfig = {
  driver: env.mailDriver,
  resendApiKey: env.resendApiKey,
  smtpHost: env.smtpHost,
  smtpPort: env.smtpPort,
  smtpSecure: env.smtpSecure,
  smtpUser: env.smtpUser,
  smtpPass: env.smtpPass,
  from: env.mailFrom,
  appUrl: env.clientUrl || "http://localhost:5173",
};
