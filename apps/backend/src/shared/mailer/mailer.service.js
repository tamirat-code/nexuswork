import { sendMail } from "./mail-transport.js";
import { mailConfig } from "../../config/mail.config.js";
import { logger } from "../logger/logger.js";
import { passwordResetEmail } from "../../templates/email/password-reset.template.js";
import { verificationEmail } from "../../templates/email/email-verification.template.js";
import welcomeEmail from "../../templates/email/welcome.template.js";
import { renderEmailLayout } from "../../templates/email/layout.template.js";

async function send({ to, subject, html }) {
  return sendMail({ to, subject, html });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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
  const { subject, html } = welcomeEmail({ name, appUrl: mailConfig.appUrl });
  return send({ to: email, subject, html });
}


export async function sendNotificationEmail({ to, subject, body, actionUrl, actionLabel }) {
  const html = renderEmailLayout({
    preheader: body,
    title: subject,
    bodyHtml: `<p style="margin:0; white-space:pre-line;">${escapeHtml(body)}</p>`,
    ctaLabel: actionLabel || "View in NexusWork",
    ctaUrl: actionUrl || mailConfig.appUrl,
    footerText: "You are receiving this because you have a NexusWork account.",
  });
  return send({ to, subject, html });
}
