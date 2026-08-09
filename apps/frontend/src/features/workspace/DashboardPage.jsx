import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";

const ROLE_COPY = {
  student: {
    heading: "Active proposals and contracts",
    body: "Track proposals you've sent, milestones in progress, and funds released to your wallet.",
    cta: { to: "/projects", label: "Browse open projects" },
  },
  client: {
    heading: "Your posted projects",
    body: "Review incoming proposals, fund milestones, and approve delivered work.",
    cta: { to: "/projects/new", label: "Post a project" },
  },
  university_staff: {
    heading: "Verification queue",
    body: "Confirm student enrollment so verified badges can appear on their proposals.",
    cta: null,
  },
  admin: {
    heading: "Platform overview",
    body: "Monitor activity across clients, students, and universities.",
    cta: null,
  },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const copy = ROLE_COPY[user?.role] ?? ROLE_COPY.student;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <p className="text-xs font-semibold uppercase tracking-widest text-brass">
        {user?.role?.replace("_", " ")}
      </p>
      <h1 className="mt-1 font-display text-3xl text-slate">Welcome, {user?.name}</h1>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-card border border-ink-300 bg-ink-50 p-6 shadow-card sm:col-span-2 lg:col-span-2">
          <h2 className="font-display text-lg text-slate">{copy.heading}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{copy.body}</p>
          {copy.cta && (
            <Link
              to={copy.cta.to}
              className="mt-5 inline-flex h-11 items-center justify-center rounded-control bg-brass px-5 text-sm font-semibold text-ink transition-colors hover:bg-brass-300"
            >
              {copy.cta.label}
            </Link>
          )}
        </div>

        <div className="rounded-card border border-ink-300 bg-ink-50 p-6 shadow-card">
          <h2 className="font-display text-lg text-slate">Wallet</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            View escrow balances and payment history.
          </p>
          <Link
            to="/wallet"
            className="mt-5 inline-flex h-11 items-center justify-center rounded-control border border-ink-300 px-5 text-sm font-semibold text-slate transition-colors hover:bg-ink"
          >
            Go to wallet
          </Link>
        </div>
      </div>
    </div>
  );
}