import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { marketingNav } from "../../config/navigation.js";
import { useAuth } from "../../hooks/useAuth.js";
import Button from "../ui/Button.jsx";
import Drawer from "../ui/Drawer.jsx";
import NavIcon from "./NavIcon.jsx";
import NotificationBell from "./NotificationBell.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import UserMenu from "./UserMenu.jsx";
import { cn } from "../../lib/cn.js";
import LanguageSelector from "./LanguageSelector.jsx";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

  useEffect(() => setMenuOpen(false), [location.pathname]);

  const linkClass = (active) =>
    cn(
      "whitespace-nowrap shrink-0 rounded-control px-4 py-2.5 text-base font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
      active ? "font-bold text-brass bg-brass/10 shadow-sm" : "text-slate-300 hover:text-brass hover:bg-ink-50/70"
    );

  return (
    <header className="sticky top-0 z-40 border-b border-ink-300 bg-ink/95">
      <div className="flex h-[84px] w-full items-center justify-between gap-5 px-4 sm:px-8 lg:px-10">
        <Link to="/" className="group flex shrink-0 items-center gap-3">
          <img src="/logo.svg" alt="NexusWork" className="h-12 w-12 object-contain transition-transform duration-200 group-hover:scale-105" />
          <span className="font-display text-2xl font-extrabold tracking-[-0.02em] text-slate sm:text-[1.7rem]">
            NexusWork
          </span>
        </Link>

        <nav aria-label={t("common.mainNavigation", "Main")} className="hidden items-center gap-1.5 md:flex">
          {marketingNav.map((l) => {
            const active = isNavItemActive(l.to, location.pathname, location.hash);
            return (
              <Link key={l.to} to={l.to} className={linkClass(active)} aria-current={active ? "page" : undefined}>
              <span className="whitespace-nowrap">
                {t(`navigation.${l.translationKey || l.to.slice(1).split("/")[0] || "home"}`, { defaultValue: l.label })}
              </span>
              </Link>
            );
          })}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 md:flex">
          <ThemeToggle />
          <LanguageSelector compact />
          {user ? (
            <>
              <NotificationBell />
              <UserMenu />
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  {t("auth.login", "Log in")}
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm">
                  {t("auth.signup", "Sign up")}
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
          aria-label={t("common.openMenu", "Open menu")}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <NavIcon name="menu" className="h-5 w-5" />
        </Button>
      </div>

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title={t("common.menu", "Menu")} side="right">
        <nav aria-label={t("common.mobileNavigation", "Mobile")} className="flex flex-col gap-1">
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
                {t(`navigation.${l.translationKey || l.to.split("/")[1] || "home"}`, { defaultValue: l.label })}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 space-y-2.5 border-t border-ink-300 pt-6">
          {user ? (
            <>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)}>
              <Button fullWidth size="md">{t("navigation.dashboard", "Go to dashboard")}</Button>
              </Link>
              <Link to="/notifications" onClick={() => setMenuOpen(false)}>
                <Button variant="secondary" fullWidth size="md">
                  {t("navigation.notifications", "Notifications")}
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/register" onClick={() => setMenuOpen(false)}>
                <Button fullWidth size="md">{t("auth.createAccount", "Create an account")}</Button>
              </Link>
              <Link to="/login" onClick={() => setMenuOpen(false)}>
                <Button variant="secondary" fullWidth size="md">
                  {t("auth.login", "Log in")}
                </Button>
              </Link>
            </>
          )}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-semibold text-slate-300">{t("common.theme", "Theme")}</span>
            <ThemeToggle />
          </div>
        </div>
      </Drawer>
    </header>
  );
}
