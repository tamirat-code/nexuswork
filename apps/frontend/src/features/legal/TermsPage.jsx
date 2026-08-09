export default function TermsPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="max-w-2xl">
        <h1 className="mb-2 font-display text-3xl text-slate">Terms of Service</h1>
        <p className="mb-8 text-xs text-slate-300">Version 1.0 — placeholder text</p>
        <p className="mb-8 rounded-card bg-brick-100 p-4 text-sm text-brick">
          This is placeholder legal text for development. Replace with real Terms of Service drafted
          or reviewed by an actual lawyer before taking real users or real payments in production.
        </p>
        <div className="space-y-4 text-sm leading-relaxed text-slate-300">
          <p>
            By creating an account on NexusWork, you agree to use the platform to post or complete
            real project work in good faith, to fund milestones you intend to pay for, and to deliver
            work you're being paid for.
          </p>
          <p>
            NexusWork charges a commission on completed milestones, disclosed before you fund one.
            Disputes are reviewed by platform staff and resolved according to the escrow terms shown
            at the time a milestone is created.
          </p>
        </div>
      </div>
    </div>
  );
}