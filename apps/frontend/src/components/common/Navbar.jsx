import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../hooks/useAuth.js";
import { SealMark } from "../../features/auth/components/AuthShell.jsx";
import Button from "../ui/Button.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const links = [
    { to: "/projects", label: "Browse projects" },
    { to: "/search", label: "Search" },
    ...(user?.role === "client" ? [{ to: "/projects/new", label: "Post a project" }] : []),
    ...(user ? [{ to: "/dashboard", label: "Dashboard" }, { to: "/wallet", label: "Wallet" }] : []),
  ];

  const linkClass = ({ isActive }) =>
    `text-sm transition-colors ${isActive ? "font-semibold text-brass" : "text-slate-300 hover:text-slate"}`;

  return (
    <header className="sticky top-0 z-40 border-b border-ink-300 bg-ink/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <SealMark className="h-5 w-5 text-brass" />
          <span className="font-display text-base tracking-tight text-slate">NexusWork</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === "/projects"} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <Button variant="secondary" size="sm" onClick={logout}>
              Log out
            </Button>
          ) : (
            <>
              <Link
                to="/login"
                className="px-1 text-sm font-medium text-slate-300 transition-colors hover:text-slate"
              >
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
          className="-mr-2 p-2 text-slate md:hidden"
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
            aria-label="Mobile"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-ink-300 bg-ink md:hidden"
          >
            <div className="flex flex-col gap-3 px-6 py-4 text-sm">
              {links.map((l) => (
                <NavLink key={l.to} to={l.to} end={l.to === "/projects"} className={linkClass}>
                  {l.label}
                </NavLink>
              ))}
              <div className="my-1 h-px bg-ink-300" />
              {user ? (
                <button onClick={logout} className="text-left font-medium text-brick">
                  Log out
                </button>
              ) : (
                <>
                  <Link to="/login" className="text-slate-300">
                    Log in
                  </Link>
                  <Link to="/register" className="font-semibold text-brass">
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
