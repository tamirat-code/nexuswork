export const mailConfig = {
  resendApiKey: process.env.RESEND_API_KEY,
  from: process.env.MAIL_FROM || "NexusWork <no-reply@yourdomain.com>",
  appUrl: process.env.CLIENT_URL || "http://localhost:5173",
};