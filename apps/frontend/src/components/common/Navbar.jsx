import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../hooks/useAuth.js";
import { SealMark } from "../../features/auth/components/AuthShell.jsx";
import Button from "../ui/Button.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { to: "/projects", label: "Browse projects" },
    ...(user?.role === "client" ? [{ to: "/projects/new", label: "Post a project" }] : []),
    ...(user ? [{ to: "/dashboard", label: "Dashboard" }, { to: "/wallet", label: "Wallet" }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-paper/90 backdrop-blur">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <SealMark className="h-6 w-6 text-ink" />
          <span className="font-display text-lg text-ink">NexusWork</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="text-ink-500 hover:text-ink transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <Button variant="secondary" size="sm" onClick={logout}>
              Log out
            </Button>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-ink-500 hover:text-ink px-2">
                Log in
              </Link>
              <Link to="/register">
                <Button size="sm">Sign up</Button>
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="md:hidden p-2 -mr-2 text-ink"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileOpen ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-t border-ink-100 bg-paper"
          >
            <div className="px-6 py-4 flex flex-col gap-4 text-sm">
              {links.map((l) => (
                <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)} className="text-ink-500">
                  {l.label}
                </Link>
              ))}
              <div className="h-px bg-ink-100" />
              {user ? (
                <button onClick={logout} className="text-left text-brick font-medium">
                  Log out
                </button>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="text-ink-500">
                    Log in
                  </Link>
                  <Link to="/register" onClick={() => setMobileOpen(false)} className="font-semibold text-ink">
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}