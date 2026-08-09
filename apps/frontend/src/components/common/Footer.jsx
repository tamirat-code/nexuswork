import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-ink-300">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-slate-300 sm:flex-row">
        <span>© {new Date().getFullYear()} NexusWork — Student Freelance Marketplace</span>
        <nav aria-label="Footer" className="flex gap-6">
          <Link to="/terms" className="transition-colors hover:text-brass">
            Terms
          </Link>
          <Link to="/privacy" className="transition-colors hover:text-brass">
            Privacy
          </Link>
        </nav>
      </div>
    </footer>
  );
}