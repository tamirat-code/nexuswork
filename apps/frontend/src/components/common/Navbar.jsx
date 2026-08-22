import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { marketingNav } from "../../config/navigation.js";
import { SealMark } from "../../features/auth/components/AuthShell.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import Button from "../ui/Button.jsx";
import Drawer from "../ui/Drawer.jsx";
import NavIcon from "./NavIcon.jsx";
import NotificationBell from "./NotificationBell.jsx";
import UserMenu from "./UserMenu.jsx";
import { cn } from "../../lib/cn.js";

/**
 * A plain NavLink only compares `pathname`, so "/", "/#how-it-works" and
 * "/#faq" (all pathname "/") would light up together. This checks the hash
 * too, and falls back to prefix-matching for ordinary routes.
 */
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

/** Public site header. Signed-in users get the workspace shell instead. */
export default function Navbar() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setMenuOpen(false), [location.pathname]);

  const linkClass = (active) =>
    cn(
      "rounded-control px-1 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
      active ? "font-semibold text-brass" : "text-slate-300 hover:text-brass"
    );

  return (
    <header className="sticky top-0 z-40 border-b border-ink-300 bg-ink/90 backdrop-blur">
      <div className="flex h-16 w-full items-center justify-between gap-4 px-6 sm:px-8 lg:px-10">
        <Link to="/" className="flex items-center gap-2">
          <SealMark className="h-6 w-6 text-brass" />
          <span className="font-display text-lg text-slate">NexusWork</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-6 md:flex">
          {marketingNav.map((l) => {
            const active = isNavItemActive(l.to, location.pathname, location.hash);
            return (
              <Link key={l.to} to={l.to} className={linkClass(active)} aria-current={active ? "page" : undefined}>
                <span className="flex items-center gap-1.5">
                  <NavIcon name={l.icon} className="h-4 w-4" />
                  {l.label}
                </span>
              </Link>
            );
          })}
        </nav>

                <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <NotificationBell />
              <UserMenu />
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Sign up</Button>
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
                  "flex items-center gap-2.5 rounded-control px-3 py-2.5 text-sm",
                  active ? "bg-brass/12 font-semibold text-brass" : "text-slate-300 hover:bg-ink-50"
                )}
              >
                <NavIcon name={l.icon} className="h-4 w-4" />
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 space-y-2 border-t border-ink-300 pt-6">
          {user ? (
            <>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)}>
                <Button fullWidth>Go to dashboard</Button>
              </Link>
              <Link to="/notifications" onClick={() => setMenuOpen(false)}>
                <Button variant="secondary" fullWidth>
                  Notifications
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/register" onClick={() => setMenuOpen(false)}>
                <Button fullWidth>Create an account</Button>
              </Link>
              <Link to="/login" onClick={() => setMenuOpen(false)}>
                <Button variant="secondary" fullWidth>
                  Log in
                </Button>
              </Link>
            </>
          )}
        </div>
      </Drawer>
    </header>
  );
}