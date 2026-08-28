import { renderEmailLayout } from "./layout.template.js";

export function verificationEmail({ verifyUrl }) {
  return {
    subject: "Verify your NexusWork email",
    html: renderEmailLayout({
      preheader: "Confirm your email address to finish setting up your account.",
      title: "Welcome to NexusWork",
      bodyHtml: `
        <p>Thanks for joining NexusWork — a trusted place for university talent and real client work.</p>
        <p>Confirm your email address to unlock projects, proposals, contracts, and escrow-protected payments.</p>
        <p>This secure link expires in <strong>24 hours</strong>.</p>
      `,
      ctaLabel: "Verify my email",
      ctaUrl: verifyUrl,
    }),
  };
}
