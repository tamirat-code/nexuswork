export const mailConfig = {
  provider: process.env.MAIL_PROVIDER || "console", // "console" logs instead of sending, for local dev
  from: process.env.MAIL_FROM || "no-reply@nexuswork.local",
};
