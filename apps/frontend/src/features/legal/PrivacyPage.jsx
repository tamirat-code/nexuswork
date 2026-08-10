import { Link } from "react-router-dom";

const SECTIONS = [
  {
    id: "collect",
    title: "1. Information we collect",
    body: [
      "Account data: your name, email address, role (client, student, university or admin) and, for students, the university email used to verify enrollment.",
      "Project data: briefs, proposals, messages, deliverables and milestone activity you create on the platform.",
      "Technical data: IP address, device and browser information, and log data used to keep accounts secure.",
    ],
  },
  {
    id: "use",
    title: "2. How we use it",
    body: [
      "To operate your account, match briefs with verified students, and process milestone payments.",
      "To confirm institutional affiliation. University email domains are used solely to verify enrollment and are never published on your public profile.",
      "To detect fraud, resolve disputes, and meet legal and accounting obligations.",
    ],
  },
  {
    id: "payments",
    title: "3. Payments",
    body: [
      "Card details are collected and processed directly by our payment provider. NexusWork never stores your full card number.",
      "We retain payout records, invoices and escrow history for as long as required by tax and accounting law.",
    ],
  },
  {
    id: "sharing",
    title: "4. Sharing",
    body: [
      "We do not sell your personal data. We share only what is necessary with payment, email, hosting and analytics providers acting on our instructions.",
      "We may disclose data where required by law or to protect the rights and safety of platform users.",
    ],
  },
  {
    id: "rights",
    title: "5. Your rights",
    body: [
      "You can access, correct, export or delete your personal data from Settings, or by contacting support.",
      "Deleting your account removes your profile; contract, invoice and dispute records are retained where we are legally required to keep them.",
    ],
  },
  {
    id: "contact",
    title: "6. Contact",
    body: ["Questions about this policy can be sent to privacy@nexuswork.app."],
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <div className="grid gap-10 lg:grid-cols-[1fr_220px] lg:items-start">
        <article className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brass">Legal</p>
          <h1 className="mt-2 font-display text-2xl leading-tight tracking-tight text-slate sm:text-3xl">
            Privacy Policy
          </h1>
          <p className="mt-2 text-xs text-slate-300">Version 1.0 · Last updated {new Date().getFullYear()}</p>

          <p className="mt-6 rounded-card border border-brick/30 bg-brick-100 px-4 py-3 text-sm leading-relaxed text-brick">
            Template text for development. Have a qualified lawyer review this policy before taking real
            users or real payments in production.
          </p>

          <div className="mt-10 space-y-10">
            {SECTIONS.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <h2 className="font-display text-lg tracking-tight text-slate">{section.title}</h2>
                <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-300">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <p className="mt-12 border-t border-ink-300 pt-6 text-sm text-slate-300">
            See also our{" "}
            <Link to="/terms" className="font-semibold text-brass hover:text-brass-300">
              Terms of Service
            </Link>
            .
          </p>
        </article>

        <nav aria-label="On this page" className="hidden lg:sticky lg:top-24 lg:block">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">
            On this page
          </p>
          <ul className="space-y-2 border-l border-ink-300 pl-4 text-sm">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className="text-slate-300 transition-colors hover:text-brass">
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
