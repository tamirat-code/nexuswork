import { renderEmailLayout } from "./layout.template.js";

export function passwordResetEmail({ resetUrl }) {
  return {
    subject: "Reset your NexusWork password",
    html: renderEmailLayout({
      preheader: "Use this link to reset your password. It expires in 15 minutes.",
      title: "Reset your password",
      bodyHtml: `
        <p>We received a request to reset your NexusWork password. This link is valid for <strong>15 minutes</strong>.</p>
        <p>If you didn't request this, you can safely ignore this email — your password won't be changed.</p>
      `,
      ctaLabel: "Reset password",
      ctaUrl: resetUrl,
    }),
  };
}