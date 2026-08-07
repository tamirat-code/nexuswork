import { resend } from "./resend.client.js";
import { mailConfig } from "../../config/mail.config.js";
import { logger } from "../logger/logger.js";
import { passwordResetEmail } from "../../templates/email/password-reset.template.js";
import { verificationEmail } from "../../templates/email/email-verification.template.js";
import  welcomeEmail  from "../../templates/email/welcome.template.js";

async function send({ to, subject, html }) {
  const { data, error } = await resend.emails.send({ from: mailConfig.from, to, subject, html });
  if (error) {
    logger.error("[mail] send failed:", error.message || error);
    throw new Error("Failed to send email");
  }
  return data;
}

export async function sendPasswordResetEmail(email, resetToken) {
  const resetUrl = `${mailConfig.appUrl}/reset-password?token=${resetToken}`;
  const { subject, html } = passwordResetEmail({ resetUrl });
  return send({ to: email, subject, html });
}

export async function sendVerificationEmail(email, verifyToken) {
  const verifyUrl = `${mailConfig.appUrl}/verify-email?token=${verifyToken}`;
  const { subject, html } = verificationEmail({ verifyUrl });
  return send({ to: email, subject, html });
}

export async function sendWelcomeEmail(email, name) {
  const { subject, html } = welcomeEmail({ name });
  return send({ to: email, subject, html });
}