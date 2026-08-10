import { Link } from "react-router-dom";

const SECTIONS = [
  {
    id: "accounts",
    title: "1. Accounts and eligibility",
    body: [
      "You must provide accurate information when creating an account and keep your credentials secure.",
      "Student accounts require a confirmed university email address. Misrepresenting enrollment is grounds for immediate removal.",
    ],
  },
  {
    id: "conduct",
    title: "2. Using the platform",
    body: [
      "Clients agree to post genuine briefs and to fund milestones they intend to pay for.",
      "Students agree to deliver the work described in the accepted proposal, on the agreed timeline.",
      "Taking a contract off-platform to avoid fees removes escrow protection and may result in account suspension.",
    ],
  },
  {
    id: "escrow",
    title: "3. Escrow and payments",
    body: [
      "Milestones are funded before work begins and held in escrow until the client approves the delivery.",
      "NexusWork charges a commission on released milestones. The exact amount is disclosed before a milestone is funded.",
      "Payouts are made to the student's connected payout account after the release period ends.",
    ],
  },
  {
    id: "disputes",
    title: "4. Disputes",
    body: [
      "If a delivery does not meet the written brief, either party may open a dispute before the milestone is released.",
      "Disputes are reviewed by platform staff against the scope agreed at the time the milestone was created. Decisions are final within the platform.",
    ],
  },
  {
    id: "ip",
    title: "5. Intellectual property",
    body: [
      "Unless the contract states otherwise, ownership of delivered work transfers to the client when the milestone is released and paid.",
      "Students may show released work in their NexusWork portfolio unless the contract includes a confidentiality clause.",
    ],
  },
  {
    id: "termination",
    title: "6. Termination",
    body: [
      "You may close your account at any time. Funded milestones must be resolved or refunded before closure completes.",
      "We may suspend accounts that breach these terms, attempt fraud, or put other users at risk.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <div className="grid gap-10 lg:grid-cols-[1fr_220px] lg:items-start">
        <article className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brass">Legal</p>
          <h1 className="mt-2 font-display text-2xl leading-tight tracking-tight text-slate sm:text-3xl">
            Terms of Service
          </h1>
          <p className="mt-2 text-xs text-slate-300">Version 1.0 · Last updated {new Date().getFullYear()}</p>

          <p className="mt-6 rounded-card border border-brick/30 bg-brick-100 px-4 py-3 text-sm leading-relaxed text-brick">
            Template text for development. Have a qualified lawyer review these terms before taking real
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
            <Link to="/privacy" className="font-semibold text-brass hover:text-brass-300">
              Privacy Policy
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
