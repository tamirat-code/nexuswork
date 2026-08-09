export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="max-w-2xl">
        <h1 className="mb-2 font-display text-3xl text-slate">Privacy Policy</h1>
        <p className="mb-8 text-xs text-slate-300">Version 1.0 — placeholder text</p>
        <p className="mb-8 rounded-card bg-brick-100 p-4 text-sm text-brick">
          This is placeholder legal text for development. Replace with a real Privacy Policy drafted
          or reviewed by an actual lawyer before taking real users or real payments in production.
        </p>
        <div className="space-y-4 text-sm leading-relaxed text-slate-300">
          <p>
            NexusWork collects your name, email, and role to operate your account, and payment
            details are processed directly by Stripe — NexusWork never stores your card number.
          </p>
          <p>
            University staff email domains are used solely to verify institutional affiliation.
            We don't sell your data to third parties.
          </p>
        </div>
      </div>
    </div>
  );
}