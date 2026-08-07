import { Resend } from "resend";
import { mailConfig } from "../../config/mail.config.js";

if (!mailConfig.resendApiKey) {
  console.warn(
    "[mail] RESEND_API_KEY is not set. Emails will fail to send until it's configured in .env."
  );
}

export const resend = new Resend(mailConfig.resendApiKey || "re_placeholder");