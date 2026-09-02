import { sendMail } from "./mail-transport.js";
import { mailConfig } from "../../config/mail.config.js";
import { logger } from "../logger/logger.js";
import { passwordResetEmail } from "../../templates/email/password-reset.template.js";
import { verificationEmail } from "../../templates/email/email-verification.template.js";
import welcomeEmail from "../../templates/email/welcome.template.js";

async function send({ to, subject, html }) {
  return sendMail({ to, subject, html });
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


export async function sendNotificationEmail({ to, subject, body }) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1f2937;">${subject}</h2>
      <p style="color: #374151; line-height: 1.6;">${body}</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="color: #9ca3af; font-size: 12px;">You are receiving this because you have an account on NexusWork.</p>
    </div>
  `;
  return send({ to, subject, html });
}
