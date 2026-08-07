import { renderEmailLayout } from "./layout.template.js";

export default function welcomeEmail({ name }) {
  return {
    subject: "Welcome to NexusWork",
    html: renderEmailLayout({
      preheader: "Your NexusWork account is ready.",
      title: `Welcome, ${name}`,
      bodyHtml: `
        <p>Your NexusWork account is ready. NexusWork connects verified university students
        with clients who need real projects done — with escrow-protected payments every step
        of the way.</p>
        <p>You're all set to start browsing projects or posting one, depending on your role.</p>
      `,
    }),
  };
}