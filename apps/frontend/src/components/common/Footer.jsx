import { Link } from "react-router-dom";

const columns = [
  {
    title: "Marketplace",
    links: [
      { to: "/projects", label: "Browse projects" },
      { to: "/students", label: "Find talent" },
      { to: "/skills", label: "Skills directory" },
    ],
  },
  {
    title: "Community",
    links: [
      { to: "/universities", label: "For universities" },
      { to: "/learning", label: "Learning hub" },
      { to: "/portfolios", label: "Portfolios" },
    ],
  },
  {
    title: "Legal",
    links: [
      { to: "/terms", label: "Terms of service" },
      { to: "/privacy", label: "Privacy policy" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-ink-300 bg-ink">
      <div className="grid w-full gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4 sm:px-10 lg:px-16">
        <div>
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="NexusWork" className="h-9 w-9 object-contain" />
            <span className="font-display text-lg font-extrabold tracking-tight text-slate">NexusWork</span>
          </Link>
          <p className="mt-3 max-w-xs text-xs leading-relaxed text-slate-300">
            Student talent, real client work, milestones funded in escrow before anyone starts.
          </p>
        </div>

        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="text-[11px] font-bold uppercase tracking-widest text-brass">{col.title}</p>
            <ul className="mt-3.5 space-y-2 text-xs">
              {col.links.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-slate-300 transition-colors hover:text-brass">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-ink-300">
        <div className="flex w-full flex-col items-center justify-between gap-2 px-6 py-5 text-xs text-slate-300 sm:flex-row sm:px-10 lg:px-16">
          <span>© {new Date().getFullYear()} NexusWork — Student Freelance Marketplace</span>
          <span>Built for university talent · Escrow-backed payments</span>
        </div>
      </div>
    </footer>
  );
}
