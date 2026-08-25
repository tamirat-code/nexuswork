import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { marketingNav } from "../../config/navigation.js";
import { SealMark } from "../../features/auth/components/AuthShell.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import Button from "../ui/Button.jsx";
import Drawer from "../ui/Drawer.jsx";
import NavIcon from "./NavIcon.jsx";
import NotificationBell from "./NotificationBell.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import UserMenu from "./UserMenu.jsx";
import { cn } from "../../lib/cn.js";

function isNavItemActive(to, pathname, hash) {
  const [toPath, toHash] = to.split("#");
  const path = toPath || "/";

  if (toHash) {
    return pathname === path && hash === `#${toHash}`;
  }
  if (hash) return false;
  if (path === "/") return pathname === "/";
  return pathname === path || pathname.startsWith(`${path}/`);
}

/** Public site header — sleek, professional single-line navigation bar. */
export default function Navbar() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setMenuOpen(false), [location.pathname]);

  const linkClass = (active) =>
    cn(
      "whitespace-nowrap shrink-0 rounded-control px-2.5 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
      active ? "font-bold text-brass" : "text-slate-300 hover:text-brass"
    );

  return (
    <header className="sticky top-0 z-40 border-b border-ink-300 bg-ink/95 backdrop-blur-md">
      <div className="flex h-16 w-full items-center justify-between gap-4 px-4 sm:h-[68px] sm:px-8 lg:px-10">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <SealMark className="h-7 w-7 text-brass" />
          <span className="font-display text-xl font-bold tracking-tight text-slate">
            NexusWork
          </span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-2.5 lg:gap-5 md:flex">
          {marketingNav.map((l) => {
            const active = isNavItemActive(l.to, location.pathname, location.hash);
            return (
              <Link key={l.to} to={l.to} className={linkClass(active)} aria-current={active ? "page" : undefined}>
                <span className="flex items-center gap-1.5 whitespace-nowrap">
                  <NavIcon name={l.icon} className="h-4 w-4 shrink-0" />
                  {l.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 md:flex">
          <ThemeToggle />
          {user ? (
            <>
              <NotificationBell />
              <UserMenu />
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm" className="font-semibold">
                  Log in
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="font-bold shadow-card">
                  Sign up
                </Button>
              </Link>
            </>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          iconOnly
          className="md:hidden"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <NavIcon name="menu" className="h-5 w-5" />
        </Button>
      </div>

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu" side="right">
        <nav aria-label="Mobile" className="flex flex-col gap-1">
          {marketingNav.map((l) => {
            const active = isNavItemActive(l.to, location.pathname, location.hash);
            return (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setMenuOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-control px-3.5 py-2.5 text-sm font-semibold",
                  active ? "bg-brass/15 font-bold text-brass" : "text-slate-300 hover:bg-ink-50"
                )}
              >
                <NavIcon name={l.icon} className="h-4 w-4 shrink-0" />
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 space-y-2.5 border-t border-ink-300 pt-6">
          {user ? (
            <>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)}>
                <Button fullWidth size="md">Go to dashboard</Button>
              </Link>
              <Link to="/notifications" onClick={() => setMenuOpen(false)}>
                <Button variant="secondary" fullWidth size="md">
                  Notifications
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/register" onClick={() => setMenuOpen(false)}>
                <Button fullWidth size="md">Create an account</Button>
              </Link>
              <Link to="/login" onClick={() => setMenuOpen(false)}>
                <Button variant="secondary" fullWidth size="md">
                  Log in
                </Button>
              </Link>
            </>
          )}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-semibold text-slate-300">Theme</span>
            <ThemeToggle />
          </div>
        </div>
      </Drawer>
    </header>
  );
}