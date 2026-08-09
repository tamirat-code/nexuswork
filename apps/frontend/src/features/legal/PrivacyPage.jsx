export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="font-display text-3xl text-ink mb-2">Privacy Policy</h1>
      <p className="text-xs text-slate mb-8">Version 1.0 — placeholder text</p>
      <p className="text-sm text-brick bg-brick-100 rounded-card p-4 mb-8">
        This is placeholder legal text for development. Replace with a real Privacy Policy drafted
        or reviewed by an actual lawyer before taking real users or real payments in production.
      </p>
      <div className="space-y-4 text-sm text-ink-500 leading-relaxed">
        <p>NexusWork collects your name, email, and role to operate your account, and payment
        details are processed directly by Stripe — NexusWork never stores your card number.</p>
        <p>University staff email domains are used solely to verify institutional affiliation.
        We don't sell your data to third parties.</p>
      </div>
    </div>
  );
}