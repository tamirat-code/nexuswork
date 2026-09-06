import { Link } from "react-router-dom";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";

const LAST_UPDATED = "September 6, 2026";
const SUPPORT_EMAIL = "tamneg21@gmail.com";

const policies = [
  { title: "Refunds and cancellations", body: "Before a milestone is funded, parties can revise the scope or cancel the work. After funding, unresolved disagreements should move through the dispute process so the payment record remains intact." },
  { title: "Revisions and acceptance", body: "A revision request should identify what is missing from the agreed milestone. Approval confirms that the submitted deliverable meets the written scope and starts the release process." },
  { title: "Portfolio consent", body: "Approved work is not automatically public. A client must consent before project-specific work or information is displayed in a student portfolio." },
  { title: "Community and account safety", body: "Fraud, harassment, impersonation, unsafe files, payment manipulation, and attempts to bypass escrow may lead to review, suspension, or account removal." },
];

export default function PoliciesPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-14 sm:px-10">
      <header className="border-b border-ink-300 pb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brass">Platform policies</p>
        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-slate">Clear rules for fair work.</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300">These summaries explain how NexusWork handles common decisions. The full legal agreements remain authoritative.</p>
        <p className="mt-4 text-xs text-slate-400">Policy summary · Version 1.0 · Effective {LAST_UPDATED}</p>
      </header>
      <main className="mt-8 space-y-4" aria-label="NexusWork policies">
        {policies.map((policy) => <article key={policy.title} className="rounded-card border border-ink-300 bg-ink-50 p-6 shadow-card"><div className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-escrow" aria-hidden="true" /><div><h2 className="font-display text-xl font-bold text-slate">{policy.title}</h2><p className="mt-2 text-sm leading-relaxed text-slate-300">{policy.body}</p></div></div></article>)}
      </main>
      <div className="mt-9 flex flex-wrap gap-4 text-sm font-semibold"><Link to="/terms" className="inline-flex items-center gap-1 text-brass hover:underline">Terms of Service <ArrowUpRight className="h-4 w-4" /></Link><Link to="/privacy" className="inline-flex items-center gap-1 text-brass hover:underline">Privacy Policy <ArrowUpRight className="h-4 w-4" /></Link><Link to="/support" className="inline-flex items-center gap-1 text-brass hover:underline">Contact support <ArrowUpRight className="h-4 w-4" /></Link></div>
      <p className="mt-5 text-sm leading-relaxed text-slate-300">Questions about a policy? Email <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-brass hover:underline">{SUPPORT_EMAIL}</a>.</p>
    </div>
  );
}
