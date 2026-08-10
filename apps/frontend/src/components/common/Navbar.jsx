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
    {
      to: "/",
      label: "Home",
    },
    {
      to: "/projects",
      label: "Browse projects",
    },
    {
      to: "/search",
      label: "Search",
    },
    {
      to: "/students",
      label: "Students",
    },
    {
      to: "/university",
      label: "University",
    },
    {
      to: "/about",
      label: "About",
    },

    ...(user?.role === "client"
      ? [
          {
            to: "/projects/new",
            label: "Post a project",
          },
        ]
      : []),

    ...(user
      ? [
          {
            to: "/dashboard",
            label: "Dashboard",
          },
          {
            to: "/wallet",
            label: "Wallet",
          },
        ]
      : []),
  ];

  const linkClass = ({ isActive }) =>
    `text-sm transition-colors ${
      isActive
        ? "font-semibold text-brass"
        : "text-slate-300 hover:text-slate"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-ink-300 bg-ink/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* =================================================
            LOGO
        ================================================= */}
        <Link
          to="/"
          className="flex items-center gap-2"
          aria-label="NexusWork home"
        >
          <SealMark className="h-7 w-7 text-brass" />

          <span className="font-display text-lg font-semibold tracking-tight text-slate">
            NexusWork
          </span>
        </Link>

        {/* =================================================
            DESKTOP NAVIGATION
        ================================================= */}
        <nav
          aria-label="Main"
          className="hidden items-center gap-6 md:flex"
        >
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={
                link.to === "/" ||
                link.to === "/projects"
              }
              className={linkClass}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* =================================================
            DESKTOP AUTH BUTTONS
        ================================================= */}
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={logout}
            >
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
                <Button size="sm">
                  Sign up
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* =================================================
            MOBILE MENU BUTTON
        ================================================= */}
        <button
          type="button"
          className="-mr-2 p-2 text-slate md:hidden"
          aria-label={
            mobileOpen
              ? "Close menu"
              : "Open menu"
          }
          aria-expanded={mobileOpen}
          onClick={() =>
            setMobileOpen((value) => !value)
          }
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            {mobileOpen ? (
              <>
                <path d="M6 6l12 12" />
                <path d="M6 18L18 6" />
              </>
            ) : (
              <>
                <path d="M4 7h16" />
                <path d="M4 12h16" />
                <path d="M4 17h16" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* =================================================
          MOBILE NAVIGATION
      ================================================= */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            aria-label="Mobile"
            initial={{
              height: 0,
              opacity: 0,
            }}
            animate={{
              height: "auto",
              opacity: 1,
            }}
            exit={{
              height: 0,
              opacity: 0,
            }}
            transition={{
              duration: 0.2,
            }}
            className="overflow-hidden border-t border-ink-300 bg-ink md:hidden"
          >
            <div className="flex flex-col gap-3 px-6 py-4 text-sm">
              {/* Mobile Links */}
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={
                    link.to === "/" ||
                    link.to === "/projects"
                  }
                  className={linkClass}
                >
                  {link.label}
                </NavLink>
              ))}

              {/* Divider */}
              <div className="my-1 h-px bg-ink-300" />

              {/* Mobile Authentication */}
              {user ? (
                <button
                  type="button"
                  onClick={logout}
                  className="text-left font-medium text-brick"
                >
                  Log out
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-slate-300 transition-colors hover:text-slate"
                  >
                    Log in
                  </Link>

                  <Link
                    to="/register"
                    className="font-semibold text-brass"
                  >
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