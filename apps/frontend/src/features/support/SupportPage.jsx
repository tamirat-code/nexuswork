import { Link } from "react-router-dom";
import { LifeBuoy, Mail, ShieldCheck, WalletCards, Flag, ArrowUpRight } from "lucide-react";

const supportCards = [
  { icon: WalletCards, title: "Payments and escrow", body: "Milestones are funded before work starts and released after client approval. Review the payment history and invoice pages for transaction details.", to: "/payments", label: "View payments" },
  { icon: ShieldCheck, title: "Verification and trust", body: "Students, clients, and university staff have role-specific verification workflows. A verified profile shows what has actually been reviewed.", to: "/universities", label: "Learn about verification" },
  { icon: Flag, title: "A problem with a user or project?", body: "Use the report controls on a profile or contract. Contract disputes should include the agreed scope, evidence, and the outcome you are requesting.", to: "/disputes", label: "Open disputes" },
];

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-14 sm:px-10 lg:px-16">
      <header className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brass">Support and trust</p>
        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-slate sm:text-5xl">Help when the work matters.</h1>
        <p className="mt-5 text-base leading-relaxed text-slate-300">NexusWork keeps project scope, conversations, deliverables, and milestone decisions together so problems can be resolved from a clear record.</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <a href="mailto:tamneg21@gmail.com" className="inline-flex min-h-11 items-center gap-2 rounded-control bg-brass px-5 py-3 text-sm font-bold text-ink transition-colors hover:bg-brass-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-ink"><Mail className="h-4 w-4" /> Contact support</a>
          <Link to="/terms" className="inline-flex min-h-11 items-center gap-2 rounded-control border border-ink-300 px-5 py-3 text-sm font-bold text-slate transition-colors hover:border-brass hover:text-brass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass">Read platform terms <ArrowUpRight className="h-4 w-4" /></Link>
        </div>
      </header>

      <section className="mt-12 grid gap-4 md:grid-cols-3" aria-labelledby="support-topics">
        <h2 id="support-topics" className="sr-only">Support topics</h2>
        {supportCards.map(({ icon: Icon, title, body, to, label }) => (
          <article key={title} className="rounded-card border border-ink-300 bg-ink-50 p-6 shadow-card">
            <Icon className="h-6 w-6 text-brass" aria-hidden="true" />
            <h3 className="mt-5 font-display text-xl font-bold text-slate">{title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">{body}</p>
            <Link to={to} className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-brass underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass">{label} <ArrowUpRight className="h-4 w-4" /></Link>
          </article>
        ))}
      </section>

      <section className="mt-12 grid gap-8 rounded-card border border-brass/25 bg-brass/10 p-6 sm:p-8 lg:grid-cols-[1fr_1fr]" aria-labelledby="safety-title">
        <div><LifeBuoy className="h-6 w-6 text-brass" aria-hidden="true" /><h2 id="safety-title" className="mt-4 font-display text-2xl font-bold text-slate">A clear path to resolution</h2><p className="mt-3 text-sm leading-relaxed text-slate-300">Keep communication and deliverables inside the active contract. If something goes wrong, pause the milestone and use the dispute process before releasing funds.</p></div>
        <ol className="space-y-3 text-sm text-slate-300"><li><strong className="text-slate">1. Document the issue.</strong> Refer to the brief, milestone, and submitted version.</li><li><strong className="text-slate">2. Try a revision.</strong> Give specific, actionable feedback where appropriate.</li><li><strong className="text-slate">3. Escalate fairly.</strong> Admin review considers the written scope and evidence from both parties.</li></ol>
      </section>
    </div>
  );
}
