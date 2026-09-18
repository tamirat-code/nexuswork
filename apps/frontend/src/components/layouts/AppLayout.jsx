import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../common/Sidebar.jsx";
import NotificationBell from "../common/NotificationBell.jsx";
import ThemeToggle from "../common/ThemeToggle.jsx";
import UserMenu from "../common/UserMenu.jsx";
import NavIcon from "../common/NavIcon.jsx";
import Button from "../ui/Button.jsx";
import Drawer from "../ui/Drawer.jsx";
import CommandPalette from "../common/CommandPalette.jsx";
import WorkspaceFooter from "../common/WorkspaceFooter.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { getWorkspacePageMeta } from "../../config/navigation.js";
import LanguageSelector from "../common/LanguageSelector.jsx";


export default function AppLayout({ children }) {
  const { user } = useAuth();
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();
  const pageMeta = getWorkspacePageMeta(location.pathname, location.hash);

  useEffect(() => setNavOpen(false), [location.pathname]);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-canvas text-content-secondary">
      <div className="flex min-h-0 flex-1 w-full gap-0 bg-[radial-gradient(circle_at_top_left,_rgba(107,143,229,0.12),_transparent_24rem)]">
        {/* ── Desktop sidebar ── */}
        <aside className="sticky top-0 hidden h-screen w-[240px] shrink-0 border-r border-border-subtle bg-sidebar-bg/90 shadow-[inset_-1px_0_0_rgba(148,163,184,0.08)] backdrop-blur-xl lg:flex lg:flex-col">
          <Sidebar role={user?.role} showBrand />
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {/* ── Top header bar ── */}
          <header className="sticky top-0 z-30 flex h-[64px] items-center gap-3 border-b border-border-subtle bg-surface/85 px-4 backdrop-blur-xl sm:px-5 lg:px-6">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              className="lg:hidden"
              aria-label="Open navigation"
              aria-expanded={navOpen}
              onClick={() => setNavOpen(true)}
            >
              <NavIcon name="menu" className="h-5 w-5" />
            </Button>

            {/* Mobile page title */}
            {pageMeta ? (
              <div className="min-w-0 lg:hidden">
                <p className="truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-content-muted">
                  {pageMeta.section}
                </p>
                <h1 className="truncate font-display text-sm font-semibold leading-tight text-content-primary">
                  {pageMeta.label}
                </h1>
              </div>
            ) : (
              <span className="flex items-center gap-2 font-display text-base font-extrabold text-content-primary lg:hidden">
                <img src="/logo.svg" alt="NexusWork" className="h-8 w-8 object-contain" />
                NexusWork
              </span>
            )}

            {/* Desktop page context */}
            {pageMeta && (
              <div className="hidden min-w-0 lg:block">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-content-muted">
                  {pageMeta.section}
                </p>
                <h1 className="truncate font-display text-sm font-semibold leading-tight text-content-primary">
                  {pageMeta.label}
                </h1>
              </div>
            )}

            {/* Header right actions */}
            <div className="ml-auto flex items-center gap-1.5">
              <ThemeToggle />
              <LanguageSelector compact />
              <NotificationBell />
              <UserMenu />
            </div>
          </header>

          {/* ── Page content ── */}
          <main id="main" className="min-w-0 flex-1 bg-[radial-gradient(circle_at_top,_rgba(122,168,216,0.12),_transparent_30rem)] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </main>

          <WorkspaceFooter />
        </div>
      </div>

      {/* Mobile navigation drawer */}
      <Drawer open={navOpen} onClose={() => setNavOpen(false)} title="Navigate" side="left">
        <Sidebar role={user?.role} onNavigate={() => setNavOpen(false)} className="px-0 py-0" />
      </Drawer>

      <CommandPalette />
    </div>
  );
}
