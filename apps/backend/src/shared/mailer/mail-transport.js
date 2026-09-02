import nodemailer from "nodemailer";
import { resend } from "./resend.client.js";
import { mailConfig } from "../../config/mail.config.js";
import { logger } from "../logger/logger.js";

let smtpTransport = null;

function getSmtpTransport() {
  if (!smtpTransport) {
    smtpTransport = nodemailer.createTransport({
      host: mailConfig.smtpHost,
      port: mailConfig.smtpPort,
      secure: mailConfig.smtpSecure,
      auth: {
        user: mailConfig.smtpUser,
        pass: mailConfig.smtpPass,
      },
    });
  }
  return smtpTransport;
}

export async function sendMail({ to, subject, html }) {
  const driver = mailConfig.driver || "resend";

  if (driver === "smtp") {
    const transporter = getSmtpTransport();
    const info = await transporter.sendMail({
      from: mailConfig.from,
      to,
      subject,
      html,
    });
    logger.info(`[mail:smtp] email sent to ${to}, messageId: ${info.messageId}`);
    return { id: info.messageId };
  }

  if (driver === "log") {
    logger.info(`[mail:log] Simulated email send to: ${to} | Subject: ${subject}`);
    logger.debug(`[mail:log] Content: ${html}`);
    return { id: `log_${Date.now()}` };
  }

  // Default: resend
  const { data, error } = await resend.emails.send({
    from: mailConfig.from,
    to,
    subject,
    html,
  });

  if (error) {
    logger.error("[mail:resend] send failed:", error.message || error);
    throw new Error("Failed to send email");
  }

  return data;
}
