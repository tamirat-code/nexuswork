import { Link } from "react-router-dom";

export default function WorkspaceFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-ink-300 bg-ink-50 px-6 py-8 shadow-card">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="NexusWork" className="h-9 w-9 object-contain" />
          <div>
            <span className="font-display text-lg font-extrabold tracking-tight text-slate">NexusWork</span>
            <p className="text-xs text-slate-400">Escrow-protected student freelance marketplace</p>
          </div>
        </div>

        <nav aria-label="Workspace Footer" className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-300">
          <Link to="/projects" className="transition-colors hover:text-brass">
            Projects
          </Link>
          <Link to="/contracts" className="transition-colors hover:text-brass">
            Contracts
          </Link>
          <Link to="/wallet" className="transition-colors hover:text-brass">
            Wallet
          </Link>
          <Link to="/terms" className="transition-colors hover:text-brass">
            Terms
          </Link>
          <Link to="/privacy" className="transition-colors hover:text-brass">
            Privacy
          </Link>
        </nav>

        <div className="flex items-center gap-2 rounded-full border border-escrow/30 bg-escrow-100 px-3 py-1 text-xs font-bold text-escrow">
          <span className="h-2 w-2 rounded-full bg-escrow animate-pulse" aria-hidden="true" />
          <span>Escrow Active & Operational</span>
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-6xl border-t border-ink-300/60 pt-4 text-center text-xs text-slate-400">
        © {year} NexusWork. All rights reserved. University student verification & escrow milestone protection enabled.
      </div>
    </footer>
  );
}
