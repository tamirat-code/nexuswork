export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="font-display text-3xl text-ink mb-2">Terms of Service</h1>
      <p className="text-xs text-slate mb-8">Version 1.0 — placeholder text</p>
      <p className="text-sm text-brick bg-brick-100 rounded-card p-4 mb-8">
        This is placeholder legal text for development. Replace with real Terms of Service drafted
        or reviewed by an actual lawyer before taking real users or real payments in production.
      </p>
      <div className="space-y-4 text-sm text-ink-500 leading-relaxed">
        <p>By creating an account on NexusWork, you agree to use the platform to post or complete
        real project work in good faith, to fund milestones you intend to pay for, and to deliver
        work you're being paid for.</p>
        <p>NexusWork charges a commission on completed milestones, disclosed before you fund one.
        Disputes are reviewed by platform staff and resolved according to the escrow terms shown
        at the time a milestone is created.</p>
      </div>
    </div>
  );
}