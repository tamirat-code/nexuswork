import { Link } from "react-router-dom";
import { SealMark } from "../../features/auth/components/AuthShell.jsx";

const COLUMNS = [
  {
    title: "Platform",
    links: [
      { to: "/projects", label: "Browse projects" },
      { to: "/search", label: "Search" },
      { to: "/register", label: "Post a project" },
    ],
  },
  {
    title: "Account",
    links: [
      { to: "/login", label: "Log in" },
      { to: "/register", label: "Create an account" },
    ],
  },
  {
    title: "Legal",
    links: [
      { to: "/terms", label: "Terms of Service" },
      { to: "/privacy", label: "Privacy Policy" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-ink-300 bg-ink-50">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div className="max-w-xs">
            <Link to="/" className="inline-flex items-center gap-2">
              <SealMark className="h-5 w-5 text-brass" />
              <span className="font-display text-base tracking-tight text-slate">NexusWork</span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Verified university students, escrow-protected briefs, and milestones funded before work
              starts.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">
                {column.title}
              </p>
              <ul className="space-y-2 text-sm">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-slate-300 transition-colors hover:text-brass">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-ink-300 pt-6 text-xs text-slate-300 sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} NexusWork — Student Freelance Marketplace</span>
          <span>All milestones are escrow-protected.</span>
        </div>
      </div>
    </footer>
  );
}
