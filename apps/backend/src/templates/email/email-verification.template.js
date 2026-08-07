import { renderEmailLayout } from "./layout.template.js";

export function verificationEmail({ verifyUrl }) {
  return {
    subject: "Verify your NexusWork email",
    html: renderEmailLayout({
      preheader: "Confirm your email address to finish setting up your account.",
      title: "Verify your email address",
      bodyHtml: `
        <p>Thanks for signing up for NexusWork. Confirm your email address to finish setting up your account.</p>
        <p>This link is valid for <strong>24 hours</strong>.</p>
      `,
      ctaLabel: "Verify email",
      ctaUrl: verifyUrl,
    }),
  };
}